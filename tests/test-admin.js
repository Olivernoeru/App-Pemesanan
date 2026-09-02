require('dotenv').config({ path: '../.env' });
const http = require('http');

function req(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({
      host: 'localhost', port: 5000, path, method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Type': 'application/json' } : {})
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch (e) { resolve({ status: res.statusCode, body: d }); } });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const login = await req('POST', '/api/auth/login', null, { email: 'admin@ilangarah.test', password: 'process.env.TEST_PASSWORD' });
  if (!login.body.success) { console.log('LOGIN FAIL', login.body); return; }
  const token = login.body.token;
  console.log('LOGIN OK, token length:', token.length);

  const endpoints = ['/api/notifications', '/api/orders', '/api/orders/customers', '/api/orders/stats', '/api/products', '/api/categories/with-count'];
  for (const ep of endpoints) {
    const r = await req('GET', ep, token);
    const preview = typeof r.body === 'object' ? JSON.stringify(r.body).slice(0, 250) : r.body.slice(0, 250);
    console.log(`\n[${ep}] -> ${r.status}`);
    console.log(preview);
  }

  const noToken = await req('GET', '/api/notifications', null);
  console.log(`\n[no-token /api/notifications] -> ${noToken.status} (expect 401)`);
})().catch(e => console.error(e));