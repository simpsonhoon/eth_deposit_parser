export type ParsedDepositResult = {
  chain: 'ethereum';
  assetType: 'native' | 'erc20';
  transferType: 'direct' | 'internal' | 'event';
  symbol: 'ETH' | 'USDT' | 'USDC';
  tokenContract?: string;
  txHash: string;
  targetAddress: string;
  from: string;
  to: string;
  amount: string;
  rawAmount: string;
  decimals: number;
  blockNumber: number;
  transactionIndex?: number;
  logIndex?: number;
  traceAddress?: number[];
  success: boolean;
};

export type RpcTransaction = {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  blockNumber: string;
  transactionIndex: string;
};

export type RpcLog = {
  address: string;
  topics: string[];
  data: string;
  logIndex: string;
  transactionIndex: string;
  blockNumber: string;
};

export type RpcReceipt = {
  status: string;
  blockNumber: string;
  transactionIndex: string;
  logs: RpcLog[];
};

// debug_traceTransaction callTracer response frame
export type CallFrame = {
  type: string;    // "CALL" | "CALLCODE" | "DELEGATECALL" | "STATICCALL" | "CREATE" | "CREATE2"
  from: string;
  to?: string;
  value?: string;  // hex string, only present when value > 0
  error?: string;  // present when this call reverted
  calls?: CallFrame[];
};
