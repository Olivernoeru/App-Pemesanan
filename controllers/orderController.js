const crypto = require('crypto');
const db = require('../config/db');

const PAYMENT_METHODS = new Set(['cash', 'qris']);
const STATUS_TRANSITIONS = { Menunggu: ['Diproses', 'Dibatalkan'], Diproses: ['Selesai', 'Dibatalkan'], Selesai: [], Dibatalkan: [] };
const PAYMENT_TRANSITIONS = { Pending: ['Paid', 'Failed'], Paid: [], Failed: ['Paid'] };
const positiveInt = (v) => Number.isSafeInteger(Number(v)) && Number(v) > 0;
const pageParams = (q) => ({ page: Math.max(1, parseInt(q.page, 10) || 1), limit: Math.min(100, Math.max(1, parseInt(q.limit, 10) || 20)) });

function validateOrderBody(body) {
  const { customer_name, table_number = '', whatsapp = '', notes = '', items, payment_method = 'cash' } = body;
  if (typeof customer_name !== 'string' || customer_name.trim().length < 2 || customer_name.trim().length > 100) return 'Nama pelanggan tidak valid (2-100 karakter).';
  if (typeof table_number !== 'string' || table_number.length > 20) return 'Nomor meja terlalu panjang.';
  if (typeof whatsapp !== 'string' || whatsapp.length > 20) return 'Nomor WhatsApp tidak valid.';
  if (typeof notes !== 'string' || notes.length > 1000) return 'Catatan terlalu panjang.';
  if (!PAYMENT_METHODS.has(payment_method)) return 'Metode pembayaran tidak didukung.';
  if (!Array.isArray(items) || items.length === 0 || items.length > 30) return 'Item pesanan harus antara 1-30 produk.';
  for (const item of items) {
    if (!item || !positiveInt(item.product_id)) return 'product_id tidak valid.';
    const qty = Number(item.quantity);
    if (!Number.isSafeInteger(qty) || qty < 1 || qty > 100) return 'Jumlah item tidak valid (1-100).';
  }
  return null;
}

