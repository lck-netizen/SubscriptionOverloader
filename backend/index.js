require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./db');

const authRouter = require('./routes/auth');
const subscriptionsRouter = require('./routes/subscriptions');
const dashboardRouter = require('./routes/dashboard');
const notificationsRouter = require('./routes/notifications');
const profileRouter = require('./routes/profile');
const emailRouter = require('./routes/email');
const insightsRouter = require('./routes/insights');
const transactionsRouter = require('./routes/transactions');
const { errorHandler } = require('./middleware/errorHandler');


const app = express();

const corsOrigins = (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim());
app.use(
  cors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Serve uploaded files statically under /api path
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/', (req, res) => res.json({ message: 'Subscription Overload Manager API' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/email', emailRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/transactions', transactionsRouter);


app.use((err, req, res, next) => {
  errorHandler(err, req, res, next);
});

const PORT = Number(process.env.PORT || 8001);

(async () => {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[server] listening on 0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('[server] failed to start', err);
    process.exit(1);
  }
})();
