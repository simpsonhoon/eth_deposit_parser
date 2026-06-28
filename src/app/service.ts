import { getTransaction, getTransactionReceipt, getCallTrace } from './rpc-client';
import { ParsedDepositResult } from './types';
import { parseDirectEth, parseInternalEth, parseErc20Deposits } from './parser';

export async function parseEthereumDeposit(
  txHash: string,
  targetAddress: string,
): Promise<ParsedDepositResult[]> {
  const target = targetAddress.toLowerCase();

  const [tx, receipt, callTrace] = await Promise.all([
    getTransaction(txHash),
    getTransactionReceipt(txHash),
    getCallTrace(txHash),
  ]);

  if (receipt.status !== '0x1') return [];

  const directEth = parseDirectEth(tx, receipt, target);
  const internalEth = parseInternalEth(callTrace, receipt, txHash, target);
  const erc20 = parseErc20Deposits(receipt, txHash, target);

  return [...directEth, ...internalEth, ...erc20];
}
