const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const searchRoutes = require('./routes/searchRoutes');
const stockRoutes = require('./routes/stockRoutes');
const requestRoutes = require('./routes/requestRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Builds and returns the Express app WITHOUT starting a listener or
// connecting to MongoDB/Redis — kept separate from server.js so tests
// can import just the app and manage their own (in-memory) DB connection.
const createApp = () => {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL }));
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.use('/api', apiLimiter);

  app.get('/', (req, res) => {
    res.json({ message: 'Blood Bank API is running' });
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/stock', stockRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/profile', profileRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
