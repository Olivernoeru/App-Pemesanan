const express = require("express");
const router = express.Router();

// Import semua fungsi dari controller (termasuk 2 fungsi Toggle baru)
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleAvailability,
  toggleVisibility,
} = require("../controllers/productController");

const { verifyToken, verifyAdmin, optionalToken } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// ----------------------------------------------------
// ROUTE PUBLIK (Bisa diakses User & Guest tanpa Token)
// optionalToken: jika admin kirim token maka isAdmin = true (bisa lihat semua produk)
// ----------------------------------------------------
router.get("/", optionalToken, getAllProducts);  // Semi-publik: admin bisa lihat produk nonaktif
router.get("/:id", getProductById); // Lihat detail satu menu

// ----------------------------------------------------
// ROUTE PRIVAT (Khusus Admin, Butuh Token JWT)
// ----------------------------------------------------
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  upload.validateImage,
  createProduct,
);
router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  upload.validateImage,
  updateProduct,
);
router.delete("/:id", verifyToken, verifyAdmin, deleteProduct);

// ROUTE PATCH UNTUK TOGGLE STATUS & VISIBILITAS (Khusus Admin)
router.patch("/:id/availability", verifyToken, verifyAdmin, toggleAvailability);
router.patch("/:id/visibility", verifyToken, verifyAdmin, toggleVisibility);

module.exports = router;

