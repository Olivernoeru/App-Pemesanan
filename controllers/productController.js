const db = require('../config/db');

// ==========================================
// 1. CREATE: Tambah Produk Baru (Admin)
// ==========================================
const createProduct = async (req, res) => {
    try {
        const { name, description, price } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Gambar produk wajib di-upload!' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;

        const [result] = await db.promise().query(
            'INSERT INTO products (name, description, price, image_url, status) VALUES (?, ?, ?, ?, ?)',
            [name, description, price, imageUrl, 'active']
        );

        res.status(201).json({
            success: true,
            message: 'Menu Kopi berhasil ditambahkan!',
            data: { id: result.insertId, name, description, price, image_url: imageUrl, status: 'active' }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal menambah produk.' });
    }
};

// ==========================================
// 2. READ: Lihat Daftar Produk (Publik)
// ==========================================
const getAllProducts = async (req, res) => {
    try {
        // Hanya memanggil produk yang statusnya 'active'
        const [products] = await db.promise().query("SELECT * FROM products WHERE status = 'active'");
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data produk.' });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [product] = await db.promise().query("SELECT * FROM products WHERE id = ? AND status = 'active'", [id]);
        
        if (product.length === 0) {
            return res.status(404).json({ success: false, message: 'Menu tidak ditemukan atau sudah tidak aktif.' });
        }

        res.status(200).json({ success: true, data: product[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data produk.' });
    }
};

// ==========================================
// 3. UPDATE: Edit Produk (Admin)
// ==========================================
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, status } = req.body;

        // Cek apakah produknya ada di database
        const [existing] = await db.promise().query('SELECT * FROM products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan!' });
        }

        // Kalau Admin upload gambar baru, pakai gambar baru. Kalau nggak, pakai gambar lama.
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : existing[0].image_url;

        await db.promise().query(
            'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, status = ? WHERE id = ?',
            [
                name || existing[0].name, 
                description || existing[0].description, 
                price || existing[0].price, 
                imageUrl, 
                status || existing[0].status, 
                id
            ]
        );

        res.status(200).json({ success: true, message: 'Menu Kopi berhasil di-update!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal meng-update produk.' });
    }
};

// ==========================================
// 4. DELETE: Soft Delete Produk (Admin)
// ==========================================
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.promise().query('SELECT * FROM products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan!' });
        }

        // Mengubah status jadi 'hidden' bukan menghapus permanen (Soft Delete)
        await db.promise().query("UPDATE products SET status = 'hidden' WHERE id = ?", [id]);

        res.status(200).json({ success: true, message: 'Menu berhasil disembunyikan (Soft Delete)!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal menghapus produk.' });
    }
};

module.exports = { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct };