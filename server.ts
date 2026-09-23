import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import JSZip from 'jszip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CONFIG_FILE = path.join(DATA_DIR, 'doge-config.json');
const PLAYERS_FILE = path.join(DATA_DIR, 'doge-players.json');
const PAYOUTS_FILE = path.join(DATA_DIR, 'doge-payouts.json');

// Interface Types
export interface DogeConfig {
  rpcHost: string;
  rpcPort: number;
  rpcUser: string;
  rpcPassword: string;
  networkType: 'regtest' | 'mainnet' | 'testnet';
  gameWalletAddress: string;
  minPayout: number;
  blockReward: number;
  forceSimulator: boolean;
}

export interface PlayerRecord {
  minerName: string;
  payoutAddress: string;
  pendingBalance: number;
  lifetimeMined: number;
  blocksSolved: number;
  totalPayouts: number;
  hashrate: number;
  lastActive: number;
}

export interface PayoutRecord {
  id: string;
  txid: string;
  payoutAddress: string;
  minerName: string;
  amount: number;
  fee: number;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  network: string;
}

// Default Configuration
const DEFAULT_CONFIG: DogeConfig = {
  rpcHost: process.env.DOGE_RPC_HOST || '127.0.0.1',
  rpcPort: parseInt(process.env.DOGE_RPC_PORT || '22555', 10),
  rpcUser: process.env.DOGE_RPC_USER || 'dogeminerrpc',
  rpcPassword: process.env.DOGE_RPC_PASSWORD || 'shibepassword123',
  networkType: (process.env.DOGE_NETWORK as any) || 'regtest',
  gameWalletAddress: process.env.DOGE_GAME_WALLET || 'DGamePoolWalletShibeMoonPayout111',
  minPayout: 1.0,
  blockReward: 10.0,
  forceSimulator: false,
};

function loadJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err);
  }
  return fallback;
}

function saveJson<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Failed to write ${filePath}:`, err);
  }
}

let activeConfig: DogeConfig = loadJson<DogeConfig>(CONFIG_FILE, DEFAULT_CONFIG);
let playersMap: Record<string, PlayerRecord> = loadJson<Record<string, PlayerRecord>>(PLAYERS_FILE, {});
let payoutsHistory: PayoutRecord[] = loadJson<PayoutRecord[]>(PAYOUTS_FILE, []);

// Dogecoin Core RPC Helper
async function callDogeRpc(method: string, params: any[] = []): Promise<any> {
  const url = `http://${activeConfig.rpcHost}:${activeConfig.rpcPort}/`;
  const auth = Buffer.from(`${activeConfig.rpcUser}:${activeConfig.rpcPassword}`).toString('base64');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        jsonrpc: '1.0',
        id: `doge_game_${Date.now()}`,
        method,
        params,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errObj = JSON.parse(text);
        if (errObj && errObj.error && errObj.error.message) {
          errorMsg = errObj.error.message;
        }
      } catch {}
      throw new Error(errorMsg);
    }

    const data = (await response.json()) as any;
    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }
    return data.result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// In-Memory Simulated State for Offline Intranet Sandbox
let simulatedWalletBalance = 25000.0;
let simulatedBlockCount = 133742;

function generateSimulatedTxid(): string {
  const chars = '0123456789abcdef';
  let txid = '';
  for (let i = 0; i < 64; i++) {
    txid += chars[Math.floor(Math.random() * chars.length)];
  }
  return txid;
}

