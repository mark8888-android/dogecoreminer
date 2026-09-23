import JSZip from 'jszip';

export async function downloadGameZip(): Promise<void> {
  // First attempt: Server API download
  try {
    const response = await fetch('/api/download-zip');
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dogecoin-intranet-miner-game.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return;
    }
  } catch (err) {
    console.warn('Direct server ZIP download failed, falling back to client-side packaging:', err);
  }

  // Fallback: Client-side ZIP creation with JSZip
  const zip = new JSZip();

  // 1. dogecoin.conf template for Dogecoin Core 1.14.9
  const dogecoinConf = `# ========================================================
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

# Transaction Indexing
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
# If running standard mainnet node synced before going offline:
# rpcport=22555
# port=22556
`;
  zip.file('dogecoin.conf', dogecoinConf);

  // 2. Windows Start Script
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

  // 3. Linux/Mac Start Script
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

  // 4. README & Installation Guide
  const readme = `# Dogecoin Core v1.14.9 Intranet Mining Game
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
2. Copy the included \`dogecoin.conf\` into that folder.
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
3. Run on Windows:
   \`\`\`cmd
   start.bat
   \`\`\`
   Or on Linux/Mac:
   \`\`\`bash
   chmod +x start.sh
   ./start.sh
   \`\`\`

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
`;
  zip.file('README.md', readme);
  zip.file('DOGECOIN_INTRANET_SETUP.md', readme);

  // Generate ZIP blob and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dogecoin-intranet-miner-game.zip';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
