const fs = require('fs');

const API_AUTH = 'http://localhost:5000/api/auth';
const API_PRODUCT = 'http://localhost:5000/api/products';
const REQUEST_TIMEOUT_MS = 10000;

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

// Bikin file gambar bohongan sementara buat ngetes Multer
fs.writeFileSync('dummy.jpg', 'Ini cuma file bohongan buat ngetes upload gambar');

async function runProductTest() {
    console.log("=== MEMULAI TEST CRUD PRODUK ===");

    try {
        // 1. Login sebagai Admin buat ambil Token JWT
        console.log("\n[1] Login Admin untuk ambil Token...");
        const resLogin = await fetchWithTimeout(`${API_AUTH}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "admin@ilangarah.test", password: "process.env.TEST_PASSWORD" })
        });
        const dataLogin = await resLogin.json();
        if (!resLogin.ok) throw new Error(`Login HTTP ${resLogin.status}: ${dataLogin.message || 'gagal'}`);
        const token = dataLogin.token;

        if (!token) throw new Error("Gagal login! Token tidak didapatkan.");
        console.log("✅ Token berhasil didapatkan!");

        // 2. Test CREATE (Tambah Menu Kopi + Upload Gambar)
        console.log("\n[2] Mengetes Fitur Tambah Menu (Upload Gambar)...");
        
        // Setup FormData khusus Node.js untuk ngirim file
        const formData = new FormData();
        formData.append('name', 'Kopi Kenangan Mantan');
        formData.append('description', 'Kopi susu legit dengan gula aren asli.');
        formData.append('price', '25000');
        
        const fileBuffer = fs.readFileSync('dummy.jpg');
        const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });
        formData.append('image', fileBlob, 'dummy.jpg');

        const resCreate = await fetchWithTimeout(API_PRODUCT, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const dataCreate = await resCreate.json();
        if (!resCreate.ok || !dataCreate.success) {
            throw new Error(`Create HTTP ${resCreate.status}: ${dataCreate.message || 'gagal'}`);
        }
        console.log(dataCreate.success ? "✅ Create Berhasil:" : "❌ Create Gagal:", dataCreate.message);
        
        const productId = dataCreate.data?.id;

        // 3. Test READ (Lihat Menu)
        console.log("\n[3] Mengetes Fitur Lihat Menu...");
        const resRead = await fetchWithTimeout(API_PRODUCT);
        const dataRead = await resRead.json();
        if (!resRead.ok || !dataRead.success || !Array.isArray(dataRead.data)) {
            throw new Error(`Read HTTP ${resRead.status}: respons produk tidak valid`);
        }
        console.log(`✅ Read Berhasil! Ditemukan ${dataRead.data.length} menu aktif.`);

        // 4. Test DELETE (Soft Delete)
        if (productId) {
            console.log("\n[4] Mengetes Fitur Soft Delete...");
            const resDelete = await fetchWithTimeout(`${API_PRODUCT}/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataDelete = await resDelete.json();
            if (!resDelete.ok || !dataDelete.success) {
                throw new Error(`Delete HTTP ${resDelete.status}: ${dataDelete.message || 'gagal'}`);
            }
            console.log(dataDelete.success ? "✅ Delete Berhasil:" : "❌ Delete Gagal:", dataDelete.message);
        }

        console.log("\n=== TEST SELESAI ===");

    } catch (error) {
        console.error("❌ Terjadi Error:", error.message);
        process.exitCode = 1;
    } finally {
        // Selalu bersihkan fixture meskipun request gagal atau timeout.
        if (fs.existsSync('dummy.jpg')) fs.unlinkSync('dummy.jpg');
    }
}

runProductTest();