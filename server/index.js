import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'DispoHub API', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`DispoHub API running on http://localhost:${PORT}`);
});

export default app;
