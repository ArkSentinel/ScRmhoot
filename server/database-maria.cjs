const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'nicolas',
  password: '123',
  database: 'mri_console',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.execute(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.execute(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results[0] || null);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.execute(sql, params, function(err, result) {
      if (err) reject(err);
      else resolve({ lastInsertRowid: result.insertId, changes: result.affectedRows });
    });
  });
}

async function all(sql, params = []) {
  const results = await get(sql, params);
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