import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import dealRoutes from './routes/deals.js';
import userRoutes from './routes/users.js';
import matchingRoutes from './routes/matching.js';
import calculatorRoutes from './routes/calculators.js';
import transactionRoutes from './routes/transactions.js';
import contractRoutes from './routes/contracts.js';
import subscriptionRoutes from './routes/subscriptions.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import ratingRoutes from './routes/ratings.js';
import educationRoutes from './routes/education.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'DispoHub API', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Public routes (no auth required)
app.use('/api/calculators', calculatorRoutes);
app.use('/api/education', educationRoutes);

// Auth required routes (auth handled internally by each router)
app.use('/api/deals', dealRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ratings', ratingRoutes);

// Admin only routes (auth + role guard handled internally)
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`DispoHub API running on http://localhost:${PORT}`);
});

export default app;
