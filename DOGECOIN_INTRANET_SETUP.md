# Dogecoin Core v1.14.9 Intranet Mining Game
## Complete Offline Intranet Setup & Installation Manual

This application is built for **100% offline intranet networks**, connecting your browser players with **Dogecoin Core version 1.14.9** via its native JSON-RPC interface.

---

### Key Capabilities Included:
1. **Dogecoin Core 1.14.9 JSON-RPC Engine**: Direct communication with your local `dogecoind` node via RPC protocol.
2. **Game Pool Custody Wallet**: Accumulates funds from block rewards/mining, securely held inside your Dogecoin Core wallet.
3. **Player Payout Address System**: Each miner sets their personal Dogecoin payout address.
4. **Automated On-Chain Payouts**: When players cash out, the game server executes `sendtoaddress <player_address> <amount>` directly via RPC and returns a live 64-character transaction hash (TXID).
5. **Interactive Mining Mechanics**:
   - Interactive gold Dogecoin rig with click combos, particle feedback, and sound FX.
   - Proof-of-Work block solver with Scrypt nonce hashing.
   - Upgradable rigs (GPU rigs, ASIC Moon Miners, Geothermal substations) and Worker Shibes.
6. **100% Offline Standalone Package**: Everything is packaged into a downloadable `.zip` file with one-click double-click scripts for Windows (`start.bat`) and Linux (`start.sh`).

---

### Step 1: Configuring Dogecoin Core 1.14.9 Node

1. Install Dogecoin Core v1.14.9 on your intranet server or node computer.
2. Locate the Dogecoin data folder:
   - **Windows**: `%APPDATA%\Dogecoin\` (usually `C:\Users\<User>\AppData\Roaming\Dogecoin\`)
   - **Linux**: `~/.dogecoin/`
   - **macOS**: `~/Library/Application Support/Dogecoin/`
3. Copy the provided `dogecoin.conf` file into this directory (or paste this content into your `dogecoin.conf`):

```ini
# ========================================================
# Dogecoin Core 1.14.9 Configuration
# ========================================================
server=1
listen=1
daemon=1

# RPC Authentication (must match game settings)
rpcuser=dogeminerrpc
rpcpassword=shibepassword123

# Allow connections from localhost and entire local intranet
rpcallowip=127.0.0.1
rpcallowip=192.168.*.*
rpcallowip=10.*.*.*
rpcallowip=172.16.*.*

# Full transaction indexing
txindex=1

# Network Choice: REGTEST (Recommended for 100% Offline Intranet)
regtest=1
rpcport=44555
port=44556
```

4. Launch Dogecoin Core:
   - Command line:
     ```bash
     dogecoind -regtest -daemon
     ```
   - Or start Dogecoin-Qt (GUI) with `-regtest`.

---

### Step 2: Creating & Funding the Game Pool Wallet

In Regtest mode, you can generate initial blocks and fund your Game Pool Wallet immediately:

1. Create a receiving address for the game pool:
   ```bash
   dogecoin-cli -regtest getnewaddress "game_pool"
   ```
   *(e.g., returns `nbB4c7K...` on regtest or `D...` on mainnet)*

2. Mine 101 blocks to that address to fund the game wallet:
   ```bash
   dogecoin-cli -regtest generatetoaddress 101 "<YOUR_GAME_POOL_ADDRESS>"
   ```
   *Explanation: Coinbase mining rewards in Dogecoin Core require 100 block confirmations before they become spendable. Mining 101 blocks immediately unlocks 10,000 DOGE in spendable hot balance!*

3. Verify wallet balance:
   ```bash
   dogecoin-cli -regtest getbalance
   ```

---

### Step 3: Installing & Starting the Game Server

1. Extract `dogecoin-intranet-miner-game.zip` to any folder on your server machine.
2. Launch the server:
   - **Windows**: Double-click `start.bat`
   - **Linux / macOS**:
     ```bash
     chmod +x start.sh
     ./start.sh
     ```
3. The server starts on port `3000`.

---

### Step 4: Connecting Intranet Players

1. Check your server's local LAN IP:
   - Windows: `ipconfig` (e.g. `192.168.1.100`)
   - Linux: `hostname -I`
2. Miners connect from their web browsers at:
   ```
   http://192.168.1.100:3000
   ```
3. Each player:
   - Sets their **Miner Tag** (e.g., `ShibeMiner#1`).
   - Enters their personal **Dogecoin Payout Address** (generated in their Dogecoin Core or paper wallet).
   - Mines Scrypt nonces and collects pending DOGE.
   - Clicks **"Payout to Address"** to receive Dogecoin sent directly from your Core node!

---

### Testing Without Dogecoin Core (Offline Simulator Mode)
If you want to play or demo the game before turning on your Dogecoin node:
- Open the **Core RPC 1.14.9** tab in the game.
- Check **"Force Offline Simulator Mode"**.
- All mining, upgrades, proof-of-work block finds, and payouts work seamlessly with simulated Dogecoin blockchain state and TXID receipts!
