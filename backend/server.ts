import { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { processUserQuery } from './api/controller.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const reply = await processUserQuery(message);
    res.json({ reply });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