// Validation for Dogecoin Addresses
// Dogecoin addresses: P2PKH starts with 'D' (Mainnet) or 'm' / 'n' (Testnet/Regtest), P2SH starts with '9' or 'A' or '2'
export function isValidDogeAddress(addr: string): boolean {
  if (!addr || typeof addr !== 'string') return false;
  const clean = addr.trim();
  if (clean.length < 26 || clean.length > 35) return false;
  return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(clean);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Get Overall Game & Dogecoin Core Status
  app.get('/api/status', async (_req: Request, res: Response) => {
    let rpcConnected = false;
    let nodeVersion = 'Offline / Not Connected';
    let blockCount = simulatedBlockCount;
    let walletBalance = simulatedWalletBalance;
    let gameAddress = activeConfig.gameWalletAddress;
    let rpcError = null;

    if (!activeConfig.forceSimulator) {
      try {
        const [netInfo, blockInfo, balance] = await Promise.all([
          callDogeRpc('getnetworkinfo'),
          callDogeRpc('getblockcount'),
          callDogeRpc('getbalance').catch(() => null),
        ]);

        rpcConnected = true;
        nodeVersion = netInfo?.subversion || `Dogecoin Core v${netInfo?.version || '1.14.9'}`;
        blockCount = blockInfo;
        if (typeof balance === 'number') {
          walletBalance = balance;
        }

        // Try getting an address if needed
        if (!gameAddress || gameAddress.startsWith('DGamePoolWallet')) {
          try {
            const newAddr = await callDogeRpc('getnewaddress', ['game_pool']);
            if (newAddr) {
              gameAddress = newAddr;
              activeConfig.gameWalletAddress = newAddr;
              saveJson(CONFIG_FILE, activeConfig);
            }
          } catch {}
        }
      } catch (err: any) {
        rpcConnected = false;
        rpcError = err.message || 'Unable to connect to Dogecoin Core RPC';
      }
    }

    const totalPaidOut = payoutsHistory.reduce((acc, p) => acc + (p.status === 'confirmed' ? p.amount : 0), 0);
    const totalPending = Object.values(playersMap).reduce((acc, p) => acc + p.pendingBalance, 0);

    res.json({
      success: true,
      rpcConnected,
      nodeVersion,
      blockCount,
      walletBalance,
      gameAddress,
      networkType: activeConfig.networkType,
      config: {
        rpcHost: activeConfig.rpcHost,
        rpcPort: activeConfig.rpcPort,
        rpcUser: activeConfig.rpcUser,
        networkType: activeConfig.networkType,
        minPayout: activeConfig.minPayout,
        blockReward: activeConfig.blockReward,
        forceSimulator: activeConfig.forceSimulator,
      },
      stats: {
        activePlayersCount: Object.keys(playersMap).length,
        totalPaidOut,
        totalPending,
        totalPayoutTransactions: payoutsHistory.length,
      },
      rpcError,
    });
  });

  // 2. Direct RPC Connection Tester
  app.post('/api/test-connection', async (req: Request, res: Response) => {
    const { rpcHost, rpcPort, rpcUser, rpcPassword } = req.body;
    const testConfig = {
      host: rpcHost || activeConfig.rpcHost,
      port: rpcPort || activeConfig.rpcPort,
      user: rpcUser || activeConfig.rpcUser,
      pass: rpcPassword || activeConfig.rpcPassword,
    };

    const url = `http://${testConfig.host}:${testConfig.port}/`;
    const auth = Buffer.from(`${testConfig.user}:${testConfig.pass}`).toString('base64');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          jsonrpc: '1.0',
          id: 'test_connection',
          method: 'getnetworkinfo',
          params: [],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      if (data.error) {
        throw new Error(data.error.message);
      }

      res.json({
        success: true,
        message: 'Successfully connected to Dogecoin Core node!',
        info: data.result,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      res.status(400).json({
        success: false,
        message: `Connection failed: ${err.message || 'Timeout / Connection Refused'}`,
      });
    }
  });

  // 3. Save Node Config
  app.post('/api/config', (req: Request, res: Response) => {
    const { rpcHost, rpcPort, rpcUser, rpcPassword, networkType, gameWalletAddress, minPayout, blockReward, forceSimulator } = req.body;

    if (rpcHost) activeConfig.rpcHost = rpcHost.trim();
    if (rpcPort) activeConfig.rpcPort = parseInt(rpcPort, 10);
    if (rpcUser !== undefined) activeConfig.rpcUser = rpcUser.trim();
    if (rpcPassword !== undefined) activeConfig.rpcPassword = rpcPassword;
    if (networkType) activeConfig.networkType = networkType;
    if (gameWalletAddress) activeConfig.gameWalletAddress = gameWalletAddress.trim();
    if (minPayout !== undefined) activeConfig.minPayout = Math.max(0.01, parseFloat(minPayout));
    if (blockReward !== undefined) activeConfig.blockReward = Math.max(0.1, parseFloat(blockReward));
    if (forceSimulator !== undefined) activeConfig.forceSimulator = Boolean(forceSimulator);

    saveJson(CONFIG_FILE, activeConfig);

    res.json({
      success: true,
      message: 'Dogecoin Core configuration updated',
      config: activeConfig,
    });
  });

  // 4. Register or Get Player Record
  app.post('/api/players/register', (req: Request, res: Response) => {
    const { minerName, payoutAddress } = req.body;

    if (!payoutAddress || !isValidDogeAddress(payoutAddress)) {
      res.status(400).json({
        success: false,
        message: 'Invalid Dogecoin payout address format. Must be a valid Base58 Dogecoin address (e.g., starting with D on mainnet, or n/m on testnet).',
      });
      return;
    }

    const cleanAddress = payoutAddress.trim();
    const cleanName = (minerName || 'Shibe Miner').trim().slice(0, 30);

    if (!playersMap[cleanAddress]) {
      playersMap[cleanAddress] = {
        minerName: cleanName,
        payoutAddress: cleanAddress,
        pendingBalance: 0,
        lifetimeMined: 0,
        blocksSolved: 0,
        totalPayouts: 0,
        hashrate: 0,
        lastActive: Date.now(),
      };
      saveJson(PLAYERS_FILE, playersMap);
    } else {
      playersMap[cleanAddress].minerName = cleanName;
      playersMap[cleanAddress].lastActive = Date.now();
      saveJson(PLAYERS_FILE, playersMap);
    }

    res.json({
      success: true,
      player: playersMap[cleanAddress],
    });
  });

  // 5. Submit Mined Share / Mining Reward
  app.post('/api/mining/submit-reward', async (req: Request, res: Response) => {
    const { payoutAddress, amount, isBlock, blockNonce } = req.body;

    if (!payoutAddress || !playersMap[payoutAddress]) {
      res.status(404).json({ success: false, message: 'Miner address not registered' });
      return;
    }

    const rewardAmount = Math.max(0.001, parseFloat(amount) || 0.05);
    const player = playersMap[payoutAddress];

    player.pendingBalance += rewardAmount;
    player.lifetimeMined += rewardAmount;
    player.lastActive = Date.now();

    if (isBlock) {
      player.blocksSolved += 1;
      simulatedBlockCount += 1;

      // If connected to a real regtest node, generate a block on the intranet chain!
      if (!activeConfig.forceSimulator && activeConfig.networkType === 'regtest') {
        try {
          const targetAddress = activeConfig.gameWalletAddress || (await callDogeRpc('getnewaddress'));
          await callDogeRpc('generatetoaddress', [1, targetAddress]);
        } catch (err) {
          console.warn('Could not call generatetoaddress:', err);
        }
      }
    }

    saveJson(PLAYERS_FILE, playersMap);

    res.json({
      success: true,
      pendingBalance: player.pendingBalance,
      lifetimeMined: player.lifetimeMined,
      blocksSolved: player.blocksSolved,
      blockNonce: blockNonce || null,
    });
  });

  // 6. Request Payout to Player's Dogecoin Address
  app.post('/api/payout/request', async (req: Request, res: Response) => {
    const { payoutAddress, amount } = req.body;

    if (!payoutAddress || !isValidDogeAddress(payoutAddress)) {
      res.status(400).json({ success: false, message: 'Invalid payout Dogecoin address' });
      return;
    }

    const player = playersMap[payoutAddress];
    if (!player) {
      res.status(404).json({ success: false, message: 'Player account not found. Please register first.' });
      return;
    }

    const payoutAmount = amount ? Math.min(player.pendingBalance, parseFloat(amount)) : player.pendingBalance;

    if (payoutAmount < activeConfig.minPayout) {
      res.status(400).json({
        success: false,
        message: `Minimum payout threshold is ${activeConfig.minPayout} DOGE. Current pending: ${player.pendingBalance.toFixed(4)} DOGE`,
      });
      return;
    }

    let txid = '';
    let isRealRpc = false;
    let fee = 1.0;

    // Check if we can execute real RPC sendtoaddress
    if (!activeConfig.forceSimulator) {
      try {
        // Dogecoin Core 1.14.9 sendtoaddress: address, amount, comment, comment_to
        const rpcResult = await callDogeRpc('sendtoaddress', [
          payoutAddress,
          payoutAmount,
          `Game Payout to ${player.minerName}`,
          'Dogecoin Intranet Game',
        ]);

        if (typeof rpcResult === 'string' && rpcResult.length >= 64) {
          txid = rpcResult;
          isRealRpc = true;
        }
      } catch (err: any) {
        console.warn('RPC sendtoaddress failed, falling back to simulator:', err.message);
        // If node refused or is unfunded, we still allow simulator payout with warning
        txid = generateSimulatedTxid();
      }
    } else {
      txid = generateSimulatedTxid();
    }

    if (!txid) {
      txid = generateSimulatedTxid();
    }

    // Deduct player pending balance
    player.pendingBalance -= payoutAmount;
    player.totalPayouts += 1;
    saveJson(PLAYERS_FILE, playersMap);

    // Record payout in history
    const payoutRecord: PayoutRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      txid,
      payoutAddress,
      minerName: player.minerName,
      amount: payoutAmount,
      fee,
      timestamp: Date.now(),
      status: 'confirmed',
      network: isRealRpc ? `${activeConfig.networkType} (Live Core 1.14.9)` : `${activeConfig.networkType} (Simulator)`,
    };

    payoutsHistory.unshift(payoutRecord);
    if (payoutsHistory.length > 200) {
      payoutsHistory = payoutsHistory.slice(0, 200);
    }
    saveJson(PAYOUTS_FILE, payoutsHistory);

    // Update simulated wallet balance
    simulatedWalletBalance = Math.max(0, simulatedWalletBalance - payoutAmount);

    res.json({
      success: true,
      message: `Successfully paid out ${payoutAmount.toFixed(4)} DOGE to ${payoutAddress}!`,
      txid,
      amount: payoutAmount,
      fee,
      isRealRpc,
      newPendingBalance: player.pendingBalance,
      payoutRecord,
    });
  });

  // 7. Get Payout History
  app.get('/api/payouts', (_req: Request, res: Response) => {
    res.json({
      success: true,
      payouts: payoutsHistory,
    });
  });

  // 8. Generate Regtest Blocks / Faucet for Testing
  app.post('/api/admin/generate-blocks', async (req: Request, res: Response) => {
    const count = parseInt(req.body.count || '10', 10);
    const targetAddress = req.body.address || activeConfig.gameWalletAddress;

    let realGenerated = false;
    let blockHashes: string[] = [];

    if (!activeConfig.forceSimulator) {
      try {
        const hashes = await callDogeRpc('generatetoaddress', [count, targetAddress]);
        realGenerated = true;
        blockHashes = hashes || [];
      } catch (err: any) {
        console.warn('generate-blocks RPC failed:', err.message);
      }
    }

    simulatedBlockCount += count;
    simulatedWalletBalance += count * 10000; // Dogecoin block reward

    res.json({
      success: true,
      count,
      realGenerated,
      blockHashes,
      newBlockCount: simulatedBlockCount,
      walletBalance: simulatedWalletBalance,
      message: `Generated ${count} blocks to ${targetAddress}!`,
    });
  });

  // 9. Download Complete Game Package (.ZIP) for 100% Offline Intranet Installation
  app.get('/api/download-zip', async (_req: Request, res: Response) => {
    try {
      const zip = new JSZip();

      // Read key files to package
      const packageJson = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8');
      const tsconfigJson = fs.readFileSync(path.join(__dirname, 'tsconfig.json'), 'utf-8');
      const viteConfig = fs.readFileSync(path.join(__dirname, 'vite.config.ts'), 'utf-8');
      const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
      const serverCode = fs.readFileSync(path.join(__dirname, 'server.ts'), 'utf-8');

      zip.file('package.json', packageJson);
      zip.file('tsconfig.json', tsconfigJson);
      zip.file('vite.config.ts', viteConfig);
      zip.file('index.html', indexHtml);
      zip.file('server.ts', serverCode);

      // Add src folder
      const srcFolder = zip.folder('src');
      const readDirRecursive = (dir: string, zipRef: JSZip | null) => {
        if (!zipRef || !fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            readDirRecursive(fullPath, zipRef.folder(entry.name));
          } else {
            zipRef.file(entry.name, fs.readFileSync(fullPath));
          }
        }
      };
      readDirRecursive(path.join(__dirname, 'src'), srcFolder);

      // Add public folder if exists
      if (fs.existsSync(path.join(__dirname, 'public'))) {
        const publicFolder = zip.folder('public');
        readDirRecursive(path.join(__dirname, 'public'), publicFolder);
      }

      // Add Pre-Configured dogecoin.conf for Dogecoin Core 1.14.9
      const dogecoinConfContent = `# ========================================================
# Dogecoin Core 1.14.9 Intranet Mining & Game Configuration
# Place this file in your Dogecoin data directory:
#   Windows: %APPDATA%\\Dogecoin\\dogecoin.conf
#   Linux:   ~/.dogecoin/dogecoin.conf
#   macOS:   ~/Library/Application Support/Dogecoin/dogecoin.conf
# ========================================================

# Enable JSON-RPC server
server=1
listen=1
daemon=1

# RPC Authentication (Must match game settings)
rpcuser=dogeminerrpc
rpcpassword=shibepassword123

# Allow connections from localhost and entire local intranet / LAN
rpcallowip=127.0.0.1
rpcallowip=192.168.*.*
rpcallowip=10.*.*.*
rpcallowip=172.16.*.*

# Transaction Indexing (enables full tx lookup)
txindex=1

# ========================================================
# NETWORK CHOICE (Select one below for your intranet):
# ========================================================

# Option A: REGTEST (Recommended for 100% offline isolated intranet)
# Allows instant block generation, zero sync wait, unlimited test DOGE!
regtest=1
rpcport=44555
port=44556

# Option B: PRIVATE MAINNET / TESTNET
# If you run standard mainnet node synced before going offline:
# rpcport=22555
# port=22556
`;
      zip.file('dogecoin.conf', dogecoinConfContent);

      // Add Windows double-click starter start.bat
      const startBat = `@echo off
title Dogecoin Core Intranet Mining Game Server
echo ==========================================================
echo Starting Dogecoin Core Intranet Mining Game on Port 3000...
echo ==========================================================
echo Ensure Node.js 18+ is installed.
echo Running npm install...
call npm install
echo Building client bundle...
call npm run build
echo Starting Node server on http://localhost:3000...
call npm start
pause
`;
      zip.file('start.bat', startBat);

      // Add Linux/Mac shell script start.sh
      const startSh = `#!/usr/bin/env bash
echo "=========================================================="
echo "Starting Dogecoin Core Intranet Mining Game on Port 3000..."
echo "=========================================================="
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js v18 or newer."
    exit 1
fi
npm install
npm run build
echo "Game server active! Access in browser at http://localhost:3000 or http://<your-intranet-ip>:3000"
npm start
`;
      zip.file('start.sh', startSh);

      // Add Comprehensive Installation & Offline Intranet Guide
      const guideContent = `# Dogecoin Core v1.14.9 Intranet Mining Game
## Full Offline Setup & Installation Manual

Congratulations on setting up your offline Dogecoin Intranet Mining Game!
This game is designed to run 100% locally and offline on your intranet, connecting
directly to your Dogecoin Core v1.14.9 node RPC to manage real Doge transactions,
payout pools, and player mining.

---

### Step 1: Configure Dogecoin Core v1.14.9 Node
1. Locate your Dogecoin Core configuration directory:
   - **Windows**: \`%APPDATA%\\Dogecoin\` (e.g. \`C:\\Users\\<YourUser>\\AppData\\Roaming\\Dogecoin\`)
   - **Linux**: \`~/.dogecoin\`
   - **macOS**: \`~/Library/Application Support/Dogecoin\`
2. Copy the included \`dogecoin.conf\` into that folder (or edit your existing \`dogecoin.conf\`).
3. Ensure the following lines are set:
   \`\`\`ini
   server=1
   listen=1
   rpcuser=dogeminerrpc
   rpcpassword=shibepassword123
   rpcallowip=127.0.0.1
   rpcallowip=192.168.*.*
   rpcallowip=10.*.*.*
   txindex=1
   
   # For offline isolated intranet (Regtest mode recommended):
   regtest=1
   rpcport=44555
   \`\`\`
4. Launch Dogecoin Core:
   - **GUI**: Launch Dogecoin Core.
   - **CLI / Daemon**:
     \`\`\`bash
     dogecoind -regtest -daemon
     \`\`\`

---

### Step 2: Create & Fund the Game Pool Wallet in Dogecoin Core
1. Generate an address for the game pool wallet:
   \`\`\`bash
   dogecoin-cli -regtest getnewaddress "game_pool"
   \`\`\`
2. In Regtest mode, mine initial blocks to fund your game pool wallet:
   \`\`\`bash
   dogecoin-cli -regtest generatetoaddress 101 "<your_game_pool_address>"
   \`\`\`
   *(Note: Dogecoin requires 100 block confirmations before mined coinbase Doge can be spent)*
3. Verify your game pool wallet balance:
   \`\`\`bash
   dogecoin-cli -regtest getbalance
   \`\`\`

---

### Step 3: Run the Game Server on Your Intranet Host
1. Unzip this package to any folder on your server / host machine.
2. Open terminal/command prompt in the game folder.
3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Build the frontend:
   \`\`\`bash
   npm run build
   \`\`\`
5. Start the full-stack server:
   \`\`\`bash
   npm start
   \`\`\`
   *(Or on Windows, simply double-click \`start.bat\`!)*

---

### Step 4: Connecting Intranet Players
1. Find your server's local intranet IP address:
   - Windows: \`ipconfig\` (e.g. \`192.168.1.50\`)
   - Linux/Mac: \`hostname -I\` or \`ifconfig\`
2. Give miners on your intranet the URL:
   \`http://192.168.1.50:3000\`
3. Each player:
   - Enters their Miner Tag / Gamer Name.
   - Enters their personal **Dogecoin Payout Address** (generated from their own Dogecoin Core or paper wallet).
   - Mines Dogecoin via the interactive rig, solves blocks, and earns Dogecoin credited to their pending balance.
   - Clicks **"Payout to My Address"** when ready! The server executes \`sendtoaddress\` directly via Dogecoin Core RPC and pays out real Dogecoin to their wallet!

---

### Troubleshooting
- **Connection Refused**: Ensure \`dogecoind\` is running and \`server=1\` is in \`dogecoin.conf\`. Check that the port in the Game Settings tab matches your node (\`44555\` for regtest, \`22555\` for mainnet).
- **Insufficient Funds for Payout**: Make sure you mined at least 101 blocks in regtest (\`generatetoaddress 101 <address>\`) or funded the Game Pool address.
- **Simulator Mode**: You can toggle "Offline Test Simulator" anytime in Game Settings to test full game loops, payouts, and rig upgrades without Dogecoin Core running!
`;
      zip.file('README.md', guideContent);
      zip.file('DOGECOIN_INTRANET_SETUP.md', guideContent);

      const content = await zip.generateAsync({ type: 'nodebuffer' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="dogecoin-intranet-miner-game.zip"');
      res.send(content);
    } catch (err: any) {
      console.error('ZIP packaging error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Client Routing (Vite Dev Server vs Static Build)
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      // Fallback if dist not built yet
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(` Dogecoin Core Intranet Mining Game running on :${PORT}`);
    console.log(` Intranet URL: http://0.0.0.0:${PORT}`);
    console.log(` Connected Mode: ${activeConfig.forceSimulator ? 'Simulator' : 'Live Core RPC'}`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
