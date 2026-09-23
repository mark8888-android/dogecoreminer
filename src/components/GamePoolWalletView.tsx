import React, { useState } from 'react';
import { Wallet, Copy, Check, ShieldCheck, ArrowDownLeft, PlusCircle, Coins, ExternalLink } from 'lucide-react';
import { NodeStatus } from '../types/index.ts';
import { playCoinSound, playUpgradeSound } from '../utils/audio.ts';

interface GamePoolWalletViewProps {
  nodeStatus: NodeStatus | null;
  onRefreshStatus: () => void;
  onRequestPayoutModal: () => void;
}

export const GamePoolWalletView: React.FC<GamePoolWalletViewProps> = ({
  nodeStatus,
  onRefreshStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingBlocks, setIsGeneratingBlocks] = useState(false);
  const [fundMessage, setFundMessage] = useState('');

  const poolAddress = nodeStatus?.gameAddress || 'DGamePoolWalletShibeMoonPayout111';
  const balance = nodeStatus?.walletBalance ?? 25000.0;
  const pendingOwed = nodeStatus?.stats?.totalPending ?? 0;
  const totalPaidOut = nodeStatus?.stats?.totalPaidOut ?? 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(poolAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate Regtest blocks to fund pool
  const handleGenerateBlocks = async () => {
    setIsGeneratingBlocks(true);
    setFundMessage('');
    try {
      const response = await fetch('/api/admin/generate-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 10, address: poolAddress }),
      });
      const data = await response.json();
      if (data.success) {
        playCoinSound();
        playUpgradeSound();
        setFundMessage(data.message || 'Mined 10 blocks to game wallet!');
        onRefreshStatus();
      } else {
        setFundMessage(data.message || 'Failed to mine blocks');
      }
    } catch (err: any) {
      setFundMessage(`Error: ${err.message}`);
    } finally {
      setIsGeneratingBlocks(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Live Node Wallet Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              Game Pool Hot Balance
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Core 1.14.9
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
            {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{' '}
            <span className="text-sm font-sans text-amber-300">DOGE</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Available funds for player cashouts
          </div>
        </div>

        {/* Card 2: Pending Unpaid to Miners */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Owed Pending to Miners</span>
            <span className="text-xs text-amber-400 font-mono">
              {nodeStatus?.stats?.activePlayersCount || 1} Miners Active
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100 tabular-nums">
            {pendingOwed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{' '}
            <span className="text-sm font-sans text-slate-400">DOGE</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Mined rewards awaiting payout request
          </div>
        </div>

        {/* Card 3: Total Settled Payouts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Total Settled Payouts</span>
            <span className="text-xs text-emerald-400 font-mono">
              {nodeStatus?.stats?.totalPayoutTransactions || 0} TXs
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
            {totalPaidOut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{' '}
            <span className="text-sm font-sans text-emerald-300">DOGE</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Sent to miners' personal Dogecoin addresses
          </div>
        </div>
      </div>

      {/* Game Pool Receiving Address Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              Game Pool Custody Address
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              This address is managed by your Dogecoin Core v1.14.9 node. All mining rewards accumulate here, and automatic payouts are disbursed from here to each player's individual address.
            </p>
          </div>

          {/* Quick Regtest Mine Button */}
          <button
            onClick={handleGenerateBlocks}
            disabled={isGeneratingBlocks}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap self-start md:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{isGeneratingBlocks ? 'Mining Blocks...' : 'Mine 10 Regtest Blocks to Wallet'}</span>
          </button>
        </div>

        {/* Address Display & Copy Bar */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400 shrink-0">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium">Dogecoin Core Hot Address</div>
              <div className="font-mono text-sm sm:text-base font-bold text-amber-300 break-all select-all">
                {poolAddress}
              </div>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-700 whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Address</span>
              </>
            )}
          </button>
        </div>

        {fundMessage && (
          <div className="mt-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-center gap-2">
            <Coins className="w-3.5 h-3.5" />
            <span>{fundMessage}</span>
          </div>
        )}

        {/* Informational checklist */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
          <div>
            <span className="font-semibold text-slate-200 block mb-1">1. Hot Custody</span>
            Funds remain inside your local Dogecoin Core node on the intranet until a player initiates a withdrawal.
          </div>
          <div>
            <span className="font-semibold text-slate-200 block mb-1">2. Direct RPC Payout</span>
            When a player clicks payout, the server triggers <code className="text-amber-300 font-mono">sendtoaddress</code> with 0 external middlemen.
          </div>
          <div>
            <span className="font-semibold text-slate-200 block mb-1">3. Offline Guarantee</span>
            Works 100% offline on air-gapped LAN networks, testnets, or private intranet mainnet forks.
          </div>
        </div>
      </div>
    </div>
  );
};
