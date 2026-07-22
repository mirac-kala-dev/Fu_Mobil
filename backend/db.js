const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fukampus_db',
  port: Number(process.env.DB_PORT || 3306),
};

/** MySQL bağlantı havuzu — `fukampus_db` oluşturulduktan sonra kullanılır. */
const pool = mysql.createPool({
  ...DB_CONFIG,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
