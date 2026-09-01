const mysql = require('mysql2');
require('dotenv').config(); // Memastikan file .env bisa terbaca

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: Number(process.env.DB_QUEUE_LIMIT || 50),
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

async function checkDatabase() {
    await db.promise().query('SELECT 1');
    return true;
}

// Export db supaya bisa dipanggil di controller atau file lain
module.exports = db;
module.exports.checkDatabase = checkDatabase;