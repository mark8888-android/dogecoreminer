import React from 'react';
import { Volume2, VolumeX, Download, Server, Cpu } from 'lucide-react';
import { NodeStatus } from '../types/index.ts';

interface HeaderProps {
  activeTab: 'mine' | 'pow' | 'wallet' | 'payouts' | 'node' | 'guide';
  setActiveTab: (tab: 'mine' | 'pow' | 'wallet' | 'payouts' | 'node' | 'guide') => void;
  nodeStatus: NodeStatus | null;
  soundOn: boolean;
  toggleSound: () => void;
  onDownloadZip: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  nodeStatus,
  soundOn,
  toggleSound,
  onDownloadZip,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveTab('mine')}
          className="text-lg font-bold tracking-tight text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2 whitespace-nowrap focus:outline-none"
        >
          <span className="font-extrabold text-amber-400">ÐOGECOIN</span>
          <span className="text-slate-300 font-semibold">CORE MINER</span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('mine')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'mine' ? 'text-amber-400 border-b-2 border-amber-400 pb-1' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mining Rig
          </button>
          <button
            onClick={() => setActiveTab('pow')}
            className={`whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'pow' ? 'text-amber-400 border-b-2 border-amber-400 pb-1' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Proof-of-Work
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'wallet' ? 'text-amber-400 border-b-2 border-amber-400 pb-1' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Game Pool Wallet
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'payouts' ? 'text-amber-400 border-b-2 border-amber-400 pb-1' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Payout Ledger
          </button>
          <button
            onClick={() => setActiveTab('node')}
            className={`whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'node' ? 'text-amber-400 border-b-2 border-amber-400 pb-1' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Core RPC 1.14.9
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'guide' ? 'text-amber-400 border-b-2 border-amber-400 pb-1' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Install Guide
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Sound FX Enabled' : 'Sound FX Muted'}
            aria-label="Toggle sound effects"
            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-colors border border-slate-800"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Download Complete Package .ZIP */}
          <button
            onClick={onDownloadZip}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download .ZIP</span>
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="flex md:hidden items-center justify-around px-2 py-2 border-t border-slate-800/80 bg-slate-950 text-xs overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('mine')}
          className={`px-2 py-1 whitespace-nowrap rounded ${activeTab === 'mine' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}
        >
          Mining Rig
        </button>
        <button
          onClick={() => setActiveTab('pow')}
          className={`px-2 py-1 whitespace-nowrap rounded ${activeTab === 'pow' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}
        >
          PoW Arena
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-2 py-1 whitespace-nowrap rounded ${activeTab === 'wallet' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}
        >
          Pool Wallet
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-2 py-1 whitespace-nowrap rounded ${activeTab === 'payouts' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}
        >
          Payouts
        </button>
        <button
          onClick={() => setActiveTab('node')}
          className={`px-2 py-1 whitespace-nowrap rounded ${activeTab === 'node' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}
        >
          Node RPC
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-2 py-1 whitespace-nowrap rounded ${activeTab === 'guide' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}
        >
          Install
        </button>
      </div>
    </header>
  );
};
