const jwt = require('jsonwebtoken');
const db = require('../config/db');

// 1. Fungsi untuk verifikasi token secara umum (User & Admin)
const verifyToken = async (req, res, next) => {
    // Ngambil token dari header Authorization (Format standar: "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7);

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Akses ditolak. Token JWT tidak ditemukan!' 
        });
    }

    try {
        // Ngecek apakah token valid pakai kunci rahasia dari .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await db.promise().query('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
        if (!users.length) return res.status(401).json({ success: false, message: 'Sesi tidak lagi valid.' });
        req.user = users[0];
        
        next(); // Lanjut ke proses atau controller berikutnya
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Akses ditolak. Token tidak valid atau sudah kadaluarsa!' 
        });
    }

};

// 2. Fungsi khusus untuk membatasi akses hanya untuk Admin
const verifyAdmin = (req, res, next) => {
    // Pastikan fungsi verifyToken udah jalan duluan dan nge-set req.user
    if (req.user && req.user.role === 'admin') {
        next(); // Role admin valid, silakan lewat
    } else {
        return res.status(403).json({ 
            success: false, 
            message: 'Akses diblokir. Area ini khusus Admin!' 
        });
    }
};

// 3. Middleware opsional: jika ada token valid maka set req.user, kalau tidak ada / invalid lanjut saja
const optionalToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7);

    if (!token) return next(); // Tidak ada token, lanjut tanpa user info

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await db.promise().query('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
        if (users.length) req.user = users[0];
    } catch (_) {
        // Token tidak valid, abaikan saja dan lanjutkan sebagai guest
    }
    next();
};


module.exports = { verifyToken, verifyAdmin, optionalToken };