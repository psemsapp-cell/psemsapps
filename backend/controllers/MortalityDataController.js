const Mortality = require('../models/MortalityDataModel');

exports.getMortalityByUser = (req, res) => {
  const { user_id } = req.params;
  const role = req.query.role || 'staff';
  Mortality.getByUser(user_id, role, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};