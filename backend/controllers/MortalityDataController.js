const Mortality = require('../models/MortalityDataModel');

// 📥 Get all Mortality records
exports.getMortalityByUser = (req, res) => {
  const userId = req.user.id;   // 👈 from token, not URL
  const role = req.user.role;   // 👈 from token

  Mortality.getByUser(userId, role, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};