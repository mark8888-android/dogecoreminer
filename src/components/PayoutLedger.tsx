import React, { useState } from 'react';
import { ArrowUpRight, Copy, Check, Search, ShieldCheck } from 'lucide-react';
import { PayoutRecord } from '../types/index.ts';

interface PayoutLedgerProps {
  payouts: PayoutRecord[];
  onRefresh: () => void;
}

export const PayoutLedger: React.FC<PayoutLedgerProps> = ({ payouts }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');

  const handleCopyTx = (txid: string) => {
    navigator.clipboard.writeText(txid);
    setCopiedId(txid);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = payouts.filter(
    (p) =>
      p.minerName.toLowerCase().includes(filterText.toLowerCase()) ||
      p.payoutAddress.toLowerCase().includes(filterText.toLowerCase()) ||
      p.txid.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
            Dogecoin Payout Audit Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent transaction log of all DOGE disbursed from the Game Pool Wallet to player payout addresses.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search miner or address..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldCheck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">No Payout Transactions Yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Once players mine enough Dogecoin and click "Payout to Address", transactions sent from your Dogecoin Core wallet will be recorded here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Miner</th>
                  <th className="py-3 px-4">Destination Address</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Transaction ID (TXID)</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-200 whitespace-nowrap">
                      {p.minerName}
                    </td>
                    <td className="py-3 px-4 text-amber-300/90 text-[11px] break-all max-w-[180px]">
                      {p.payoutAddress}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-400 tabular-nums whitespace-nowrap">
                      +{p.amount.toFixed(4)} DOGE
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-[220px]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate" title={p.txid}>
                          {p.txid}
                        </span>
                        <button
                          onClick={() => handleCopyTx(p.txid)}
                          className="text-slate-500 hover:text-amber-400 p-0.5 transition-colors shrink-0"
                          title="Copy TXID"
                        >
                          {copiedId === p.txid ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Check className="w-3 h-3" /> Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
