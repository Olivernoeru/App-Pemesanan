const API = 'http://localhost:5000/api';

async function test() {
  console.log('=== PENGUJIAN END-TO-END SISTEM PEMESANAN ===\n');

  // 1. Buat pesanan baru (tanpa auth) - seperti dari customer
  console.log('[1] Membuat pesanan baru (POST /api/orders)...');
  const createRes = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Budi Santoso',
      table_number: 'T3',
      whatsapp: '081298765432',
      notes: 'Es kopi tanpa gula',
      items: [
        { product_id: 1, product_name: 'Es Kopi Susu', price: 18000, quantity: 2 },
        { product_name: 'Roti Bakar Coklat', price: 15000, quantity: 1 }
      ],
      total_price: 51000
    })
  });
  const createData = await createRes.json();
  console.log(`   Status: ${createRes.status} | ${JSON.stringify(createData)}`);
  if (!createRes.ok) throw new Error('Gagal membuat pesanan');
  const orderId = createData.order_id;
  console.log(`   ✅ Pesanan #${orderId} berhasil dibuat.\n`);

  // 2. Akses GET /api/orders TANPA token -> harus 401
  console.log('[2] Cek proteksi: GET /api/orders tanpa token...');
  const noAuthRes = await fetch(`${API}/orders`);
  console.log(`   Status: ${noAuthRes.status} (diharapkan 401)`);
  if (noAuthRes.status !== 401) throw new Error('Proteksi route GAGAL');
  console.log('   ✅ Route terlindungi.\n');

  // 3. Login admin untuk dapat token
  console.log('[3] Login admin (POST /api/auth/login)...');
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@ilangarah.test',
      password: 'ilangarah123'
    })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error('Login admin gagal: ' + loginData.message);
  const token = loginData.token;
  console.log(`   ✅ Login berhasil (role: ${loginData.user?.role || 'admin'}).\n`);

  // 4. Ambil semua pesanan dengan token admin
  console.log('[4] Ambil daftar pesanan (GET /api/orders dengan token)...');
  const listRes = await fetch(`${API}/orders`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listData = await listRes.json();
  console.log(`   Status: ${listRes.status}`);
  if (!listRes.ok) throw new Error('Gagal mengambil pesanan');
  const orders = listData.data || [];
  console.log(`   ✅ Berhasil. Total pesanan di database: ${orders.length}`);
  const newOrder = orders.find(o => o.id === orderId);
  if (!newOrder) throw new Error(`Pesanan #${orderId} tidak ditemukan di daftar`);
  console.log(`   ✅ Pesanan #${orderId} muncul: ${newOrder.customer_name} - ${newOrder.status}`);
  console.log(`      Items: ${JSON.stringify(newOrder.items)}`);
  console.log(`      Total: Rp ${Number(newOrder.total_price).toLocaleString('id-ID')}\n`);

  // 5. Update status pesanan
  console.log('[5] Update status → Diproses (PUT /api/orders/:id/status)...');
  const updateRes = await fetch(`${API}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'Diproses' })
  });
  const updateData = await updateRes.json();
  console.log(`   Status: ${updateRes.status} | ${JSON.stringify(updateData)}`);
  if (!updateRes.ok) throw new Error('Gagal update status');
  console.log('   ✅ Status berhasil diubah.\n');

  // 6. Update status ke Selesai
  console.log('[6] Update status → Selesai...');
  const doneRes = await fetch(`${API}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'Selesai' })
  });
  const doneData = await doneRes.json();
  console.log(`   Status: ${doneRes.status} | ${JSON.stringify(doneData)}`);
  if (!doneRes.ok) throw new Error('Gagal update status ke Selesai');
  console.log('   ✅ Pesanan selesai.\n');

  console.log('=== SEMUA PENGUJIAN BERHASIL ✅ ===');
}

test().catch(err => {
  console.error('❌ TEST GAGAL:', err.message);
  process.exit(1);
});
