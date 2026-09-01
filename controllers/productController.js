const db = require("../config/db");
const fs = require("fs");
const path = require("path");

// ==========================================
// 1. CREATE: Tambah Produk Baru
// ==========================================
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Gambar produk wajib di-upload!" });
    }
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "Nama produk tidak valid (2-100 karakter)." });
    }
    if (!description || typeof description !== 'string' || description.trim().length > 1000) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "Deskripsi tidak valid." });
    }
    if (!price) {
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({
          success: false,
          message: "Semua field (Nama, Deskripsi, Harga) wajib diisi!",
        });
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0 || numericPrice > 100000000) {
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({ success: false, message: "Harga harus berupa angka!" });
    }

    const allowedCategories = ['Coffee', 'Non Coffee', 'Arah Series', 'Arah Toast', 'Food'];
    const productCategory = allowedCategories.includes(category) ? category : "Coffee";
    const imageUrl = `/uploads/${req.file.filename}`;

    const [result] = await db
      .promise()
      .query(
        "INSERT INTO products (name, description, price, category, image_url, availability_status, is_active) VALUES (?, ?, ?, ?, ?, 'available', 1)",
        [name.trim(), description.trim(), numericPrice, productCategory, imageUrl],
      );

    res.status(201).json({
      success: true,
      message: "Menu Kopi berhasil ditambahkan!",
      data: {
        id: result.insertId,
        name: name.trim(),
        description: description.trim(),
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
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const category = req.query.category || "";
    const statusFilter = req.query.status || "";
    const sort = req.query.sort || "newest";
    const isAdmin = req.user && req.user.role === 'admin';

    let whereClauses = [];
    let params = [];

    if (search) {
      whereClauses.push("name LIKE ?");
      params.push(`%${search}%`);
    }

    if (category && category !== "Semua Kategori") {
      whereClauses.push("category = ?");
      params.push(category);
    }

    if (statusFilter === "Tersedia") {
      whereClauses.push("availability_status = 'available' AND is_active = 1");
    } else if (statusFilter === "Habis") {
      whereClauses.push("availability_status = 'sold_out' AND is_active = 1");
    } else if (statusFilter === "Disembunyikan") {
      // Hanya admin yang boleh melihat produk yang disembunyikan
      if (!isAdmin) {
        return res.status(200).json({ success: true, data: [], pagination: { current_page: 1, total_pages: 0, total_items: 0, limit } });
      }
      whereClauses.push("is_active = 0");
    } else if (statusFilter === "Semua Status") {
      // Admin: lihat semua (aktif & nonaktif). Guest/User: hanya aktif
      if (!isAdmin) whereClauses.push("is_active = 1");
    } else {
      // Tidak ada filter status atau tidak dikenal → admin lihat semua, guest hanya aktif
      if (!isAdmin) whereClauses.push("is_active = 1");
    }

    const whereQuery = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    let orderQuery = "ORDER BY id DESC";
    if (sort === "name_asc") orderQuery = "ORDER BY name ASC";
    if (sort === "name_desc") orderQuery = "ORDER BY name DESC";
    if (sort === "price_asc") orderQuery = "ORDER BY price ASC";
    if (sort === "price_desc") orderQuery = "ORDER BY price DESC";

    const [countResult] = await db.promise().query(`SELECT COUNT(*) as total FROM products ${whereQuery}`, params);
    const totalItems = countResult[0].total;
    const [products] = await db.promise().query(`SELECT * FROM products ${whereQuery} ${orderQuery} LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return res.status(200).json({ success: true, data: products, pagination: { current_page: page, total_pages: Math.ceil(totalItems / limit), total_items: totalItems, limit } });
  } catch (error) {
    console.error("Error di getAllProducts:", error);
    return res.status(500).json({ success: false, message: "Gagal mengambil data produk." });
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
    console.error("Error di getProductById:", error);
    console.error("ERROR DETAIL:", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data produk.", error: error.message });
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
    console.error("ERROR DETAIL:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res
      .status(500)
      .json({ success: false, message: "Gagal meng-update produk.", error: error.message });
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
    console.error("Error di deleteProduct:", error);
    res.status(500).json({ success: false, message: "Gagal menghapus produk." });
  }
};


// ==========================================
// 5. PATCH: Toggle Ketersediaan & Restore
// ==========================================
const toggleAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { availability_status } = req.body;
    if (!['available', 'sold_out'].includes(availability_status)) {
      return res.status(400).json({ success: false, message: "availability_status harus 'available' atau 'sold_out'." });
    }
    const [check] = await db.promise().query("SELECT id FROM products WHERE id = ?", [id]);
    if (!check.length) return res.status(404).json({ success: false, message: "Produk tidak ditemukan." });

    await db.promise().query("UPDATE products SET availability_status = ? WHERE id = ?", [availability_status, id]);
    return res.status(200).json({ success: true, message: "Status ketersediaan berhasil diubah." });
  } catch (error) {
    console.error("Error di toggleAvailability:", error);
    return res.status(500).json({ success: false, message: "Gagal mengubah status ketersediaan." });
  }
};


const toggleVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rawActive = req.body.is_active;
    const is_active = Number(rawActive);
    if (is_active !== 0 && is_active !== 1) {
      return res.status(400).json({ success: false, message: "is_active harus 0 atau 1." });
    }
    const [check] = await db.promise().query("SELECT id FROM products WHERE id = ?", [id]);
    if (!check.length) return res.status(404).json({ success: false, message: "Produk tidak ditemukan." });

    await db.promise().query("UPDATE products SET is_active = ? WHERE id = ?", [is_active, id]);
    return res.status(200).json({ success: true, message: is_active === 1 ? "Menu dipulihkan." : "Menu disembunyikan." });
  } catch (error) {
    console.error("Error di toggleVisibility:", error);
    return res.status(500).json({ success: false, message: "Gagal mengubah visibilitas." });
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
