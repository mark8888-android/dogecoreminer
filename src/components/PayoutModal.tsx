import React, { useState } from 'react';
import { X, ArrowUpRight, CheckCircle2, AlertCircle, Copy, Check, ShieldCheck } from 'lucide-react';
import { PlayerProfile } from '../types/index.ts';
import { playPayoutSound, playErrorSound } from '../utils/audio.ts';

interface PayoutModalProps {
  player: PlayerProfile;
  minPayout: number;
  isOpen: boolean;
  onClose: () => void;
  onPayoutSuccess: (amount: number, txid: string) => void;
}

export const PayoutModal: React.FC<PayoutModalProps> = ({
  player,
  minPayout,
  isOpen,
  onClose,
  onPayoutSuccess,
}) => {
  const [amount, setAmount] = useState(String(player.pendingBalance));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultTxid, setResultTxid] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);

  if (!isOpen) return null;

  const handleMax = () => {
    setAmount(String(player.pendingBalance));
  };

  const handleSendPayout = async () => {
    setErrorMsg('');
    const payoutNum = parseFloat(amount);

    if (isNaN(payoutNum) || payoutNum < minPayout) {
      setErrorMsg(`Minimum payout amount is ${minPayout} DOGE.`);
      playErrorSound();
      return;
    }

    if (payoutNum > player.pendingBalance) {
      setErrorMsg(`Amount exceeds your pending balance of ${player.pendingBalance.toFixed(4)} DOGE.`);
      playErrorSound();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/payout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutAddress: player.payoutAddress,
          amount: payoutNum,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Payout request was rejected by node.');
      }

      playPayoutSound();
      setResultTxid(data.txid);
      onPayoutSuccess(payoutNum, data.txid);
    } catch (err: any) {
      playErrorSound();
      setErrorMsg(err.message || 'Failed to process Dogecoin payout.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (resultTxid) {
      navigator.clipboard.writeText(resultTxid);
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!resultTxid ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-slate-100">
                Disburse Payout from Game Pool
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Send your mined DOGE from the Game Pool Wallet directly to your personal address on the intranet.
            </p>

            <div className="space-y-4">
              {/* Destination Address Info */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-500 font-medium">Destination Miner Address</div>
                <div className="font-mono text-xs text-amber-300 break-all mt-0.5 font-bold">
                  {player.payoutAddress}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Payout Amount</span>
                  <span className="text-slate-400">
                    Available:{' '}
                    <strong className="text-amber-400 font-mono">
                      {player.pendingBalance.toFixed(4)} DOGE
                    </strong>
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min={minPayout}
                    max={player.pendingBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-3 pr-16 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleMax}
                    className="absolute right-2 top-2 px-2 py-1 text-[11px] font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded"
                  >
                    MAX
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Minimum withdrawal threshold: {minPayout} DOGE
                </div>
              </div>

              {/* Network Fee Notice */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Dogecoin Network Fee:</span>
                <span className="font-mono text-slate-300">~1.00 DOGE (Covered by Game Pool)</span>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  onClick={handleSendPayout}
                  disabled={loading}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{loading ? 'Broadcasting to Dogecoin Core...' : `Disburse ${parseFloat(amount || '0').toFixed(2)} DOGE`}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Success Receipt View */
          <div className="text-center py-2 space-y-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100">
                Payout Successfully Broadcast!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your Dogecoin Core node has processed the transaction. Funds have been sent to your address.
              </p>
            </div>

            {/* TXID Box */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-left">
              <div className="text-[11px] text-slate-500 font-medium mb-1">Transaction ID (TXID):</div>
              <div className="font-mono text-xs text-amber-300 break-all select-all">
                {resultTxid}
              </div>
              <button
                onClick={handleCopy}
                className="mt-2.5 w-full py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedTx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied TXID!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Transaction ID</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Done & Return to Mining
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
