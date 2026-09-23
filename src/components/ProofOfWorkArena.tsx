import React, { useState, useEffect, useRef } from 'react';
import { Cpu, CheckCircle2, Play, Square, Trophy, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playBlockSolvedSound, playCoinSound } from '../utils/audio.ts';
import { NodeStatus } from '../types/index.ts';

interface ProofOfWorkArenaProps {
  currentBlockHeight: number;
  blockReward: number;
  payoutAddress: string;
  minerName: string;
  nodeStatus: NodeStatus | null;
  onBlockFound: (reward: number, nonce: number) => void;
}

// Simple deterministic hash simulation for fast client execution
function computeSimulatedHash(prevHash: string, height: number, nonce: number): string {
  let str = `${prevHash}_${height}_${nonce}_doge_scrypt_salt`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
  // Format as 64 hex characters
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const part3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const part4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
  const part5 = (Math.imul(h1, 31) >>> 0).toString(16).padStart(8, '0');
  const part6 = (Math.imul(h2, 17) >>> 0).toString(16).padStart(8, '0');
  const part7 = (h2.toString(16) + h1.toString(16)).slice(0, 8).padStart(8, '0');
  const part8 = (h1.toString(16) + h2.toString(16)).slice(0, 8).padStart(8, '0');
  return `${part1}${part2}${part3}${part4}${part5}${part6}${part7}${part8}`;
}

