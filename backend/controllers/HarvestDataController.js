const Harvest = require('../models/HarvestDataModel');

// 📥 Get all Harvest records
exports.getHarvestsByUser = (req, res) => {
  const userId = req.user.id;   // 👈 from token, not URL
  const role = req.user.role;   // 👈 from token

  Harvest.getByUser(userId, role, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};