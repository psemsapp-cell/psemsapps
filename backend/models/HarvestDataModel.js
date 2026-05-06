const db = require('../config/db'); // mysql2 connection

// 🔹 Get all harvest records with user's full name and batch info
exports.getByUser = (user_id, role, callback) => {
  let sql = `
    SELECT 
      h.id,
      h.batch_id,
      h.no_boxes,
      h.no_harvest,
      u.full_name,
      bt.batch_name
    FROM tbl_harvest h
    LEFT JOIN tbl_user  u  ON h.user_id  = u.id
    LEFT JOIN tbl_batch bt ON h.batch_id = bt.id
    WHERE 1=1
  `;

  const params = [];

  if (role !== 'admin' && role !== 'staff') {
    sql += ` AND h.user_id = ?`;
    params.push(user_id);
  }

  db.query(sql, params, callback);
};