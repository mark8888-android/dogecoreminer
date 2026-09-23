import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { PlayerWalletBar } from './components/PlayerWalletBar.tsx';
import { MiningRig } from './components/MiningRig.tsx';
import { ProofOfWorkArena } from './components/ProofOfWorkArena.tsx';
import { GamePoolWalletView } from './components/GamePoolWalletView.tsx';
import { PayoutLedger } from './components/PayoutLedger.tsx';
import { NodeRpcSettings } from './components/NodeRpcSettings.tsx';
import { InstallGuide } from './components/InstallGuide.tsx';
import { PayoutModal } from './components/PayoutModal.tsx';
import { PlayerProfile, NodeStatus, PayoutRecord } from './types/index.ts';
import { isSoundEnabled, setSoundEnabled } from './utils/audio.ts';
import { downloadGameZip } from './utils/zipDownloader.ts';

const DEFAULT_PLAYER: PlayerProfile = {
  minerName: 'Shibe Miner #1',
  payoutAddress: 'D7Y57f495583b27b9a527c70f03e002a24',
  pendingBalance: 12.500,
  lifetimeMined: 45.850,
  blocksSolved: 3,
  totalPayouts: 1,
  hashrate: 15,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'mine' | 'pow' | 'wallet' | 'payouts' | 'node' | 'guide'>('mine');
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  const [player, setPlayer] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('doge_miner_player');
    return saved ? JSON.parse(saved) : DEFAULT_PLAYER;
  });

  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);

  // Sync player to local storage
  useEffect(() => {
    localStorage.setItem('doge_miner_player', JSON.stringify(player));
  }, [player]);

  // Fetch Node Status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setNodeStatus(data);
      }
    } catch {
      // Backend not reached or offline simulator
    }
  }, []);

  // Fetch Payout History
  const fetchPayouts = useCallback(async () => {
    try {
      const res = await fetch('/api/payouts');
      if (res.ok) {
        const data = await res.json();
        if (data.payouts) {
          setPayouts(data.payouts);
        }
      }
    } catch {}
  }, []);

  // Poll status periodically
  useEffect(() => {
    fetchStatus();
    fetchPayouts();

    const interval = setInterval(() => {
      fetchStatus();
      fetchPayouts();
    }, 7000);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchPayouts]);

  // Sound Toggle Handler
  const toggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    setSoundEnabled(newState);
  };

  // Mining Reward Handler
  const handleMineReward = async (amount: number, isBlock: boolean = false) => {
    setPlayer((prev) => ({
      ...prev,
      pendingBalance: Math.max(0, prev.pendingBalance + amount),
      lifetimeMined: amount > 0 ? prev.lifetimeMined + amount : prev.lifetimeMined,
      blocksSolved: isBlock ? prev.blocksSolved + 1 : prev.blocksSolved,
    }));

    if (amount > 0) {
      try {
        await fetch('/api/mining/submit-reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payoutAddress: player.payoutAddress,
            amount,
            isBlock,
          }),
        });
      } catch {}
    }
  };

  // Hashrate Upgrade Sync
  const handleUpgradeHashrate = (newHashrate: number) => {
    setPlayer((prev) => ({ ...prev, hashrate: newHashrate }));
  };

  // Update Miner Name & Address
  const handleUpdateAddress = async (name: string, address: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/players/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minerName: name,
          payoutAddress: address,
        }),
      });
      const data = await res.json();
      if (data.success && data.player) {
        setPlayer((prev) => ({
          ...prev,
          minerName: data.player.minerName,
          payoutAddress: data.player.payoutAddress,
          pendingBalance: data.player.pendingBalance ?? prev.pendingBalance,
          lifetimeMined: data.player.lifetimeMined ?? prev.lifetimeMined,
        }));
        return true;
      }
    } catch {}

    // Fallback update
    setPlayer((prev) => ({ ...prev, minerName: name, payoutAddress: address }));
    return true;
  };

  // Payout Success Callback
  const handlePayoutSuccess = (amount: number, txid: string) => {
    setPlayer((prev) => ({
      ...prev,
      pendingBalance: Math.max(0, prev.pendingBalance - amount),
      totalPayouts: prev.totalPayouts + 1,
    }));

    const newRecord: PayoutRecord = {
      id: `pay_${Date.now()}`,
      txid,
      payoutAddress: player.payoutAddress,
      minerName: player.minerName,
      amount,
      fee: 1.0,
      timestamp: Date.now(),
      status: 'confirmed',
      network: 'Dogecoin Core 1.14.9',
    };
    setPayouts((prev) => [newRecord, ...prev]);
    fetchStatus();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        nodeStatus={nodeStatus}
        soundOn={soundOn}
        toggleSound={toggleSound}
        onDownloadZip={downloadGameZip}
      />

      {/* Main Content Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Player Miner Identity & Payout Wallet Bar */}
        <PlayerWalletBar
          player={player}
          minPayout={nodeStatus?.config?.minPayout ?? 1.0}
          onUpdateAddress={handleUpdateAddress}
          onRequestPayoutModal={() => setIsPayoutModalOpen(true)}
        />

        {/* Dynamic View Tabs */}
        {activeTab === 'mine' && (
          <MiningRig
            player={player}
            onMineReward={handleMineReward}
            onUpgradeHashrate={handleUpgradeHashrate}
          />
        )}

        {activeTab === 'pow' && (
          <ProofOfWorkArena
            currentBlockHeight={nodeStatus?.blockCount ?? 133742}
            blockReward={nodeStatus?.config?.blockReward ?? 10.0}
            payoutAddress={player.payoutAddress}
            minerName={player.minerName}
            nodeStatus={nodeStatus}
            onBlockFound={(reward) => handleMineReward(reward, true)}
          />
        )}

        {activeTab === 'wallet' && (
          <GamePoolWalletView
            nodeStatus={nodeStatus}
            onRefreshStatus={fetchStatus}
            onRequestPayoutModal={() => setIsPayoutModalOpen(true)}
          />
        )}

        {activeTab === 'payouts' && (
          <PayoutLedger
            payouts={payouts}
            onRefresh={fetchPayouts}
          />
        )}

        {activeTab === 'node' && (
          <NodeRpcSettings
            nodeStatus={nodeStatus}
            onRefreshStatus={fetchStatus}
          />
        )}

        {activeTab === 'guide' && (
          <InstallGuide onDownloadZip={downloadGameZip} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>Dogecoin Core 1.14.9 Intranet Mining Game</span>
            <span className="mx-2">·</span>
            <span>100% Offline Air-Gapped Ready</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('guide')}
              className="hover:text-amber-400 transition-colors"
            >
              Full Installation Manual
            </button>
            <button
              onClick={downloadGameZip}
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              Download Standalone .ZIP
            </button>
          </div>
        </div>
      </footer>

      {/* Payout Confirmation Modal */}
      <PayoutModal
        player={player}
        minPayout={nodeStatus?.config?.minPayout ?? 1.0}
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        onPayoutSuccess={handlePayoutSuccess}
      />
    </div>
  );
}
