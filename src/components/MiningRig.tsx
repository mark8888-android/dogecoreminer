import React, { useState, useEffect, useRef } from 'react';
import { Pickaxe, Zap, Activity, ShoppingCart, UserCheck, Flame } from 'lucide-react';
import { GoldDogeCoin } from './DogeIcons.tsx';
import { PlayerProfile, RigUpgrade, WorkerShibe } from '../types/index.ts';
import { playPickaxeSound, playCoinSound, playUpgradeSound } from '../utils/audio.ts';

interface MiningRigProps {
  player: PlayerProfile;
  onMineReward: (amount: number, isBlock?: boolean) => void;
  onUpgradeHashrate: (newHashrate: number) => void;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

const INITIAL_UPGRADES: RigUpgrade[] = [
  { id: 'pick_bronze', name: 'Shibe Bronze Pickaxe', level: 1, baseCost: 1.5, hashratePerUnit: 2, description: 'Sturdy copper-bronze pickaxe for striking raw Scrypt blocks.', icon: 'pickaxe' },
  { id: 'gold_paw', name: 'Golden Shibe Paw', level: 0, baseCost: 5.0, hashratePerUnit: 8, description: 'Blessed lucky paw granting swift hashing reflexes.', icon: 'paw' },
  { id: 'gpu_rig', name: 'Dual Radeon GPU Rig', level: 0, baseCost: 18.0, hashratePerUnit: 35, description: 'Overclocked graphic card rig dedicated to Scrypt algorithms.', icon: 'gpu' },
  { id: 'asic_miner', name: 'Antminer L7 Scrypt Moon Rig', level: 0, baseCost: 60.0, hashratePerUnit: 150, description: 'Commercial ASIC powerhouse designed exclusively for Dogecoin.', icon: 'asic' },
  { id: 'hydro_farm', name: 'Doge Geothermal Sub-Station', level: 0, baseCost: 220.0, hashratePerUnit: 600, description: 'Underground renewable mining farm cooling 500 parallel rigs.', icon: 'hydro' },
  { id: 'quantum_shibe', name: 'Quantum Shibe Supercomputer', level: 0, baseCost: 850.0, hashratePerUnit: 2500, description: 'Subatomic qubits solving Dogecoin nonces at lightspeed.', icon: 'quantum' },
];

const INITIAL_WORKERS: WorkerShibe[] = [
  { id: 'puppy', name: 'Puppy Apprentice Shibe', role: 'Ore Carrier', hired: 0, cost: 3.0, multiplier: 1.1, quote: 'Much excite! Very work!' },
  { id: 'senior', name: 'Senior Miner Doge', role: 'Shaft Foreman', hired: 0, cost: 12.0, multiplier: 1.25, quote: 'I was mining at block 1 in 2013.' },
  { id: 'cable', name: 'Cable Management Doge', role: 'Optic Engineer', hired: 0, cost: 45.0, multiplier: 1.5, quote: 'Zero packet loss, pure Doge.' },
  { id: 'dogefather', name: 'Elon Cyber Shibe', role: 'Chief Meme Officer', hired: 0, cost: 200.0, multiplier: 2.2, quote: 'To the literal Moon and Mars!' },
];

export const MiningRig: React.FC<MiningRigProps> = ({
  player,
  onMineReward,
  onUpgradeHashrate,
}) => {
  const [upgrades, setUpgrades] = useState<RigUpgrade[]>(() => {
    const saved = localStorage.getItem('doge_game_upgrades');
    return saved ? JSON.parse(saved) : INITIAL_UPGRADES;
  });

  const [workers, setWorkers] = useState<WorkerShibe[]>(() => {
    const saved = localStorage.getItem('doge_game_workers');
    return saved ? JSON.parse(saved) : INITIAL_WORKERS;
  });

  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isStriking, setIsStriking] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const comboTimerRef = useRef<any>(null);

  // Calculate Total Hashrate
  const baseHash = upgrades.reduce((acc, u) => acc + u.level * u.hashratePerUnit, 5);
  const workerMultiplier = workers.reduce((acc, w) => acc * (w.hired > 0 ? Math.pow(w.multiplier, w.hired) : 1), 1);
  const totalHashrate = Math.round(baseHash * workerMultiplier);

