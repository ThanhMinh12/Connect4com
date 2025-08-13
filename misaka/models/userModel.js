const db = require('../config/db');

/*
 * Functions for interacting with the database.
 * These functions handle user registration, login, and retrieval.
 * They interact directly with the database.
 */

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

async function findUserById(id) {
  const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0];
}

async function createGoogleUser(email, username, googleId) {
  const res = await db.query(
    'INSERT INTO users (email, username, google_id) VALUES ($1, $2, $3) RETURNING *',
    [email, username, googleId]
  );
  return res.rows[0];
}

async function findUserByGoogleId(googleId) {
  const res = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return res.rows[0];
}

async function linkGoogleId(userId, googleId) {
  await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, userId]);
}

module.exports = {
  findUserByEmail,
  createUser,
  findUserById,
  findUserByGoogleId,
  createGoogleUser,
  linkGoogleId,
};