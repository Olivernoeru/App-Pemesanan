const db = require('../config/db');

// 1. Ambil semua notifikasi terbaru (Maksimal 15)
const getNotifications = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 15"
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 2. Hitung jumlah yang belum dibaca (Buat Red Dot Badge)
const getUnreadCount = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT COUNT(*) as unreadCount FROM notifications WHERE is_read = 0"
    );
    res.status(200).json({ success: true, count: rows[0].unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 3. Tandai 1 notifikasi sudah dibaca
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await db.promise().query(
      "UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
    res.status(200).json({ success: true, message: "Notifikasi dibaca" });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 4. Tandai SEMUA notifikasi sudah dibaca
const markAllAsRead = async (req, res) => {
  try {
    await db.promise().query(
      "UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE is_read = 0"
    );
    res.status(200).json({ success: true, message: "Semua notifikasi dibaca" });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };