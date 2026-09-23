import React, { useState } from 'react';
import { Server, CheckCircle2, AlertTriangle, RefreshCw, Save, ShieldAlert, Cpu } from 'lucide-react';
import { NodeStatus } from '../types/index.ts';

interface NodeRpcSettingsProps {
  nodeStatus: NodeStatus | null;
  onRefreshStatus: () => void;
}

export const NodeRpcSettings: React.FC<NodeRpcSettingsProps> = ({
  nodeStatus,
  onRefreshStatus,
}) => {
  const [rpcHost, setRpcHost] = useState(nodeStatus?.config?.rpcHost || '127.0.0.1');
  const [rpcPort, setRpcPort] = useState(String(nodeStatus?.config?.rpcPort || 44555));
  const [rpcUser, setRpcUser] = useState(nodeStatus?.config?.rpcUser || 'dogeminerrpc');
  const [rpcPassword, setRpcPassword] = useState('shibepassword123');
  const [networkType, setNetworkType] = useState(nodeStatus?.config?.networkType || 'regtest');
  const [minPayout, setMinPayout] = useState(String(nodeStatus?.config?.minPayout || 1.0));
  const [blockReward, setBlockReward] = useState(String(nodeStatus?.config?.blockReward || 10.0));
  const [forceSimulator, setForceSimulator] = useState(Boolean(nodeStatus?.config?.forceSimulator));

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test RPC connection directly
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rpcHost,
          rpcPort: parseInt(rpcPort, 10),
          rpcUser,
          rpcPassword,
        }),
      });
      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Connected successfully!' : 'Connection failed'),
        details: data.info,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Network error: ${err.message}. Ensure your Dogecoin Core 1.14.9 is started with server=1 and listening on ${rpcHost}:${rpcPort}.`,
      });
    } finally {
      setTesting(false);
    }
  };

  // Save Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rpcHost,
          rpcPort: parseInt(rpcPort, 10),
          rpcUser,
          rpcPassword,
          networkType,
          minPayout: parseFloat(minPayout),
          blockReward: parseFloat(blockReward),
          forceSimulator,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        onRefreshStatus();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        nodeStatus?.rpcConnected
          ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
          : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-sm font-bold">
              {nodeStatus?.rpcConnected ? 'Connected to Dogecoin Core v1.14.9' : 'Offline Mode / Simulator Active'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {nodeStatus?.rpcConnected
                ? `Node Subversion: ${nodeStatus.nodeVersion} · Height: #${nodeStatus.blockCount}`
                : 'Dogecoin Core RPC is not detected on local network. The game is operating in full offline simulation mode.'}
            </div>
          </div>
        </div>

        <button
          onClick={onRefreshStatus}
          className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors self-end sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recheck RPC</span>
        </button>
      </div>

      {/* Main Configuration Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
          <Server className="w-4 h-4 text-amber-400" />
          Dogecoin Core 1.14.9 RPC Parameters
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Configure how the game backend server communicates with your Dogecoin Core instance running on your intranet host.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dogecoin Core RPC Host / IP
              </label>
              <input
                type="text"
                value={rpcHost}
                onChange={(e) => setRpcHost(e.target.value)}
                placeholder="127.0.0.1 or LAN IP (e.g. 192.168.1.50)"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Localhost or intranet IP of your dogecoind node
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                RPC Port
              </label>
              <input
                type="number"
                value={rpcPort}
                onChange={(e) => setRpcPort(e.target.value)}
                placeholder="44555 (regtest) or 22555 (mainnet)"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                44555 for regtest (recommended for offline), 22555 for mainnet
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                RPC Username
              </label>
              <input
                type="text"
                value={rpcUser}
                onChange={(e) => setRpcUser(e.target.value)}
                placeholder="dogeminerrpc"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Matches rpcuser in dogecoin.conf
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                RPC Password
              </label>
              <input
                type="password"
                value={rpcPassword}
                onChange={(e) => setRpcPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Matches rpcpassword in dogecoin.conf
              </span>
            </div>
          </div>

          {/* Network Selection and Game Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Network Mode
              </label>
              <select
                value={networkType}
                onChange={(e) => setNetworkType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="regtest">Regtest (Recommended for 100% Offline Intranet)</option>
                <option value="mainnet">Mainnet / Private Fork</option>
                <option value="testnet">Testnet3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Min Payout Threshold (DOGE)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={minPayout}
                onChange={(e) => setMinPayout(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Block Reward Bounty (DOGE)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={blockReward}
                onChange={(e) => setBlockReward(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Offline Simulator Switch */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forceSimulator}
                onChange={(e) => setForceSimulator(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-700"
              />
              <span className="text-xs font-medium text-slate-300">
                Force Offline Simulator Mode (Bypass Node RPC check for local browser testing)
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors active:scale-95"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>{testing ? 'Pinging Node...' : 'Test RPC Connection'}</span>
            </button>

            {saveSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Configuration saved!
              </span>
            )}
          </div>
        </form>

        {/* Test Result Inspector */}
        {testResult && (
          <div className={`mt-5 p-4 rounded-xl border text-xs ${
            testResult.success
              ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{testResult.message}</span>
            </div>
            {testResult.details && (
              <pre className="mt-2 p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] overflow-x-auto font-mono text-slate-300">
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
