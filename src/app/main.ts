import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import ethereumDepositRouter from './controller';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(ethereumDepositRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
