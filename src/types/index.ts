export interface PlayerProfile {
  minerName: string;
  payoutAddress: string;
  pendingBalance: number;
  lifetimeMined: number;
  blocksSolved: number;
  totalPayouts: number;
  hashrate: number;
}

export interface NodeStatus {
  rpcConnected: boolean;
  nodeVersion: string;
  blockCount: number;
  walletBalance: number;
  gameAddress: string;
  networkType: 'regtest' | 'mainnet' | 'testnet';
  config: {
    rpcHost: string;
    rpcPort: number;
    rpcUser: string;
    networkType: string;
    minPayout: number;
    blockReward: number;
    forceSimulator: boolean;
  };
  stats: {
    activePlayersCount: number;
    totalPaidOut: number;
    totalPending: number;
    totalPayoutTransactions: number;
  };
  rpcError?: string | null;
}

export interface PayoutRecord {
  id: string;
  txid: string;
  payoutAddress: string;
  minerName: string;
  amount: number;
  fee: number;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  network: string;
}

export interface RigUpgrade {
  id: string;
  name: string;
  level: number;
  baseCost: number;
  hashratePerUnit: number;
  description: string;
  icon: string;
}

export interface WorkerShibe {
  id: string;
  name: string;
  role: string;
  hired: number;
  cost: number;
  multiplier: number;
  quote: string;
}
