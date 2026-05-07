const db = require('../config/db'); // ✅ this line was missing!

exports.getByUser = (user_id, role, callback) => {
  const sql = `
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
    WHERE m.user_id = ?
  `;
  db.query(sql, [user_id], callback);
};