// 1. Buat Pesanan Baru (POST /api/orders)
exports.createOrder = async (req, res, next) => {
  const idempotencyKey = req.get('Idempotency-Key');
  if (typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
    return res.status(400).json({ message: 'Header Idempotency-Key wajib dan harus valid (16-128 karakter).' });
  }
  const validErr = validateOrderBody(req.body);
  if (validErr) return res.status(400).json({ message: validErr });

  const { customer_name, table_number = '', whatsapp = '', notes = '', items, payment_method = 'cash' } = req.body;
  const isAdmin = req.user && req.user.role === 'admin';
  const paymentStatus = (isAdmin && payment_method === 'cash') ? 'Paid' : 'Pending';

  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query('SELECT id, tracking_token, payment_method, payment_status FROM orders WHERE idempotency_key = ? FOR UPDATE', [idempotencyKey]);
    if (existing.length) {
      await conn.commit();
      const o = existing[0];
      return res.status(200).json({ message: 'Pesanan sebelumnya ditemukan.', order_id: o.id, tracking_token: o.tracking_token, payment_method: o.payment_method, payment_status: o.payment_status, idempotent_replay: true });
    }
    const productIds = [...new Set(items.map((item) => Number(item.product_id)))];
    const [products] = await conn.query(`SELECT id, name, price, category, customization_enabled, mood_enabled, hot_available, cold_available, size_enabled, medium_price, large_price, jumbo_price, sugar_enabled, addons_enabled FROM products WHERE id IN (?) AND is_active = 1 AND availability_status = 'available' FOR UPDATE`, [productIds]);
    if (products.length !== productIds.length) { await conn.rollback(); return res.status(400).json({ message: 'Satu atau lebih produk tidak tersedia.' }); }
    const productMap = new Map(products.map((p) => [p.id, p]));
    const requestedAddonIds = [...new Set(items.flatMap((item) => Array.isArray(item.customization?.addon_ids) ? item.customization.addon_ids.map(Number) : []).filter(Number.isSafeInteger))];
    const [addons] = requestedAddonIds.length ? await conn.query(`SELECT a.id, a.name, a.price, pa.product_id FROM addons a JOIN product_addons pa ON pa.addon_id=a.id JOIN addon_categories c ON c.id=a.category_id WHERE a.id IN (?) AND a.is_active=1 AND c.is_active=1`, [requestedAddonIds]) : [[]];
    const addonMap = new Map(addons.map((a) => [`${a.product_id}:${a.id}`, a]));
    const orderItemRows = [];
    for (const item of items) {
      const p = productMap.get(Number(item.product_id)); const qty = Number(item.quantity);
      let price = Number(p.price); let customization = null;
      if (p.customization_enabled) {
        const c = item.customization || {}; const mood = c.mood; const size = c.size; const sugar = c.sugar;
        if (p.mood_enabled && !((mood === 'Hot' && p.hot_available) || (mood === 'Cold' && p.cold_available))) return res.status(400).json({ message: `Pilihan mood tidak valid untuk ${p.name}.` });
        if (p.size_enabled && !['Medium', 'Large', 'Jumbo'].includes(size)) return res.status(400).json({ message: `Ukuran wajib dipilih untuk ${p.name}.` });
        if (p.sugar_enabled && !['Normal Sugar', 'Less Sugar', 'No Sugar'].includes(sugar)) return res.status(400).json({ message: `Pilihan gula wajib dipilih untuk ${p.name}.` });
        if (p.size_enabled) price = Number(({ Medium: p.medium_price, Large: p.large_price, Jumbo: p.jumbo_price })[size]);
        const addonIds = p.addons_enabled && Array.isArray(c.addon_ids) ? [...new Set(c.addon_ids.map(Number).filter(Number.isSafeInteger))] : [];
        const selectedAddons = addonIds.map((id) => addonMap.get(`${p.id}:${id}`));
        if (selectedAddons.length !== addonIds.length) return res.status(400).json({ message: `Add-on tidak valid untuk ${p.name}.` });
        price += selectedAddons.reduce((sum, addon) => sum + Number(addon.price), 0);
        customization = { mood: p.mood_enabled ? mood : null, size: p.size_enabled ? size : null, sugar: p.sugar_enabled ? sugar : null, addons: selectedAddons.map((a) => ({ id: a.id, name: a.name, price: Number(a.price) })) };
      }
      orderItemRows.push([p.id, p.name, price, qty, price * qty, customization ? JSON.stringify(customization) : null]);
    }
    const totalPrice = orderItemRows.reduce((s, r) => s + r[4], 0);
    const trackingToken = crypto.randomBytes(32).toString('base64url');
    const [orderResult] = await conn.query("INSERT INTO orders (customer_name, table_number, whatsapp, notes, total_price, payment_method, payment_status, status, tracking_token, idempotency_key, version) VALUES (?, ?, ?, ?, ?, ?, ?, 'Menunggu', ?, ?, 1)", [customer_name.trim(), table_number.trim(), whatsapp.trim(), notes.trim(), totalPrice, payment_method, paymentStatus, trackingToken, idempotencyKey]);
    const orderId = orderResult.insertId;
    await conn.query('INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal, customization) VALUES ?', [orderItemRows.map((r) => [orderId, ...r])]);
    await conn.query("INSERT INTO notifications (order_id, title, message, type, is_read) VALUES (?, 'Pesanan Baru Masuk', ?, 'new_order', 0)", [orderId, `Pesanan baru #${orderId} dari ${customer_name.trim()} (${orderItemRows.length} item).`]);
    await conn.commit();
    return res.status(201).json({ message: 'Pesanan berhasil dibuat.', order_id: orderId, tracking_token: trackingToken, payment_method, payment_status: paymentStatus });
  } catch (err) {
    await conn.rollback();
    return next(err);
  } finally {
    conn.release();
  }
};

// 2. Ambil Semua Pesanan (GET /api/orders) - dengan pagination
exports.getAllOrders = async (req, res, next) => {
  try {
    const { page, limit } = pageParams(req.query);
    const offset = (page - 1) * limit;
    const [[countRow], [orders]] = await Promise.all([
      db.promise().query('SELECT COUNT(*) AS total FROM orders'),
      db.promise().query('SELECT id, customer_name, table_number, whatsapp, notes, total_price, payment_method, payment_status, status, created_at, updated_at, version FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]),
    ]);
    const ids = orders.map((o) => o.id);
    const [items] = ids.length ? await db.promise().query('SELECT * FROM order_items WHERE order_id IN (?) ORDER BY id', [ids]) : [[]];
    const byOrder = new Map();
    for (const item of items) { const list = byOrder.get(item.order_id) || []; list.push(item); byOrder.set(item.order_id, list); }
    return res.json({ message: 'Berhasil mengambil daftar pesanan.', data: orders.map((o) => ({ ...o, items: byOrder.get(o.id) || [] })), pagination: { current_page: page, limit, total_items: countRow.total, total_pages: Math.ceil(countRow.total / limit) } });
  } catch (err) { return next(err); }
};

// 3. Lacak Pesanan Customer (GET /api/orders/track?token=...) - hanya via opaque token
exports.trackOrder = async (req, res, next) => {
  const token = req.query.token;
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{32,128}$/.test(token)) {
    return res.status(400).json({ message: 'Token pelacakan tidak valid.' });
  }
  try {
    const [orders] = await db.promise().query('SELECT id, status, payment_status, payment_method, total_price, created_at FROM orders WHERE tracking_token = ?', [token]);
    if (!orders.length) return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    const [items] = await db.promise().query('SELECT product_name, quantity, subtotal FROM order_items WHERE order_id = ? ORDER BY id', [orders[0].id]);
    return res.json({ message: 'Pesanan ditemukan.', data: { ...orders[0], items } });
  } catch (err) { return next(err); }
};

