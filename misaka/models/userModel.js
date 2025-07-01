const db = require('../config/db');
async function findUserByEmail(email) {
  const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
}

async function createUser(email, username, hashedPassword) {
  const res = await db.query(
    'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING *',
    [email, username, hashedPassword]
  );
  return res.rows[0];
}

module.exports = { findUserByEmail, createUser };