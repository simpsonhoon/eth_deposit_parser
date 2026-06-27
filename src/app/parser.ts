import { formatUnits } from 'ethers';
import { RpcTransaction, RpcReceipt, ParsedDepositResult, CallFrame } from './types';
import { ERC20_TRANSFER_TOPIC, SUPPORTED_TOKENS, TOKEN_DECIMALS, TOKEN_SYMBOL } from './constants';

function hexToBigInt(hex: string | undefined | null): bigint {
  if (!hex || hex === '0x' || hex === '0x0') return 0n;
  return BigInt(hex);
}

export function parseDirectEth(
  tx: RpcTransaction,
  receipt: RpcReceipt,
  target: string,
): ParsedDepositResult[] {
  const result: ParsedDepositResult[] = [];
  const directValue = hexToBigInt(tx.value);

  if (tx.to && tx.to.toLowerCase() === target && directValue > 0n) {
    result.push({
      chain: 'ethereum',
      assetType: 'native',
      transferType: 'direct',
      symbol: 'ETH',
      txHash: tx.hash,
      targetAddress: target,
      from: tx.from.toLowerCase(),
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

  // calls 배열을 재귀적으로 순회하며 target으로 들어오는 CALL 프레임을 수집
  // frame.error가 있으면 해당 콜은 revert된 것이므로 입금으로 처리하지 않습니다.
  function collectInternalDeposits(frame: CallFrame, traceAddress: number[], isRoot: boolean): void {
    const to = frame.to?.toLowerCase() ?? null;
    const value = hexToBigInt(frame.value);

    // CALL / CALLCODE 만 실제로 ETH를 전송
    // DELEGATECALL·STATICCALL은 value 개념이 없고,
    // CREATE·CREATE2는 새 컨트랙트 주소로만 ETH가 전달되므로 제외
    const isEthTransferCall = frame.type === 'CALL' || frame.type === 'CALLCODE';

    if (!isRoot && isEthTransferCall && to === target && value > 0n && !frame.error) {
      result.push({
        chain: 'ethereum',
        assetType: 'native',
        transferType: 'internal',
        symbol: 'ETH',
        txHash,
        targetAddress: target,
        from: frame.from.toLowerCase(),
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

    frame.calls?.forEach((child, idx) =>
      collectInternalDeposits(child, [...traceAddress, idx], false),
    );
  }

  collectInternalDeposits(callTrace, [], true);
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
    const contractAddr = log.address.toLowerCase();

    if (!SUPPORTED_TOKENS.has(contractAddr)) continue;
    if (log.topics[0]?.toLowerCase() !== ERC20_TRANSFER_TOPIC) continue;
    if (log.topics.length < 3) continue;

    // Transfer(address indexed from, address indexed to, uint256 value)
    // topic[1] = from (32-byte padded), topic[2] = to (32-byte padded)
    const logTo = ('0x' + log.topics[2].slice(-40)).toLowerCase();
    if (logTo !== target) continue;

    const logFrom = ('0x' + log.topics[1].slice(-40)).toLowerCase();
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
