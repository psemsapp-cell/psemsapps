const express = require('express');
const axios = require('axios');
const router = express.Router();

require('dotenv').config();

const BASE_URL = 'https://api.textbee.dev/api/v1';
const API_KEY = process.env.TEXTBEE_API_KEY;
const DEVICE_ID = process.env.TEXTBEE_DEVICE_ID;

if (!API_KEY || !DEVICE_ID) {
  console.error('Missing TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID');
}

router.post('/send-sms', async (req, res) => {
  const body = req.body || {};
  const phone = body.phone;
  const message = body.message;

  console.log('Received:', phone, message);

  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and message required' });
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/gateway/devices/${DEVICE_ID}/send-sms`,
      { recipients: [phone], message },
      { headers: { 'x-api-key': API_KEY } }
    );
    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error('TextBee error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to send SMS', details: err.response?.data || err.message });
  }
});

module.exports = router;