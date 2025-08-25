const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/user', routes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404
// app.use('*', (req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📍 Health check: http://localhost:${PORT}/health`);
//   console.log(`🔍 Identify endpoint: http://localhost:${PORT}/identify`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('👋 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('👋 Shutting down server...');
  process.exit(0);
});