"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationDropdown from "@/components/NotificationDropdown";
import { API_BASE_URL } from "@/lib/api";
import {
  LayoutDashboard,
  Coffee,
  ShoppingBag,
  Users,
  LogOut,
  Search,
  Menu,
  X,
  Loader2,
  RefreshCw,
  Phone,
  Package,
  Wallet,
  ChevronRight,
} from "lucide-react";

export default function AdminCustomers() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/orders/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengambil data pelanggan");
      const json = await res.json();
      setCustomers(json.data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      alert("Gagal memuat data pelanggan dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/admin/login");
  };

  const getAdminName = () => {
    if (!adminEmail || adminEmail === "Admin") return "Admin";
    return adminEmail.split("@")[0];
  };

  const formatRupiah = (value) =>
    "Rp " + Number(value || 0).toLocaleString("id-ID");

  const formatWhatsAppLink = (wa) => {
    if (!wa) return "#";
    const digits = wa.replace(/\D/g, "");
    if (digits.startsWith("0")) return `https://wa.me/62${digits.slice(1)}`;
    return `https://wa.me/${digits}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/admin/login");
        return;
      }
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(jsonPayload);
        if (String(payload.role).toLowerCase() !== "admin") {
          router.push("/");
          return;
        }
        setAdminEmail(payload.email || "Admin");
        fetchCustomers();
      } catch (error) {
        localStorage.removeItem("token");
        router.push("/admin/login");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4A373]" size={40} />
      </div>
    );
  }

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (c.customer_name || "").toLowerCase().includes(term) ||
      (c.whatsapp || "").toLowerCase().includes(term)
    );
  });

  const totalRevenue = customers.reduce(
    (sum, c) => sum + Number(c.total_spent || 0),
    0
  );

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard", active: false },
    { name: "Manajemen Produk", icon: Coffee, path: "/admin/products", active: false },
    { name: "Pesanan", icon: ShoppingBag, path: "/admin/orders", active: false },
    { name: "Pelanggan", icon: Users, path: "/admin/customers", active: true },
  ];

  return (
    <div className="admin-theme app-surface min-h-screen font-inter text-[#1A1A1A] flex overflow-hidden">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#F9F9F9]/70 backdrop-blur-sm lg:hidden transition-opacity cursor-pointer"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#F9F9F9] shadow-[8px_0_24px_rgba(121,118,118,0.06)] px-6 py-8 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F9F9F9] shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] text-[#D4A373]">
              <Coffee size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-montserrat text-[15px] font-black tracking-widest text-[#1A1A1A]">
                ILANG ARAH
              </h1>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#797676]">
                Admin Panel
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl shadow-[4px_4px_8px_rgba(121,118,118,0.1),-4px_-4px_8px_rgba(255,255,255,1)] text-[#797676]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1">
          <p className="mb-5 ml-2 text-[10px] font-bold uppercase tracking-widest text-[#797676]/70">
            Menu Utama
          </p>
          <nav className="space-y-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  onClick={() => router.push(item.path)}
                  className={`cursor-pointer flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition-all duration-300 ${item.active ? "bg-[#F9F9F9] shadow-[inset_6px_6px_12px_rgba(121,118,118,0.12),inset_-6px_-6px_12px_rgba(255,255,255,1)] text-[#D4A373]" : "bg-[#F9F9F9] text-[#797676] hover:shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"}`}
                >
                  <div className="flex items-center gap-4">
                    <Icon size={20} strokeWidth={item.active ? 2.5 : 2} />
                    <span className={`text-sm ${item.active ? "font-bold" : "font-medium"}`}>
                      {item.name}
                    </span>
                  </div>
                  {item.badge && (
                    <span className="rounded-lg shadow-[inset_2px_2px_5px_rgba(121,118,118,0.1),inset_-2px_-2px_5px_rgba(255,255,255,1)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#797676]">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto">
          <div className="flex items-center gap-4 px-2 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F9F9F9] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.15),inset_-4px_-4px_8px_rgba(255,255,255,1)] font-montserrat text-lg font-bold text-[#D4A373]">
              {getAdminName().charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-[#1A1A1A]">{getAdminName()}</p>
              <p className="text-[11px] font-medium text-[#797676]">{adminEmail || "Admin"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#F9F9F9] py-4 text-xs font-bold text-[#797676] shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] transition-all active:shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"
          >
            <LogOut size={16} /> Keluar Akses
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="sticky top-0 flex h-[100px] shrink-0 items-center justify-between border-b border-white/60 bg-[#F9F9F9]/80 px-5 backdrop-blur-xl z-10 sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex h-12 w-12 items-center justify-center rounded-2xl shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] text-[#1A1A1A]"
            >
              <Menu size={20} />
            </button>
            <h2 className="hidden sm:block font-montserrat text-2xl font-bold text-[#1A1A1A]">
              Manajemen Pelanggan
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex h-12 w-72 items-center gap-3 rounded-2xl bg-[#F9F9F9] shadow-[inset_6px_6px_12px_rgba(121,118,118,0.1),inset_-6px_-6px_12px_rgba(255,255,255,1)] px-5">
              <Search size={18} className="text-[#797676]" />
              <input
                type="text"
                placeholder="Cari nama atau WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-[#1A1A1A] outline-none placeholder:text-[#797676]/60"
              />
            </div>
            <NotificationDropdown />
          </div>
        </header>

        <div className="flex-1 overflow-auto px-8 pb-12 lg:px-12 pt-2">
          <div className="mx-auto max-w-[1400px]">
            <section className="mb-10 flex flex-col md:flex-row justify-between gap-6 md:items-end">
              <div>
                <h1 className="font-montserrat text-3xl font-black text-[#1A1A1A] sm:text-4xl">
                  Data <span className="text-[#D4A373]">Pelanggan</span>
                </h1>
                <p className="mt-3 text-sm font-medium text-[#797676] max-w-xl leading-relaxed">
                  Pantau basis pelanggan setia, total transaksi, dan pendapatan yang dihasilkan setiap pelanggan.
                </p>
              </div>
              <button
                onClick={fetchCustomers}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#F9F9F9] px-6 py-4 text-sm font-bold text-[#D4A373] shadow-[8px_8px_16px_rgba(121,118,118,0.1),-8px_-8px_16px_rgba(255,255,255,1)] transition-all active:shadow-[inset_6px_6px_12px_rgba(121,118,118,0.1),inset_-6px_-6px_12px_rgba(255,255,255,1)] disabled:opacity-50"
              >
                <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                Muat Ulang
              </button>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              {[
                { title: "Total Pelanggan", value: customers.length.toString(), icon: Users, desc: "Kontak unik tercatat" },
                { title: "Total Transaksi", value: customers.reduce((s, c) => s + Number(c.total_orders || 0), 0).toString(), icon: Package, desc: "Semua pesanan terverifikasi" },
                { title: "Total Pendapatan", value: formatRupiah(totalRevenue), icon: Wallet, desc: "Status Selesai & Diproses" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.title} className="rounded-[28px] bg-[#F9F9F9] p-6 shadow-[10px_10px_20px_rgba(121,118,118,0.08),-10px_-10px_20px_rgba(255,255,255,1)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#797676]">{stat.title}</p>
                        <h3 className="mt-2 font-montserrat text-2xl font-black text-[#1A1A1A]">{stat.value}</h3>
                        <p className="mt-1 text-[11px] font-medium text-[#797676]/70">{stat.desc}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-[inset_3px_3px_6px_rgba(121,118,118,0.12),inset_-3px_-3px_6px_rgba(255,255,255,1)] bg-[#F9F9F9] text-[#D4A373]">
                        <Icon size={22} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] rounded-[32px] shadow-[inset_10px_10px_20px_rgba(121,118,118,0.08),inset_-10px_-10px_20px_rgba(255,255,255,1)] bg-[#F9F9F9]">
                <Loader2 size={40} className="text-[#D4A373] animate-spin mb-4" />
                <p className="text-sm font-bold text-[#797676]">Memuat data pelanggan...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] rounded-[32px] shadow-[inset_10px_10px_20px_rgba(121,118,118,0.08),inset_-10px_-10px_20px_rgba(255,255,255,1)] bg-[#F9F9F9] text-center p-10">
                <div className="flex h-20 w-20 items-center justify-center rounded-full shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] mb-6 bg-[#F9F9F9]">
                  <Users size={32} className="text-[#D4A373]" />
                </div>
                <h4 className="font-montserrat text-base font-bold text-[#1A1A1A]">Belum Ada Pelanggan</h4>
                <p className="mt-3 text-xs font-medium text-[#797676] max-w-sm leading-relaxed">
                  Data pelanggan akan muncul setelah ada pesanan masuk dari website customer.
                </p>
              </div>
            ) : (
              <div className="rounded-[32px] bg-[#F9F9F9] shadow-[10px_10px_20px_rgba(121,118,118,0.08),-10px_-10px_20px_rgba(255,255,255,1)] overflow-hidden">
                <div className="hidden lg:grid grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 px-8 py-6 border-b border-[#797676]/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#797676]">Nama Pelanggan</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#797676]">No. WhatsApp</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#797676] text-center">Total Pesanan</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#797676] text-right">Total Belanja</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#797676]"></p>
                </div>
                <div className="divide-y divide-[#797676]/10">
                  {filteredCustomers.map((customer, idx) => (
                    <div key={idx} className="px-8 py-6 grid grid-cols-1 lg:grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 items-center transition-all hover:bg-[#1A1A1A]/5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_3px_3px_6px_rgba(121,118,118,0.12),inset_-3px_-3px_6px_rgba(255,255,255,1)] bg-[#F9F9F9] font-montserrat text-sm font-bold text-[#D4A373]">
                          {(customer.customer_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1A1A1A]">{customer.customer_name || "-"}</p>
                          <p className="text-[11px] font-medium text-[#797676] mt-0.5">
                            Terakhir pesan: {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                          </p>
                        </div>
                      </div>
                      <a
                        href={formatWhatsAppLink(customer.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-[#797676] hover:text-[#D4A373] transition-all group lg:w-fit"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)] bg-[#F9F9F9]">
                          <Phone size={14} className="group-hover:text-[#D4A373]" />
                        </span>
                        <span className="text-sm font-medium">{customer.whatsapp || "-"}</span>
                      </a>
                      <div className="lg:text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-[#1A1A1A] shadow-[inset_2px_2px_4px_rgba(121,118,118,0.08),inset_-2px_-2px_4px_rgba(255,255,255,1)]">
                          <Package size={12} className="text-[#D4A373]" />
                          {customer.total_orders || 0}×
                        </span>
                      </div>
                      <p className="lg:text-right font-montserrat text-base font-black text-[#D4A373]">
                        {formatRupiah(customer.total_spent)}
                      </p>
                      <div className="hidden lg:flex justify-end">
                        <ChevronRight size={18} className="text-[#797676]/40" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}