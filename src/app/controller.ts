import { Router, Request, Response } from 'express';
import { parseEthereumDeposit } from './service';

const router = Router();

router.get('/deposit', async (req: Request, res: Response): Promise<void> => {
  const { txHash, targetAddress } = req.query;

  if (!txHash || typeof txHash !== 'string') {
    res.status(400).json({ error: 'txHash query parameter is required' });
    return;
  }
  if (!targetAddress || typeof targetAddress !== 'string') {
    res.status(400).json({ error: 'targetAddress query parameter is required' });
    return;
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    res.status(400).json({ error: 'txHash must be a valid 32-byte hex string (0x + 64 hex chars)' });
    return;
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(targetAddress)) {
    res.status(400).json({ error: 'targetAddress must be a valid Ethereum address (0x + 40 hex chars)' });
    return;
  }

  try {
    const results = await parseEthereumDeposit(txHash, targetAddress);
    res.json({ txHash, targetAddress, count: results.length, deposits: results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
