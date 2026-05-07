const db = require('../config/db'); // mysql2 connection

// 🔹 Get all harvest records with user's full name and batch info
exports.getByUser = (user_id, role, callback) => {
  let sql = `
    SELECT 
      m.id,
      m.barn_id,
      m.quantity,
      m.cause,
      u.full_name,
      b.barn_name
    FROM tbl_mortality m
    LEFT JOIN tbl_user  u  ON m.user_id  = u.id
    LEFT JOIN tbl_barn b ON m.barn_id = b.id
    WHERE 1=1
  `;

  const params = [];

  // Only filter by user_id if NOT admin or staff
  if (role !== 'admin' && role !== 'staff') {
    sql += ` AND m.user_id = ?`;
    params.push(user_id);
  }

  db.query(sql, params, callback);
};