import { JsonRpcProvider } from 'ethers';
import * as dotenv from 'dotenv';
import { RpcTransaction, RpcReceipt, CallFrame } from './types';

dotenv.config();

// ── Provider ──────────────────────────────────────────────────────────────────

const rpcUrl = process.env.RPC_HTTP_URL;
if (!rpcUrl) throw new Error('RPC_HTTP_URL is not set in environment variables');

export const provider = new JsonRpcProvider(rpcUrl);

// ── RPC helpers ───────────────────────────────────────────────────────────────

export async function getTransaction(txHash: string): Promise<RpcTransaction> {
  const tx = await provider.send('eth_getTransactionByHash', [txHash]);
  if (!tx) throw new Error(`Transaction not found: ${txHash}`);
  return tx;
}

export async function getTransactionReceipt(txHash: string): Promise<RpcReceipt> {
  const receipt = await provider.send('eth_getTransactionReceipt', [txHash]);
  if (!receipt) throw new Error(`Receipt not found: ${txHash}`);
  return receipt;
}


export async function getCallTrace(txHash: string): Promise<CallFrame | null> {
  try {
    return await provider.send('debug_traceTransaction', [
      txHash,
      { tracer: 'callTracer', tracerConfig: { withLog: false } },
    ]);
  } catch (err: unknown) {
    const msg = (err as { error?: { message?: string } })?.error?.message ?? '';
    const isUnsupported =
      msg.includes('not available') || msg.includes('not supported') || msg.includes('upgrade');
    if (!isUnsupported) throw err;
    return null;
  }
}
