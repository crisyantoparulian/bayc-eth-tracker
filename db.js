// db.js
const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('./config');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS total_eth (
    block INTEGER PRIMARY KEY,
    total REAL
  )`);
});

function saveCachedTotal(block, total) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT OR REPLACE INTO total_eth (block, total) VALUES (?, ?)`, [block, total], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getTotalFromCache(block) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT total FROM total_eth WHERE block = ?`, [block], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.total : null);
    });
  });
}

function closeDB() {
  db.close();
}

module.exports = { saveCachedTotal, getTotalFromCache, closeDB };