// 4. Ambil Daftar Pelanggan (GET /api/orders/customers) - dengan pagination
exports.getCustomers = async (req, res, next) => {
  try {
    const { page, limit } = pageParams(req.query);
    const offset = (page - 1) * limit;
    const [[countRow], [data]] = await Promise.all([
      db.promise().query("SELECT COUNT(DISTINCT whatsapp) AS total FROM orders WHERE whatsapp <> ''"),
      db.promise().query("SELECT whatsapp, MAX(customer_name) AS customer_name, COUNT(*) AS total_orders, SUM(CASE WHEN status <> 'Dibatalkan' THEN total_price ELSE 0 END) AS total_spent, MAX(created_at) AS last_order FROM orders WHERE whatsapp <> '' GROUP BY whatsapp ORDER BY last_order DESC LIMIT ? OFFSET ?", [limit, offset]),
    ]);
    return res.json({ data, pagination: { current_page: page, limit, total_items: countRow.total, total_pages: Math.ceil(countRow.total / limit) } });
  } catch (err) { return next(err); }
};

// 5. Statistik & Laporan (GET /api/orders/stats)
exports.getOrderStats = async (req, res, next) => {
  try {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(dayStart.getTime() - 6 * 86400000);
    const [todayRes, monthRes, topRes, statusRes, weekRes] = await Promise.all([
      db.promise().query("SELECT COUNT(*) AS orders, COALESCE(SUM(total_price),0) AS revenue FROM orders WHERE created_at >= ? AND created_at < ? AND status <> 'Dibatalkan'", [dayStart, dayEnd]),
      db.promise().query("SELECT COALESCE(SUM(total_price),0) AS revenue FROM orders WHERE created_at >= ? AND status <> 'Dibatalkan'", [monthStart]),
      db.promise().query("SELECT oi.product_name, SUM(oi.quantity) AS total_qty, SUM(oi.subtotal) AS total_sales FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status <> 'Dibatalkan' GROUP BY oi.product_name ORDER BY total_qty DESC LIMIT 5"),
      db.promise().query('SELECT status, COUNT(*) AS count FROM orders GROUP BY status'),
      db.promise().query("SELECT DATE(created_at) AS date, COALESCE(SUM(total_price),0) AS revenue, COUNT(*) AS orders FROM orders WHERE created_at >= ? AND status <> 'Dibatalkan' GROUP BY DATE(created_at) ORDER BY date ASC", [weekStart]),
    ]);
    return res.json({ message: 'Berhasil mengambil statistik.', data: { today: todayRes[0][0], month: monthRes[0][0], top_products: topRes[0], status_distribution: statusRes[0], seven_days: weekRes[0] } });
  } catch (err) { return next(err); }
};

// 6. Update Status Pesanan (PUT /api/orders/:id/status) - state machine + optimistic locking
exports.updateOrderStatus = async (req, res, next) => {
  const id = Number(req.params.id);
  const { status, payment_status, version } = req.body;
  if (!positiveInt(id)) return res.status(400).json({ message: 'ID pesanan tidak valid.' });
  if (version === undefined || !positiveInt(version)) return res.status(400).json({ message: 'Field version wajib disertakan.' });
  if (!status && !payment_status) return res.status(400).json({ message: 'Tidak ada data yang diperbarui.' });
  try {
    const [orders] = await db.promise().query('SELECT status, payment_status, version FROM orders WHERE id = ?', [id]);
    if (!orders.length) return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    const current = orders[0];
    if (status) {
      const allowed = STATUS_TRANSITIONS[current.status] || [];
      if (!allowed.includes(status)) return res.status(400).json({ message: `Transisi status ${current.status} -> ${status} tidak diizinkan.` });
      if (status === 'Selesai' && current.payment_status !== 'Paid') return res.status(400).json({ message: 'Pesanan tidak dapat diselesaikan sebelum pembayaran lunas.' });
    }
    if (payment_status) {
      const allowed = PAYMENT_TRANSITIONS[current.payment_status] || [];
      if (!allowed.includes(payment_status)) return res.status(400).json({ message: `Transisi pembayaran ${current.payment_status} -> ${payment_status} tidak diizinkan.` });
    }
    const newStatus = status || current.status;
    const newPayment = payment_status || current.payment_status;
    const [result] = await db.promise().query('UPDATE orders SET status = ?, payment_status = ?, version = version + 1 WHERE id = ? AND version = ?', [newStatus, newPayment, id, version]);
    if (!result.affectedRows) return res.status(409).json({ message: 'Pesanan telah diubah oleh admin lain. Muat ulang data terlebih dahulu.' });
    return res.json({ message: `Pesanan #${id} berhasil diperbarui.`, version: Number(version) + 1 });
  } catch (err) { return next(err); }
};