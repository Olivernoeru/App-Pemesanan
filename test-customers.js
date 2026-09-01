const API = 'http://localhost:5000/api';

async function test() {
  console.log('=== VERIFIKASI ENDPOINT CUSTOMERS ===\n');

  // Login admin
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@ilangarah.test',
      password: 'ilangarah123'
    })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error('Login gagal: ' + loginData.message);
  const token = loginData.token;
  console.log('[1] Login admin ✅\n');

  // GET /api/orders/customers
  const custRes = await fetch(`${API}/orders/customers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const custData = await custRes.json();
  console.log(`[2] GET /api/orders/customers -> Status ${custRes.status}`);
  if (!custRes.ok) throw new Error(`Gagal: ${custData.message || custRes.statusText}`);
  const customers = custData.data || [];
  console.log(`   Total pelanggan unik: ${customers.length}`);
  if (customers.length > 0) {
    console.log('   Contoh data pelanggan:');
    customers.slice(0, 3).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.customer_name} | WA: ${c.whatsapp} | Pesanan: ${c.total_orders} | Total: Rp ${Number(c.total_spent || 0).toLocaleString('id-ID')}`);
    });
  }
  console.log('   ✅ Endpoint customers berfungsi.\n');

  // Cek proteksi tanpa token
  const noAuthRes = await fetch(`${API}/orders/customers`);
  console.log(`[3] Tanpa token -> Status ${noAuthRes.status} (diharapkan 401)`);
  if (noAuthRes.status !== 401) throw new Error('Proteksi endpoint customers GAGAL');
  console.log('   ✅ Route terlindungi.\n');

  console.log('=== VERIFIKASI BERHASIL ✅ ===');
}

test().catch((err) => {
  console.error('❌ TEST GAGAL:', err.message);
  process.exit(1);
});