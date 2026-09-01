const db = require('../config/db');
const DRINK_CATEGORIES = new Set(['Coffee', 'Non Coffee', 'Arah Series']);
const bool = (value, fallback) => value === undefined ? fallback : Number(value) === 1 || value === true;
const validPrice = (value) => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100000000;

exports.getProductCustomization = async (req, res, next) => {
  try {
    const [[product]] = await db.promise().query('SELECT id, category, customization_enabled, mood_enabled, hot_available, cold_available, size_enabled, medium_price, large_price, jumbo_price, sugar_enabled, addons_enabled FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    if (!DRINK_CATEGORIES.has(product.category) || !product.customization_enabled) return res.json({ data: { enabled: false, addons: [] } });
    const [addons] = product.addons_enabled ? await db.promise().query(`SELECT a.id, a.name, a.price, c.id category_id, c.name category_name FROM product_addons pa JOIN addons a ON a.id = pa.addon_id JOIN addon_categories c ON c.id = a.category_id WHERE pa.product_id = ? AND a.is_active = 1 AND c.is_active = 1 ORDER BY c.name, a.name`, [product.id]) : [[]];
    res.json({ data: { enabled: true, mood_enabled: !!product.mood_enabled, moods: { hot: !!product.hot_available, cold: !!product.cold_available }, size_enabled: !!product.size_enabled, sizes: { Medium: product.medium_price, Large: product.large_price, Jumbo: product.jumbo_price }, sugar_enabled: !!product.sugar_enabled, addons_enabled: !!product.addons_enabled, addons } });
  } catch (err) { next(err); }
};

exports.saveProductCustomization = async (req, res, next) => {
 try {
  const [[product]] = await db.promise().query('SELECT id, category, price FROM products WHERE id = ?', [req.params.id]);
  if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan.' });
  if (!DRINK_CATEGORIES.has(product.category)) return res.status(400).json({ message: 'Kustomisasi hanya untuk Coffee, Non Coffee, dan Arah Series.' });
  const b = req.body || {}; const sizes = b.sizes || {};
  if (bool(b.size_enabled, true) && !['Medium','Large','Jumbo'].every(k => validPrice(sizes[k]))) return res.status(400).json({ message: 'Harga Medium, Large, dan Jumbo wajib valid.' });
  if (bool(b.mood_enabled, true) && !bool(b.hot_available, true) && !bool(b.cold_available, true)) return res.status(400).json({ message: 'Aktifkan minimal Hot atau Cold.' });
  const addonIds = Array.isArray(b.addon_ids) ? [...new Set(b.addon_ids.map(Number).filter(Number.isSafeInteger))] : [];
  const conn = await db.promise().getConnection();
  try { await conn.beginTransaction();
   await conn.query(`UPDATE products SET customization_enabled=?, mood_enabled=?, hot_available=?, cold_available=?, size_enabled=?, medium_price=?, large_price=?, jumbo_price=?, sugar_enabled=?, addons_enabled=? WHERE id=?`, [1, bool(b.mood_enabled,true), bool(b.hot_available,true), bool(b.cold_available,true), bool(b.size_enabled,true), validPrice(sizes.Medium) ? Number(sizes.Medium) : product.price, validPrice(sizes.Large) ? Number(sizes.Large) : product.price, validPrice(sizes.Jumbo) ? Number(sizes.Jumbo) : product.price, bool(b.sugar_enabled,true), bool(b.addons_enabled,true), product.id]);
   await conn.query('DELETE FROM product_addons WHERE product_id=?', [product.id]);
   if (addonIds.length) { const [valid] = await conn.query('SELECT id FROM addons WHERE id IN (?)', [addonIds]); await conn.query('INSERT INTO product_addons (product_id, addon_id) VALUES ?', [valid.map(a => [product.id, a.id])]); }
   await conn.commit(); res.json({ success:true, message:'Konfigurasi minuman disimpan.' });
  } catch(e) { await conn.rollback(); throw e; } finally { conn.release(); }
 } catch (err) { next(err); }
};

exports.getAddons = async (req,res,next) => { try { const [rows] = await db.promise().query('SELECT a.*, c.name AS category_name FROM addons a JOIN addon_categories c ON c.id=a.category_id ORDER BY c.name,a.name'); res.json({data:rows}); } catch(e){next(e);} };
exports.getAddonCategories = async (req,res,next) => { try { const [rows] = await db.promise().query('SELECT * FROM addon_categories ORDER BY name'); res.json({data:rows}); } catch(e){next(e);} };
exports.createAddonCategory = async (req,res,next) => { try { const name=String(req.body.name||'').trim(); if(name.length<2||name.length>100)return res.status(400).json({message:'Nama kategori harus 2-100 karakter.'}); const [r]=await db.promise().query('INSERT INTO addon_categories (name) VALUES (?)',[name]);res.status(201).json({success:true,id:r.insertId}); }catch(e){next(e);} };
exports.createAddon = async (req,res,next) => { try { const {category_id,name,price}=req.body; if(!Number.isSafeInteger(Number(category_id))||String(name||'').trim().length<2||!validPrice(price))return res.status(400).json({message:'Data add-on tidak valid.'}); const [r]=await db.promise().query('INSERT INTO addons (category_id,name,price) VALUES (?,?,?)',[Number(category_id),String(name).trim(),Number(price)]);res.status(201).json({success:true,id:r.insertId}); }catch(e){next(e);} };
exports.toggleAddon = async (req,res,next) => { try { const active=bool(req.body.is_active,false)?1:0; const [r]=await db.promise().query('UPDATE addons SET is_active=? WHERE id=?',[active,req.params.id]);if(!r.affectedRows)return res.status(404).json({message:'Add-on tidak ditemukan.'});res.json({success:true}); }catch(e){next(e);} };
