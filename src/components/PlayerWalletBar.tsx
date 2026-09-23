import React, { useState } from 'react';
import { Wallet, ArrowUpRight, CheckCircle2, AlertCircle, Edit3, Save } from 'lucide-react';
import { PlayerProfile } from '../types/index.ts';

interface PlayerWalletBarProps {
  player: PlayerProfile;
  minPayout: number;
  onUpdateAddress: (name: string, address: string) => Promise<boolean>;
  onRequestPayoutModal: () => void;
}

export const PlayerWalletBar: React.FC<PlayerWalletBarProps> = ({
  player,
  minPayout,
  onUpdateAddress,
  onRequestPayoutModal,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(player.minerName);
  const [tempAddress, setTempAddress] = useState(player.payoutAddress);
  const [errorMsg, setErrorMsg] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanAddr = tempAddress.trim();
    if (!cleanAddr) {
      setErrorMsg('Please enter a Dogecoin payout address.');
      return;
    }
    // Dogecoin address check
    if (cleanAddr.length < 26 || cleanAddr.length > 35) {
      setErrorMsg('Invalid address length. Dogecoin addresses are 26-35 characters.');
      return;
    }

    const success = await onUpdateAddress(tempName || 'Shibe Miner', cleanAddr);
    if (success) {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setErrorMsg('Failed to update miner profile. Please check address format.');
    }
  };

  const canPayout = player.pendingBalance >= minPayout && player.payoutAddress.length >= 26;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Miner Identity & Address */}
        <div className="flex-1">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Miner Name / Gamer Tag
                  </label>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={25}
                    placeholder="e.g. MoonShibe99"
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Personal Dogecoin Payout Address
                  </label>
                  <input
                    type="text"
                    value={tempAddress}
                    onChange={(e) => setTempAddress(e.target.value)}
                    placeholder="e.g. D9z... or testnet m/n..."
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-950 border border-slate-700 rounded-lg text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Miner Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setErrorMsg('');
                  }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-500 font-medium">Active Miner</span>
                <span className="text-xs text-slate-600">·</span>
                <h2 className="text-base font-bold text-slate-200">{player.minerName}</h2>
                <button
                  onClick={() => {
                    setTempName(player.minerName);
                    setTempAddress(player.payoutAddress);
                    setIsEditing(true);
                  }}
                  className="text-slate-400 hover:text-amber-400 p-1 transition-colors"
                  title="Edit Miner Name & Payout Address"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400">Payout Address:</span>
                <span className="font-mono text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-[11px] sm:text-xs break-all">
                  {player.payoutAddress || 'No payout address set (Click edit to add)'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pending DOGE Pool & Cashout CTA */}
        <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-slate-800 pt-3 lg:pt-0 lg:pl-6">
          <div>
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Mined Reward</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {player.pendingBalance.toFixed(4)}{' '}
              <span className="text-sm font-sans text-amber-300/80">DOGE</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Held in Game Pool · Min Payout: {minPayout} DOGE
            </div>
          </div>

          <button
            onClick={onRequestPayoutModal}
            disabled={!canPayout}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shadow-sm ${
              canPayout
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <span>Payout to Address</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
