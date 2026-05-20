const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'mri_console',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function query(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results;
}

async function get(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results[0] || null;
}

async function run(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return { lastInsertRowid: result.insertId, changes: result.affectedRows };
}

async function all(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results || [];
}

const db = {
  prepare: (sql) => ({
    all: (params = []) => all(sql, params),
    get: (params = []) => get(sql, params),
    run: (params = []) => run(sql, params)
  }),
  exec: (sql) => query(sql, []),
  close: () => pool.end()
};

module.exports = db;