export const ProofOfWorkArena: React.FC<ProofOfWorkArenaProps> = ({
  currentBlockHeight,
  blockReward,
  payoutAddress,
  minerName,
  nodeStatus,
  onBlockFound,
}) => {
  const [nonce, setNonce] = useState(104820);
  const [prevHash, setPrevHash] = useState('00000000000000000004e9c73bf4b437c35a6435c24d9894e63f58a74e51148f');
  const [difficultyTarget, setDifficultyTarget] = useState('0000'); // Requires 4 leading zeros
  const [currentHash, setCurrentHash] = useState('7f4a21098bca48721cba34ef817293a90821bcfa781298cbedef091823719283');
  const [isAutoMining, setIsAutoMining] = useState(false);
  const [solvedBlocksCount, setSolvedBlocksCount] = useState(0);
  const [lastSolvedBlock, setLastSolvedBlock] = useState<any | null>(null);
  const [hashSpeed, setHashSpeed] = useState(0);

  const autoMiningRef = useRef<boolean>(false);
  autoMiningRef.current = isAutoMining;

  // Single step nonce check
  const stepHash = (currentNonce: number): { hit: boolean; nextNonce: number; hash: string } => {
    const nextNonce = currentNonce + 1;
    let computed = computeSimulatedHash(prevHash, currentBlockHeight, nextNonce);

    // Controlled game difficulty: force leading zeroes based on difficultyTarget pattern
    // Every ~45 to 80 hashes, guarantee a match so gameplay is satisfying!
    if (nextNonce % 65 === 0) {
      computed = difficultyTarget + computed.slice(difficultyTarget.length);
    }

    const hit = computed.startsWith(difficultyTarget);
    return { hit, nextNonce, hash: computed };
  };

  const handleManualHash = () => {
    const { hit, nextNonce, hash } = stepHash(nonce);
    setNonce(nextNonce);
    setCurrentHash(hash);

    if (hit) {
      triggerBlockFound(nextNonce, hash);
    }
  };

  const triggerBlockFound = (winningNonce: number, winningHash: string) => {
    setIsAutoMining(false);
    playBlockSolvedSound();
    playCoinSound();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#FBBF24', '#10B981', '#38BDF8'],
    });

    const blockData = {
      height: currentBlockHeight + 1,
      nonce: winningNonce,
      hash: winningHash,
      reward: blockReward,
      timestamp: Date.now(),
      miner: minerName,
      payoutAddress,
    };

    setSolvedBlocksCount((c) => c + 1);
    setLastSolvedBlock(blockData);
    setPrevHash(winningHash);

    // Call parent handler
    onBlockFound(blockReward, winningNonce);
  };

  // Auto-mining worker loop
  useEffect(() => {
    let timer: any = null;
    if (isAutoMining) {
      let localNonce = nonce;
      let hashesInSecond = 0;

      const speedInterval = setInterval(() => {
        setHashSpeed(hashesInSecond);
        hashesInSecond = 0;
      }, 1000);

      const loop = () => {
        if (!autoMiningRef.current) return;
        // Batch 5 hashes per frame for snappy 60fps performance
        for (let i = 0; i < 5; i++) {
          const { hit, nextNonce, hash } = stepHash(localNonce);
          localNonce = nextNonce;
          hashesInSecond += 1;
          if (hit) {
            setNonce(localNonce);
            setCurrentHash(hash);
            triggerBlockFound(localNonce, hash);
            clearInterval(speedInterval);
            return;
          }
        }
        setNonce(localNonce);
        setCurrentHash(computeSimulatedHash(prevHash, currentBlockHeight, localNonce));
        timer = setTimeout(loop, 40);
      };

      loop();

      return () => {
        clearTimeout(timer);
        clearInterval(speedInterval);
      };
    } else {
      setHashSpeed(0);
    }
  }, [isAutoMining]);

  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">
              Dogecoin Proof-of-Work Block Arena
            </h2>
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-medium">
              Block #{currentBlockHeight}
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Iterate Scrypt nonces until the resulting hash satisfies the target difficulty. Finding a block awards the full{' '}
            <strong className="text-amber-400 font-mono font-bold">{blockReward} DOGE</strong> coinbase reward directly into your game payout balance!
          </p>
        </div>

        {/* Live Regtest Status */}
        <div className="text-right">
          <div className="text-xs text-slate-500">Connected Dogecoin Chain</div>
          <div className="text-sm font-bold text-amber-300 font-mono">
            {nodeStatus?.networkType ? `${nodeStatus.networkType.toUpperCase()} 1.14.9` : 'REGTEST / SIM'}
          </div>
        </div>
      </div>

      {/* Main Terminal Rig Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl font-mono relative overflow-hidden">
        {/* Subtle scanline background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 to-slate-950/80 pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header row with difficulty selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Target Difficulty:</span>
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setDifficultyTarget('000')}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    difficultyTarget === '000' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fast (000)
                </button>
                <button
                  onClick={() => setDifficultyTarget('0000')}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    difficultyTarget === '0000' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Standard (0000)
                </button>
                <button
                  onClick={() => setDifficultyTarget('00000')}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    difficultyTarget === '00000' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Hard (00000)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <span>Auto-Speed: <strong className="text-amber-400">{hashSpeed} H/s</strong></span>
              <span>Blocks Won: <strong className="text-emerald-400">{solvedBlocksCount}</strong></span>
            </div>
          </div>

          {/* Block Header Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-slate-500 mb-1">Previous Block Hash:</div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-slate-300 break-all text-[11px]">
                {prevHash}
              </div>
            </div>
            <div>
              <div className="text-slate-500 mb-1">Target Hash Condition:</div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-amber-300 break-all text-[11px]">
                {difficultyTarget}ffffffffffffffffffffffffffffffffffffffffffffffffffffffff
              </div>
            </div>
          </div>

          {/* Live Hashing Nonce Display */}
          <div className="bg-slate-900/90 border border-amber-500/20 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Candidate Nonce (Proof-of-Work)</span>
              <span className="text-amber-400">Nonce: #{nonce.toLocaleString()}</span>
            </div>

            <div className="text-sm sm:text-base text-slate-100 break-all font-mono py-2 tracking-wider">
              {currentHash.startsWith(difficultyTarget) ? (
                <span className="text-emerald-400 font-bold bg-emerald-500/20 px-1 py-0.5 rounded">
                  {currentHash.slice(0, difficultyTarget.length)}
                </span>
              ) : (
                <span className="text-rose-400/80">
                  {currentHash.slice(0, difficultyTarget.length)}
                </span>
              )}
              <span className="text-slate-300">{currentHash.slice(difficultyTarget.length)}</span>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-800 pt-2 text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isAutoMining ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
                {isAutoMining ? 'ASIC Engine Hashing Nonces...' : 'Ready to Mine'}
              </span>
              <span>Block Reward: <strong className="text-amber-400">{blockReward} DOGE</strong></span>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleManualHash}
              disabled={isAutoMining}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold font-sans flex items-center gap-2 transition-all ${
                isAutoMining
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-100 cursor-pointer active:scale-95 border border-slate-700'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Step 1 Nonce</span>
            </button>

            <button
              onClick={() => setIsAutoMining(!isAutoMining)}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold font-sans flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                isAutoMining
                  ? 'bg-rose-500 hover:bg-rose-400 text-slate-950'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
              }`}
            >
              {isAutoMining ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Auto-Mining</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Auto-Mining Rig</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Last Solved Block Banner */}
      {lastSolvedBlock && (
        <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-xl p-4 sm:p-5 flex items-start gap-3">
          <Trophy className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
              <span>Block #{lastSolvedBlock.height} Solved & Mined!</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-slate-300">
              Nonce: <code className="text-amber-300 font-mono">#{lastSolvedBlock.nonce}</code> · Reward:{' '}
              <strong className="text-amber-400 font-bold font-mono">+{lastSolvedBlock.reward} DOGE</strong> credited to your payout balance!
            </div>
            <div className="font-mono text-[11px] text-slate-400 break-all">
              Hash: {lastSolvedBlock.hash}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
