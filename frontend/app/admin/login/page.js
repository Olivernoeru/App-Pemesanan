"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Coffee, LockKeyhole, Mail } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorMsg(data.message || "Email atau password salah.");
      } else if (data.user?.role !== "admin") {
        localStorage.removeItem("token");
        setErrorMsg("Akun ini tidak memiliki akses staff.");
      } else {
        localStorage.setItem("token", data.token);
        router.replace("/admin/dashboard");
      }
    } catch {
      setErrorMsg("Gagal terhubung ke server. Pastikan backend menyala.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-theme app-surface flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-[36px] border border-white/70 bg-[#F9F9F9] p-8 shadow-[18px_18px_40px_rgba(121,118,118,.14),-18px_-18px_40px_rgba(255,255,255,.95)] sm:p-10">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-[#797676] hover:text-[#D4A373]"><Coffee size={17} /> Kembali ke website customer</Link>
        <div className="mb-8"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A1A1A] text-[#D4A373]"><LockKeyhole size={22} /></div><h1 className="font-montserrat text-3xl font-black text-[#1A1A1A]">Login Staff</h1><p className="mt-2 text-sm text-[#797676]">Area khusus operasional Ilang Arah Coffee.</p></div>
        {errorMsg && <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">{errorMsg}</p>}
        <form onSubmit={handleLogin} className="space-y-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#797676]">Email<span className="relative mt-2 block"><Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4A373]" /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="staff@ilangarah.test" className="w-full rounded-2xl bg-[#F9F9F9] py-3.5 pl-11 pr-4 text-sm text-[#1A1A1A] shadow-[inset_4px_4px_9px_rgba(121,118,118,.11),inset_-4px_-4px_9px_white] outline-none focus:ring-2 focus:ring-[#D4A373]/40" /></span></label>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#797676]">Password<span className="relative mt-2 block"><LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4A373]" /><input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="w-full rounded-2xl bg-[#F9F9F9] py-3.5 pl-11 pr-4 text-sm text-[#1A1A1A] shadow-[inset_4px_4px_9px_rgba(121,118,118,.11),inset_-4px_-4px_9px_white] outline-none focus:ring-2 focus:ring-[#D4A373]/40" /></span></label>
          <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] py-4 text-sm font-bold text-white transition-colors hover:bg-[#D4A373] disabled:cursor-not-allowed disabled:opacity-70">{isLoading ? "Memproses..." : <>Masuk ke Dashboard <ArrowRight size={16} /></>}</button>
        </form>
      </section>
    </main>
  );
}