  // Sync hashrate to parent
  useEffect(() => {
    onUpgradeHashrate(totalHashrate);
  }, [totalHashrate]);

  // Persist upgrades and workers
  useEffect(() => {
    localStorage.setItem('doge_game_upgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  useEffect(() => {
    localStorage.setItem('doge_game_workers', JSON.stringify(workers));
  }, [workers]);

  // Automated Passive Mining Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (totalHashrate > 0) {
        // Hash rate generates small passive DOGE
        const passiveReward = (totalHashrate * 0.00035);
        onMineReward(passiveReward, false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [totalHashrate, onMineReward]);

  // Manual Mine Click Action
  const handleMineClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playPickaxeSound();
    setIsStriking(true);
    setTimeout(() => setIsStriking(false), 140);

    // Combo streak calculation
    const newCombo = comboCount + 1;
    setComboCount(newCombo);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => setComboCount(0), 1800);

    // Calculate click reward
    const isCrit = Math.random() < 0.15;
    const baseClick = 0.02 + totalHashrate * 0.0002;
    const finalReward = isCrit ? baseClick * 4 : baseClick;

    if (isCrit) {
      playCoinSound();
    }

    onMineReward(finalReward, false);

    // Create floating feedback text
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (Math.random() * 40 - 20);
    const y = e.clientY - rect.top - 10;

    const phrases = ['+ ' + finalReward.toFixed(3) + ' DOGE', 'SUCH HASH!', 'MUCH MINING!', 'WOW!', 'DOGE TO MOON!'];
    const text = isCrit ? `★ CRITICAL WOW! +${finalReward.toFixed(3)} DOGE` : phrases[Math.floor(Math.random() * phrases.length)];

