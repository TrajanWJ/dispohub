import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'DispoHub API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
// TODO: mount deal, offer, transaction, and other routes here

app.listen(PORT, () => {
  console.log(`DispoHub API running on http://localhost:${PORT}`);
});

export default app;
