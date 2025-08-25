const contactService = require('../services/contactService');

const identifyController = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    // Basic validation
    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: 'Either email or phoneNumber must be provided'
      });
    }

    const result = await contactService.identify(email, phoneNumber);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in identify controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { identifyController };