    const id = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev.slice(-8), {
      id,
      text,
      x,
      y,
      color: isCrit ? 'text-amber-300 font-extrabold text-base' : 'text-amber-400 font-bold text-xs sm:text-sm',
    }]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 950);
  };

  // Buy Rig Upgrade
  const buyUpgrade = (upgradeId: string) => {
    const up = upgrades.find((u) => u.id === upgradeId);
    if (!up) return;
    const cost = up.baseCost * Math.pow(1.3, up.level);

    if (player.pendingBalance < cost) {
      alert(`Insufficient pending DOGE! You need ${cost.toFixed(2)} DOGE. Keep mining!`);
      return;
    }

    // Deduct cost and level up
    onMineReward(-cost, false);
    setUpgrades((prev) =>
      prev.map((item) =>
        item.id === upgradeId ? { ...item, level: item.level + 1 } : item
      )
    );
    playUpgradeSound();
  };

  // Hire Worker Shibe
  const hireWorker = (workerId: string) => {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) return;
    const cost = worker.cost * Math.pow(1.4, worker.hired);

    if (player.pendingBalance < cost) {
      alert(`Insufficient pending DOGE! You need ${cost.toFixed(2)} DOGE to hire ${worker.name}.`);
      return;
    }

    onMineReward(-cost, false);
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === workerId ? { ...w, hired: w.hired + 1 } : w
      )
    );
    playUpgradeSound();
  };

  return (
    <div className="space-y-6">
      {/* Top Hashrate HUD & Combo Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Rig Hashrate</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100 tabular-nums">
            {totalHashrate.toLocaleString()}{' '}
            <span className="text-xs font-sans text-amber-400">H/s</span>
          </div>
          <div className="text-[11px] text-slate-500">Scrypt Dogecoin Algorithm</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Mining Streak</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-orange-400 tabular-nums">
            {comboCount}x
          </div>
          <div className="text-[11px] text-slate-500">
            {comboCount > 10 ? 'Super Shibe Speed!' : 'Click to build momentum'}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Lifetime Mined</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-yellow-400 tabular-nums">
            {player.lifetimeMined.toFixed(2)}{' '}
            <span className="text-xs font-sans text-slate-400">DOGE</span>
          </div>
          <div className="text-[11px] text-slate-500">Total generated</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <Pickaxe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Blocks Solved</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {player.blocksSolved}
          </div>
          <div className="text-[11px] text-slate-500">Confirmed on blockchain</div>
        </div>
      </div>

      {/* Main Mining Stage & Shop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Mining Rig Target */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[420px] shadow-xl">
          {/* Subtle amber gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-slate-950/60 pointer-events-none" />

          {/* Floating reward particles */}
          {floatingTexts.map((f) => (
            <div
              key={f.id}
              style={{ left: `${f.x}px`, top: `${f.y}px` }}
              className={`absolute pointer-events-none select-none z-30 transition-all duration-1000 transform -translate-y-12 opacity-90 ${f.color}`}
            >
              {f.text}
            </div>
          ))}

          {/* Clickable Gold Dogecoin Giant Button */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <button
              onClick={handleMineClick}
              aria-label="Click to mine Dogecoin"
              className={`group relative p-4 rounded-full transition-transform duration-75 focus:outline-none cursor-pointer active:scale-90 ${
                isStriking ? 'scale-95' : 'hover:scale-105'
              }`}
            >
              {/* Outer Golden Glow */}
              <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl group-hover:bg-amber-400/30 transition-all" />

              {/* Coin Centerpiece */}
              <GoldDogeCoin className="w-48 h-48 sm:w-56 sm:h-56 filter drop-shadow-[0_12px_24px_rgba(245,158,11,0.25)]" />

              {/* Overlay Pickaxe Animated Tool */}
              <div
                className={`absolute top-2 right-4 text-amber-300 drop-shadow-md transition-transform duration-100 ${
                  isStriking ? 'rotate-[-35deg] translate-x-[-12px] translate-y-[12px]' : 'rotate-12 group-hover:rotate-6'
                }`}
              >
                <Pickaxe className="w-14 h-14" />
              </div>
            </button>

            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-bold text-slate-100">
                Click Coin to Mine Scrypt Nonces
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Each strike hashes Dogecoin block candidate headers. Upgrades & workers mine automatically 24/7!
              </p>
            </div>

            {/* Quick Helper Button */}
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
              <span>+{(0.02 + totalHashrate * 0.0002).toFixed(3)} DOGE per click</span>
              <span className="text-slate-600">·</span>
              <span>15% Crit Chance</span>
            </div>
          </div>
        </div>

        {/* Right Column: Upgrades & Worker Shibes */}
        <div className="lg:col-span-6 space-y-5">
          {/* Section 1: Rig Hardware Upgrades */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-200">Hardware Upgrades</h3>
              </div>
              <span className="text-xs text-slate-500">Spend pending DOGE</span>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {upgrades.map((u) => {
                const cost = u.baseCost * Math.pow(1.3, u.level);
                const canAfford = player.pendingBalance >= cost;

                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {u.name}
                        </span>
                        <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                          Lv.{u.level}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        +{u.hashratePerUnit} H/s each · {u.description}
                      </div>
                    </div>

                    <button
                      onClick={() => buyUpgrade(u.id)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      }`}
                    >
                      {cost.toFixed(2)} DOGE
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Worker Shibes */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200">Worker Doges</h3>
              </div>
              <span className="text-xs text-slate-500">Hashrate Multipliers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {workers.map((w) => {
                const cost = w.cost * Math.pow(1.4, w.hired);
                const canAfford = player.pendingBalance >= cost;

                return (
                  <div
                    key={w.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{w.name}</span>
                        <span className="text-[11px] font-mono text-emerald-400">
                          x{w.hired}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {w.role} · +{Math.round((w.multiplier - 1) * 100)}% Speed
                      </div>
                      <div className="text-[10px] italic text-amber-300/80 mt-1">
                        "{w.quote}"
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400">
                        {cost.toFixed(2)} DOGE
                      </span>
                      <button
                        onClick={() => hireWorker(w.id)}
                        disabled={!canAfford}
                        className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                          canAfford
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Hire
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
