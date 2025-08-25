const express = require('express');
const { identifyController } = require('../controllers/identifyController');

const router = express.Router();

// Main identify endpoint
router.post('/identify', identifyController);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Bitespeed Identity Service'
  });
});

module.exports = router;