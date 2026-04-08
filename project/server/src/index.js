import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { authRouter } from './routes/auth.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', authRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('Missing MONGODB_URI in environment.');
  process.exit(1);
}

await mongoose.connect(mongoUri);
console.log('Connected to MongoDB');

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

