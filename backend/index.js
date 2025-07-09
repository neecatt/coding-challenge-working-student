import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { query } from './db/index.js';

dotenv.config();
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/ping', (_, res) => {
  res.json({ message: 'pong' });
});

// TODO: Implement Ticket CRUD endpoints (GET, POST, PATCH, DELETE)

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
