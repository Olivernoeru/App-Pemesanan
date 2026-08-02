const db = require("../config/db");
const fs = require("fs");
const path = require("path");

// ==========================================
// 1. CREATE: Tambah Produk Baru (Admin)
// ==========================================
const createProduct = async (req, res) => {
  try {
    // TANGKAP KATEGORI DARI FRONTEND
    const { name, description, price, category } = req.body;

    // 1. Validasi Super Ketat
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Gambar produk wajib di-upload!" });
    }
    if (!name || !description || !price) {
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({
          success: false,
          message: "Semua field (Nama, Deskripsi, Harga) wajib diisi!",
        });
    }

    // 2. Paksa tipe data angka
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) {
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({ success: false, message: "Harga harus berupa angka!" });
    }

    // DEFAULT KATEGORI (Jaga-jaga kalau kosong)
    const productCategory = category || "Coffee";
    const imageUrl = `/uploads/${req.file.filename}`;

    // 3. Eksekusi Database (Suntik Category ke Query)
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO products (name, description, price, category, image_url, status) VALUES (?, ?, ?, ?, ?, ?)",
        [name, description, numericPrice, productCategory, imageUrl, "active"],
      );

    res.status(201).json({
      success: true,
      message: "Menu Kopi berhasil ditambahkan!",
      data: {
        id: result.insertId,
        name,
        description,
        price: numericPrice,
        category: productCategory, // Tampilkan di response
        image_url: imageUrl,
        status: "active",
      },
    });
  } catch (error) {
    console.error("Error di createProduct:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: "Gagal menambah produk." });
  }
};

// ==========================================
// 2. READ: Lihat Daftar Produk (Publik)
// ==========================================
const getAllProducts = async (req, res) => {
  try {
    const [products] = await db
      .promise()
      .query("SELECT * FROM products WHERE status = 'active'");
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data produk." });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [product] = await db
      .promise()
      .query("SELECT * FROM products WHERE id = ? AND status = 'active'", [id]);

    if (product.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Menu tidak ditemukan atau sudah tidak aktif.",
        });
    }
    res.status(200).json({ success: true, data: product[0] });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data produk." });
  }
};

// ==========================================
// 3. UPDATE: Edit Produk (Admin)
// ==========================================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Tangkap data category
    const { name, description, price, status, category } = req.body;

    const [existing] = await db
      .promise()
      .query("SELECT * FROM products WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan!" });
    }

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : existing[0].image_url;
    // Kalau category nggak diedit, pakai category yang lama
    const productCategory = category || existing[0].category;

    // Suntik category ke query UPDATE
    await db
      .promise()
      .query(
        "UPDATE products SET name = ?, description = ?, price = ?, category = ?, image_url = ?, status = ? WHERE id = ?",
        [
          name || existing[0].name,
          description || existing[0].description,
          price || existing[0].price,
          productCategory,
          imageUrl,
          status || existing[0].status,
          id,
        ],
      );

    res
      .status(200)
      .json({ success: true, message: "Menu Kopi berhasil di-update!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal meng-update produk." });
  }
};

// ==========================================
// 4. DELETE: Soft Delete Produk (Admin)
// ==========================================
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db
      .promise()
      .query("SELECT * FROM products WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan!" });
    }

    await db
      .promise()
      .query("UPDATE products SET status = 'hidden' WHERE id = ?", [id]);
    res
      .status(200)
      .json({
        success: true,
        message: "Menu berhasil disembunyikan (Soft Delete)!",
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal menghapus produk." });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
