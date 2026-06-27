import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import ethereumDepositRouter from './controller';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(ethereumDepositRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop`);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
  process.exit(1);
});
