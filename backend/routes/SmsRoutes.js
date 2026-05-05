router.post('/send-sms', async (req, res) => {
  console.log('req.body:', req.body); // debug log
  
  const body = req.body || {};
  const phone = body.phone;
  const message = body.message;
  
  if (!phone || !message) return res.status(400).json({ error: 'Phone and message required' });

  try {
    const response = await axios.post(
      `${BASE_URL}/gateway/devices/${DEVICE_ID}/send-sms`,
      { recipients: [phone], message },
      { headers: { 'x-api-key': API_KEY } }
    );

    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error('TextBee API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to send SMS', details: err.response?.data || err.message });
  }
});