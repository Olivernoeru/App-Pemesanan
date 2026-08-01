const db = require("../config/db");
const fs = require("fs"); // Tambahin ini di paling atas! Buat hapus file
const path = require("path");

// ==========================================
// 1. CREATE: Tambah Produk Baru (Admin)
// ==========================================
const createProduct = async (req, res) => {
  try {
    const { name, description, price } = req.body;

    // 1. Validasi Super Ketat
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Gambar produk wajib di-upload!" });
    }
    if (!name || !description || !price) {
      // Hapus file yang terlanjur di-upload Multer karena data teksnya bolong
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({
          success: false,
          message: "Semua field (Nama, Deskripsi, Harga) wajib diisi!",
        });
    }

    // 2. Paksa tipe data angka biar nggak jadi bug siluman
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) {
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({ success: false, message: "Harga harus berupa angka!" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    // 3. Eksekusi Database
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO products (name, description, price, image_url, status) VALUES (?, ?, ?, ?, ?)",
        [name, description, numericPrice, imageUrl, "active"],
      );

    res.status(201).json({
      success: true,
      message: "Menu Kopi berhasil ditambahkan!",
      data: {
        id: result.insertId,
        name,
        description,
        price: numericPrice,
        image_url: imageUrl,
        status: "active",
      },
    });
  } catch (error) {
    console.error("Error di createProduct:", error);

    // 4. JURUS ANTI SAMPAH: Hapus foto kalau query database gagal!
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ success: false, message: "Gagal menambah produk." });
  }
};