const db = require("../config/db");
const fs = require("fs");
const path = require("path");

// ==========================================
// 1. CREATE: Tambah Produk Baru
// ==========================================
const createProduct = async (req, res) => {
  try {
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

    // 2. Paksa tipe data angka biar nggak jadi bug siluman
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) {
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({ success: false, message: "Harga harus berupa angka!" });
    }

    const productCategory = category || "Coffee";
    const imageUrl = `/uploads/${req.file.filename}`;

    // 3. Eksekusi Database (Suntik is_active = 1 dan availability_status = 'available')
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO products (name, description, price, category, image_url, availability_status, is_active) VALUES (?, ?, ?, ?, ?, 'available', 1)",
        [name, description, numericPrice, productCategory, imageUrl],
      );

    res.status(201).json({
      success: true,
      message: "Menu Kopi berhasil ditambahkan!",
      data: {
        id: result.insertId,
        name,
        description,
        price: numericPrice,
        category: productCategory,
        image_url: imageUrl,
        availability_status: "available",
        is_active: 1,
      },
    });
  } catch (error) {
    console.error("Error di createProduct:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: "Gagal menambah produk." });
  }
};

// ==========================================
// 2. READ: Super API (Search, Filter, Sort, Pagination)
// ==========================================
const getAllProducts = async (req, res) => {
  try {
    // Tangkap parameter dari Frontend (dengan nilai default agar Dashboard lama tetap aman)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Limit besar untuk dashboard ringkasan
    const search = req.query.search || "";
    const category = req.query.category || "";
    const statusFilter = req.query.status || "";
    const sort = req.query.sort || "newest";

    let whereClauses = [];
    let params = [];

    // Filter Nama (Smart Search)
    if (search) {
      whereClauses.push("name LIKE ?");
      params.push(`%${search}%`);
    }

    // Filter Kategori
    if (category && category !== "Semua Kategori") {
      whereClauses.push("category = ?");
      params.push(category);
    }

    // Filter Status Ketersediaan & Visibilitas
    if (statusFilter === "Tersedia") {
      whereClauses.push("availability_status = 'available' AND is_active = 1");
    } else if (statusFilter === "Habis") {
      whereClauses.push("availability_status = 'sold_out' AND is_active = 1");
    } else if (statusFilter === "Disembunyikan") {
      whereClauses.push("is_active = 0");
    } else if (statusFilter === "Semua Status") {
      // Bebas hambatan, tampilkan semua
    } else {
      // Default Behavior (Untuk Dashboard Publik & Ringkasan Admin): Hanya tampilkan yang aktif
      whereClauses.push("is_active = 1");
    }

    // Rakit Kondisi WHERE
    const whereQuery =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Rakit Kondisi ORDER BY (Sorting)
    let orderQuery = "ORDER BY id DESC"; // Default: Terbaru
    if (sort === "name_asc") orderQuery = "ORDER BY name ASC";
    if (sort === "name_desc") orderQuery = "ORDER BY name DESC";
    if (sort === "price_asc") orderQuery = "ORDER BY price ASC";
    if (sort === "price_desc") orderQuery = "ORDER BY price DESC";

    // Hitung Total Data (Wajib Untuk Pagination)
    const [countResult] = await db
      .promise()
      .query(`SELECT COUNT(*) as total FROM products ${whereQuery}`, params);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Ambil Data Sesuai Halaman (OFFSET & LIMIT)
    const offset = (page - 1) * limit;
    const [products] = await db
      .promise()
      .query(
        `SELECT * FROM products ${whereQuery} ${orderQuery} LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );

    // Return Data + Info Pagination
    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalItems,
        limit: limit,
      },
    });
  } catch (error) {
    console.error("Error di getAllProducts:", error);
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
      .query("SELECT * FROM products WHERE id = ?", [id]);

    if (product.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Menu tidak ditemukan." });
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
// 3. UPDATE: Edit Produk (Info Dasar)
// ==========================================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category } = req.body;

    const [existing] = await db
      .promise()
      .query("SELECT * FROM products WHERE id = ?", [id]);
    if (existing.length === 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan!" });
    }

    // Validasi harga kalau diubah
    let numericPrice = existing[0].price;
    if (price) {
      numericPrice = Number(price);
      if (isNaN(numericPrice)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res
          .status(400)
          .json({ success: false, message: "Harga harus berupa angka!" });
      }
    }

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : existing[0].image_url;
    const productCategory = category || existing[0].category;

    // Kolom `status` lama dihapus, jadi cuma update info dasar
    await db
      .promise()
      .query(
        "UPDATE products SET name = ?, description = ?, price = ?, category = ?, image_url = ? WHERE id = ?",
        [
          name || existing[0].name,
          description || existing[0].description,
          numericPrice,
          productCategory,
          imageUrl,
          id,
        ],
      );

    res
      .status(200)
      .json({ success: true, message: "Menu Kopi berhasil di-update!" });
  } catch (error) {
    console.error("Error di updateProduct:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res
      .status(500)
      .json({ success: false, message: "Gagal meng-update produk." });
  }
};

// ==========================================
// 4. DELETE: Soft Delete (Sembunyikan)
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

    // Ubah is_active = 0 (bukan menghapus row)
    await db
      .promise()
      .query("UPDATE products SET is_active = 0 WHERE id = ?", [id]);
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

// ==========================================
// 5. PATCH: Toggle Ketersediaan & Restore
// ==========================================
const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { availability_status } = req.body; // 'available' atau 'sold_out'

    await db
      .promise()
      .query("UPDATE products SET availability_status = ? WHERE id = ?", [
        availability_status,
        id,
      ]);
    res
      .status(200)
      .json({ success: true, message: `Status menu berhasil diubah!` });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengubah status ketersediaan." });
  }
};

const toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body; // 1 (tampil) atau 0 (sembunyi)

    await db
      .promise()
      .query("UPDATE products SET is_active = ? WHERE id = ?", [is_active, id]);
    res
      .status(200)
      .json({
        success: true,
        message: is_active === 1 ? "Menu dipulihkan!" : "Menu disembunyikan!",
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengubah visibilitas." });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleAvailability,
  toggleVisibility,
};
