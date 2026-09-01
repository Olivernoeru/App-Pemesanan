const API_URL = 'http://localhost:5000/api/auth';

// Data palsu buat ngetes
const dummyUser = {
    name: "Admin Kopi Ilang Arah",
    email: "admin@ilangarah.test",
    password: "ilangarah123",
    role: "admin"
};

async function runTest() {
    console.log("=== MEMULAI TEST API BACKEND ===");

    try {
        // 1. Test Endpoint Register
        console.log("\n[1] Mengetes Fitur Register...");
        const resRegister = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dummyUser)
        });
        const dataRegister = await resRegister.json();
        
        if (dataRegister.success) {
            console.log("✅ Register Berhasil! Data user masuk ke database.");
        } else {
            // Kalau dijalankan 2x, pasti gagal karena email udah ada. Ini wajar.
            console.log("⚠️ Info Register:", dataRegister.message);
        }

        // 2. Test Endpoint Login
        console.log("\n[2] Mengetes Fitur Login...");
        const resLogin = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: dummyUser.email,
                password: dummyUser.password
            })
        });
        const dataLogin = await resLogin.json();

        if (dataLogin.success) {
            console.log("✅ Login Berhasil!");
            console.log("🔑 Ini bentuk JWT (JSON Web Token) lu yang berharga:");
            console.log("--------------------------------------------------");
            console.log(dataLogin.token);
            console.log("--------------------------------------------------");
        } else {
            console.log("❌ Login Gagal:", dataLogin.message);
        }

    } catch (error) {
        console.error("❌ Terjadi error saat ngetes:", error.message);
        console.log("Pastikan server.js lu udah jalan di terminal sebelahnya!");
    }
}

runTest();