const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Kita panggil koneksi database (nanti kita isi file db.js-nya biar ini bisa jalan)
const db = require('../config/db');

// ==========================================
// 1. Fungsi Register User Baru
// ==========================================
const register = async (req, res) => {
    const { name, password } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();

    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100 || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8 || password.length > 72) {
        return res.status(400).json({ success: false, message: 'Nama, email, atau password tidak valid.' });
    }

    try {
        // Cek apakah email udah terdaftar di database
        const [existingUser] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar!' });
        }

        // Enkripsi password (Hashing) biar aman
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tentukan role (otomatis jadi 'user' kalau nggak dikirim dari frontend)
        // Pendaftaran publik selalu menjadi customer, tidak pernah admin.
        const userRole = 'user';

        // Masukkan data ke database MySQL
        const [result] = await db.promise().query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name.trim(), email, hashedPassword, userRole]
        );

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil!',
            data: { id: result.insertId, name: name.trim(), email, role: userRole }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat registrasi.' });
    }
};

// ==========================================
// 2. Fungsi Login User & Admin
// ==========================================
const login = async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    if (!/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string') {
        return res.status(400).json({ success: false, message: 'Email atau password tidak valid.' });
    }

    try {
        // Cari user berdasarkan email
        const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Email atau password salah!' });
        }

        const user = users[0];

        // Cocokkan password yang diinput dengan password enkripsi di database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Email atau password salah!' });
        }

        // Generate JWT (JSON Web Token) pakai secret key dari .env
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

        // Kirim response sukses beserta token-nya
        res.status(200).json({
            success: true,
            message: 'Login berhasil!',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat login.' });
    }
};

module.exports = { register, login };

const getMe = async (req, res) => {
  return res.json({ success: true, user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role } });
};
module.exports.getMe = getMe;