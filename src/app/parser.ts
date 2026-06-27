import { formatUnits } from 'ethers';
import { RpcTransaction, RpcReceipt, ParsedDepositResult, CallFrame } from './types';
import { ERC20_TRANSFER_TOPIC, SUPPORTED_TOKENS, TOKEN_DECIMALS, TOKEN_SYMBOL } from './constants';

function hexToBigInt(hex: string | undefined | null): bigint {
  if (!hex || hex === '0x' || hex === '0x0') return 0n;
  return BigInt(hex);
}

function normalizeAddress(addr: string): string {
  return addr.toLowerCase();
}

export function parseDirectEth(
  tx: RpcTransaction,
  receipt: RpcReceipt,
  target: string,
): ParsedDepositResult[] {
  const result: ParsedDepositResult[] = [];
  const directValue = hexToBigInt(tx.value);

  if (tx.to && normalizeAddress(tx.to) === target && directValue > 0n) {
    result.push({
      chain: 'ethereum',
      assetType: 'native',
      transferType: 'direct',
      symbol: 'ETH',
      txHash: tx.hash,
      targetAddress: target,
      from: normalizeAddress(tx.from),
      to: target,
      amount: formatUnits(directValue, 18),
      rawAmount: directValue.toString(),
      decimals: 18,
      blockNumber: parseInt(receipt.blockNumber, 16),
      transactionIndex: parseInt(receipt.transactionIndex, 16),
      traceAddress: [],
      success: receipt.status === '0x1',
    });
  }

  return result;
}

export function parseInternalEth(
  callTrace: CallFrame | null,
  receipt: RpcReceipt,
  txHash: string,
  target: string,
): ParsedDepositResult[] {
  if (!callTrace) return [];

  const result: ParsedDepositResult[] = [];
  const blockNumber = parseInt(receipt.blockNumber, 16);
  const transactionIndex = parseInt(receipt.transactionIndex, 16);

  // calls 배열을 재귀적으로 순회하며 target으로 들어오는 CALL 프레임을 수집합니다.
  // - CALL / CALLCODE 타입만 실제로 ETH를 전송합니다.
  // - 루트 프레임(isRoot=true)은 tx 자체이므로 direct로 처리되며, 여기서는 건너뜁니다.
  // - frame.error가 있으면 해당 콜은 revert된 것이므로 입금으로 처리하지 않습니다.
  function walk(frame: CallFrame, traceAddress: number[], isRoot: boolean): void {
    const to = frame.to ? normalizeAddress(frame.to) : null;
    const value = hexToBigInt(frame.value);
    const isEthCall = frame.type === 'CALL' || frame.type === 'CALLCODE';

    if (!isRoot && isEthCall && to === target && value > 0n && !frame.error) {
      result.push({
        chain: 'ethereum',
        assetType: 'native',
        transferType: 'internal',
        symbol: 'ETH',
        txHash,
        targetAddress: target,
        from: normalizeAddress(frame.from),
        to,
        amount: formatUnits(value, 18),
        rawAmount: value.toString(),
        decimals: 18,
        blockNumber,
        transactionIndex,
        traceAddress: [...traceAddress],
        success: true,
      });
    }

    frame.calls?.forEach((child, idx) => walk(child, [...traceAddress, idx], false));
  }

  walk(callTrace, [], true);
  return result;
}

export function parseErc20Deposits(
  receipt: RpcReceipt,
  txHash: string,
  target: string,
): ParsedDepositResult[] {
  const result: ParsedDepositResult[] = [];
  const blockNumber = parseInt(receipt.blockNumber, 16);
  const transactionIndex = parseInt(receipt.transactionIndex, 16);
  const txSuccess = receipt.status === '0x1';

  for (const log of receipt.logs) {
    const contractAddr = normalizeAddress(log.address);

    if (!SUPPORTED_TOKENS.has(contractAddr)) continue;
    if (log.topics[0]?.toLowerCase() !== ERC20_TRANSFER_TOPIC) continue;
    if (log.topics.length < 3) continue;

    // Transfer(address indexed from, address indexed to, uint256 value)
    // topic[1] = from (32-byte padded), topic[2] = to (32-byte padded)
    const logTo = normalizeAddress('0x' + log.topics[2].slice(-40));
    if (logTo !== target) continue;

    const logFrom = normalizeAddress('0x' + log.topics[1].slice(-40));
    const rawAmount = hexToBigInt(log.data);
    const decimals = TOKEN_DECIMALS[contractAddr];
    const symbol = TOKEN_SYMBOL[contractAddr];

    result.push({
      chain: 'ethereum',
      assetType: 'erc20',
      transferType: 'event',
      symbol,
      tokenContract: log.address,
      txHash,
      targetAddress: target,
      from: logFrom,
      to: logTo,
      amount: formatUnits(rawAmount, decimals),
      rawAmount: rawAmount.toString(),
      decimals,
      blockNumber,
      transactionIndex,
      logIndex: parseInt(log.logIndex, 16),
      success: txSuccess,
    });
  }

  return result;
}
