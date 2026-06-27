export const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

// keccak256("Transfer(address,address,uint256)")
export const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export const TOKEN_DECIMALS: Record<string, number> = {
  [USDT_ADDRESS.toLowerCase()]: 6,
  [USDC_ADDRESS.toLowerCase()]: 6,
};

export const TOKEN_SYMBOL: Record<string, 'USDT' | 'USDC'> = {
  [USDT_ADDRESS.toLowerCase()]: 'USDT',
  [USDC_ADDRESS.toLowerCase()]: 'USDC',
};

export const SUPPORTED_TOKENS = new Set([
  USDT_ADDRESS.toLowerCase(),
  USDC_ADDRESS.toLowerCase(),
]);
