const mysql = require('mysql2');
require('dotenv').config(); // Memastikan file .env bisa terbaca

// Setup Koneksi Database (Menggunakan Connection Pool biar lebih stabil untuk skala besar)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Koneksi Database
db.getConnection((err, connection) => {
    if (err) {
        console.error('Gagal koneksi ke database dari db.js:', err.message);
    } else {
        console.log('Database FNB berhasil terkoneksi via config/db.js!');
        connection.release();
    }
});

// Export db supaya bisa dipanggil di controller atau file lain
module.exports = db;