import React, { useState } from 'react';
import { Download, Copy, Check, Terminal, FileText, CheckCircle2, Network, ShieldCheck, ChevronRight } from 'lucide-react';

interface InstallGuideProps {
  onDownloadZip: () => void;
}

export const InstallGuide: React.FC<InstallGuideProps> = ({ onDownloadZip }) => {
  const [copiedConf, setCopiedConf] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  const dogecoinConfText = `# ========================================================
# Dogecoin Core 1.14.9 Intranet Mining & Game Configuration
# File: %APPDATA%\\Dogecoin\\dogecoin.conf (Windows)
#       ~/.dogecoin/dogecoin.conf (Linux)
# ========================================================

# Enable JSON-RPC server and listening
server=1
listen=1
daemon=1

# RPC Authentication (must match game settings)
rpcuser=dogeminerrpc
rpcpassword=shibepassword123

# Allow connections from localhost and entire local intranet / LAN
rpcallowip=127.0.0.1
rpcallowip=192.168.*.*
rpcallowip=10.*.*.*
rpcallowip=172.16.*.*

# Full transaction indexing
txindex=1

# ========================================================
# NETWORK MODE: REGTEST (Recommended for 100% Offline Intranet)
# ========================================================
regtest=1
rpcport=44555
port=44556
`;

  const cliCommandsText = `# 1. Start Dogecoin Core in Regtest mode
dogecoind -regtest -daemon

# 2. Generate a new address for the Game Pool Wallet
dogecoin-cli -regtest getnewaddress "game_pool"

# 3. Mine 101 blocks to fund the Game Pool Wallet with test DOGE
# (Coinbase rewards require 100 confirmations to mature)
dogecoin-cli -regtest generatetoaddress 101 "<YOUR_GAME_POOL_ADDRESS>"

# 4. Check wallet balance
dogecoin-cli -regtest getbalance
`;

  const copyToClipboard = (text: string, setFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Banner with Instant Download Button */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              100% Offline Intranet Tested
            </span>
            <span className="text-xs text-slate-400">Dogecoin Core v1.14.9</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
            Install on Your Isolated Intranet Network
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Download the complete standalone package containing the full-stack server, pre-configured dogecoin.conf, Windows .bat and Linux .sh launchers, and documentation.
          </p>
        </div>

        <button
          onClick={onDownloadZip}
          className="px-5 py-3 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl shadow-lg flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Game .ZIP</span>
        </button>
      </div>

      {/* Step by Step Manual */}
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-3 flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-100">
                Configure Dogecoin Core 1.14.9 on Your Node Machine
              </h3>
              <p className="text-xs text-slate-400">
                On the computer running your Dogecoin Core 1.14.9, open or create your <code className="text-amber-300 font-mono">dogecoin.conf</code> file in your Dogecoin data folder:
              </p>
              <ul className="text-xs text-slate-400 list-disc list-inside space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <li><strong className="text-slate-200">Windows:</strong> <code className="text-slate-300 font-mono">%APPDATA%\Dogecoin\dogecoin.conf</code></li>
                <li><strong className="text-slate-200">Linux:</strong> <code className="text-slate-300 font-mono">~/.dogecoin/dogecoin.conf</code></li>
                <li><strong className="text-slate-200">macOS:</strong> <code className="text-slate-300 font-mono">~/Library/Application Support/Dogecoin/dogecoin.conf</code></li>
              </ul>

              {/* dogecoin.conf snippet */}
              <div className="relative">
                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950 px-3 py-1.5 rounded-t-lg border-t border-x border-slate-800">
                  <span className="flex items-center gap-1.5 font-mono">
                    <FileText className="w-3.5 h-3.5 text-amber-400" /> dogecoin.conf
                  </span>
                  <button
                    onClick={() => copyToClipboard(dogecoinConfText, setCopiedConf)}
                    className="hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    {copiedConf ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedConf ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950/90 text-slate-300 font-mono text-[11px] rounded-b-lg border border-slate-800 overflow-x-auto leading-relaxed">
                  {dogecoinConfText}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-3 flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-100">
                Launch Node & Fund Game Pool Wallet
              </h3>
              <p className="text-xs text-slate-400">
                In offline intranet testing, Regtest mode allows you to mine test blocks instantly without waiting for network synchronization. Run these commands on your node:
              </p>

              {/* CLI Command snippet */}
              <div className="relative">
                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950 px-3 py-1.5 rounded-t-lg border-t border-x border-slate-800">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Command Line Terminal
                  </span>
                  <button
                    onClick={() => copyToClipboard(cliCommandsText, setCopiedCli)}
                    className="hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    {copiedCli ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCli ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950/90 text-emerald-300/90 font-mono text-[11px] rounded-b-lg border border-slate-800 overflow-x-auto leading-relaxed">
                  {cliCommandsText}
                </pre>
              </div>

              <div className="text-[11px] text-slate-400 bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-lg">
                💡 <strong>Important Dogecoin Rule:</strong> In Dogecoin Core, freshly mined coinbase rewards require 100 block confirmations before they become spendable. Mining 101 blocks immediately unlocks the reward of the first block (10,000 DOGE) for automated payouts!
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-3 flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-100">
                Run the Game Server on Your Intranet Machine
              </h3>
              <p className="text-xs text-slate-400">
                Extract the downloaded <code className="text-amber-300 font-mono">dogecoin-intranet-miner-game.zip</code> to any folder on your intranet host (Windows, Linux, macOS, or Raspberry Pi).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" /> Windows Intranet Host
                  </div>
                  <p className="text-slate-400">
                    Double-click <code className="text-amber-300 font-mono">start.bat</code> in the extracted folder. It will install packages and launch the server on port 3000!
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" /> Linux / Mac Host
                  </div>
                  <p className="text-slate-400">
                    Run <code className="text-amber-300 font-mono">chmod +x start.sh && ./start.sh</code> in terminal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </div>
            <div className="space-y-3 flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-100">
                Connect Miners & Players Across Your LAN
              </h3>
              <p className="text-xs text-slate-400">
                Find your server's local IP address (e.g. <code className="text-slate-200 font-mono">ipconfig</code> on Windows or <code className="text-slate-200 font-mono">hostname -I</code> on Linux).
              </p>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Network className="w-4 h-4" /> Intranet Player Access URL:
                </div>
                <div className="font-mono text-sm text-slate-200 bg-slate-900 px-3 py-2 rounded border border-slate-700 select-all">
                  http://&lt;SERVER_LAN_IP&gt;:3000
                </div>
                <p className="text-slate-400">
                  Any workstation, laptop, or mobile phone connected to the same offline intranet WiFi or Ethernet switch can open this URL in their browser!
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Each player inputs their personal <strong>Dogecoin Payout Address</strong>.</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Players click to mine, upgrade rigs, and solve blocks in the PoW Arena.</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>When they click <strong>"Payout to Address"</strong>, Dogecoin Core automatically broadcasts the payment transaction!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
