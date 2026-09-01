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
  Clock3,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Package,
  MessageCircle,
} from "lucide-react";

const STATUS_STYLES = {
  Menunggu: { label: "Menunggu", icon: Clock3, color: "text-[#D4A373]" },
  Diproses: { label: "Diproses", icon: RefreshCw, color: "text-blue-500" },
  Selesai: { label: "Selesai", icon: CheckCircle2, color: "text-green-500" },
  Dibatalkan: { label: "Dibatalkan", icon: XCircle, color: "text-red-500" },
};

export default function AdminOrders() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengambil data pesanan");
      const json = await res.json();
      setOrders(json.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      alert("Gagal memuat data pesanan dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Gagal mengubah status pesanan");
      }
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      alert(error.message || "Terjadi kesalahan saat mengubah status.");
    } finally {
      setUpdatingId(null);
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
    if (!digits) return "#";
    if (digits.startsWith("0")) return `https://wa.me/62${digits.slice(1)}`;
    return `https://wa.me/${digits}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            .join(""),
        );
        const payload = JSON.parse(jsonPayload);
        if (String(payload.role).toLowerCase() !== "admin") {
          router.push("/");
          return;
        }
        setAdminEmail(payload.email || "Admin");
        fetchOrders();
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

  const filteredOrders = orders.filter((order) => {
    const matchStatus = filter === "all" || order.status === filter;
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      (order.customer_name || "").toLowerCase().includes(term) ||
      String(order.id).includes(term) ||
      (order.whatsapp || "").toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const countByStatus = (status) =>
    orders.filter((o) => o.status === status).length;

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard", active: false },
    { name: "Manajemen Produk", icon: Coffee, path: "/admin/products", active: false },
    { name: "Pesanan", icon: ShoppingBag, path: "/admin/orders", active: true },
    { name: "Pelanggan", icon: Users, path: "/admin/customers", active: false },
  ];

  const stats = [
    { title: "Menunggu", value: countByStatus("Menunggu"), icon: Clock3, color: "text-[#D4A373]" },
    { title: "Diproses", value: countByStatus("Diproses"), icon: RefreshCw, color: "text-blue-500" },
    { title: "Selesai", value: countByStatus("Selesai"), icon: CheckCircle2, color: "text-green-500" },
    { title: "Dibatalkan", value: countByStatus("Dibatalkan"), icon: XCircle, color: "text-red-500" },
  ];

  const todayStr = new Date().toLocaleDateString("en-CA");
  const ordersToday = orders.filter(
    (o) => new Date(o.created_at).toLocaleDateString("en-CA") === todayStr,
  );
  const revenueToday = ordersToday.reduce(
    (s, o) => s + Number(o.total_price || 0),
    0,
  );
  const totalItemsSold = orders.reduce(
    (s, o) =>
      s +
      (o.items || []).reduce((sum, it) => sum + Number(it.quantity || 0), 0),
    0,
  );

  const filters = [
    { key: "all", label: "Semua" },
    { key: "Menunggu", label: "Menunggu" },
    { key: "Diproses", label: "Diproses" },
    { key: "Selesai", label: "Selesai" },
    { key: "Dibatalkan", label: "Dibatalkan" },
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
                  onClick={() => {
                    if (item.path && item.path !== "#") router.push(item.path);
                  }}
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
              Manajemen Pesanan
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex h-12 w-72 items-center gap-3 rounded-2xl bg-[#F9F9F9] shadow-[inset_6px_6px_12px_rgba(121,118,118,0.1),inset_-6px_-6px_12px_rgba(255,255,255,1)] px-5">
              <Search size={18} className="text-[#797676]" />
              <input
                type="text"
                placeholder="Cari nama, ID, atau telepon..."
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
                  Pesanan <span className="text-[#D4A373]">Masuk</span>
                </h1>
                <p className="mt-3 text-sm font-medium text-[#797676] max-w-xl leading-relaxed">
                  Pantau dan kelola semua transaksi pelanggan. Update status pesanan secara langsung.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold text-[#1A1A1A] bg-[#F9F9F9] shadow-[4px_4px_8px_rgba(121,118,118,0.08),-4px_-4px_8px_rgba(255,255,255,1)]">
                    📅 Pesanan Hari Ini: {ordersToday.length}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold text-[#D4A373] bg-[#F9F9F9] shadow-[4px_4px_8px_rgba(121,118,118,0.08),-4px_-4px_8px_rgba(255,255,255,1)]">
                    💰 Pendapatan Hari Ini: {formatRupiah(revenueToday)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold text-[#1A1A1A] bg-[#F9F9F9] shadow-[4px_4px_8px_rgba(121,118,118,0.08),-4px_-4px_8px_rgba(255,255,255,1)]">
                    📦 Produk Terjual: {totalItemsSold}
                  </span>
                </div>
              </div>
              <button
                onClick={fetchOrders}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#F9F9F9] px-6 py-4 text-sm font-bold text-[#D4A373] shadow-[8px_8px_16px_rgba(121,118,118,0.1),-8px_-8px_16px_rgba(255,255,255,1)] transition-all active:shadow-[inset_6px_6px_12px_rgba(121,118,118,0.1),inset_-6px_-6px_12px_rgba(255,255,255,1)] disabled:opacity-50"
              >
                <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                Muat Ulang
              </button>
            </section>

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.title} className="rounded-[28px] bg-[#F9F9F9] p-6 shadow-[10px_10px_20px_rgba(121,118,118,0.08),-10px_-10px_20px_rgba(255,255,255,1)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#797676]">{stat.title}</p>
                        <h3 className="mt-2 font-montserrat text-3xl font-black text-[#1A1A1A]">{stat.value}</h3>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-[inset_3px_3px_6px_rgba(121,118,118,0.12),inset_-3px_-3px_6px_rgba(255,255,255,1)] bg-[#F9F9F9]">
                        <Icon size={22} className={stat.color} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mb-8 flex flex-wrap gap-3">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    filter === f.key
                      ? "bg-[#F9F9F9] text-[#D4A373] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)]"
                      : "bg-[#F9F9F9] text-[#797676] shadow-[5px_5px_10px_rgba(121,118,118,0.08),-5px_-5px_10px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </section>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] rounded-[32px] shadow-[inset_10px_10px_20px_rgba(121,118,118,0.08),inset_-10px_-10px_20px_rgba(255,255,255,1)] bg-[#F9F9F9]">
                <Loader2 size={40} className="text-[#D4A373] animate-spin mb-4" />
                <p className="text-sm font-bold text-[#797676]">Memuat data pesanan...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] rounded-[32px] shadow-[inset_10px_10px_20px_rgba(121,118,118,0.08),inset_-10px_-10px_20px_rgba(255,255,255,1)] bg-[#F9F9F9] text-center p-10">
                <div className="flex h-20 w-20 items-center justify-center rounded-full shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] mb-6 bg-[#F9F9F9]">
                  <Package size={32} className="text-[#D4A373]" />
                </div>
                <h4 className="font-montserrat text-base font-bold text-[#1A1A1A]">Tidak Ada Pesanan</h4>
                <p className="mt-3 text-xs font-medium text-[#797676] max-w-sm leading-relaxed">
                  {filter === "all"
                    ? "Belum ada transaksi masuk. Pesanan dari website customer akan muncul di sini."
                    : `Belum ada pesanan dengan status "${filters.find((f) => f.key === filter)?.label}".`}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredOrders.map((order) => {
                  const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.Menunggu;
                  const StatusIcon = statusStyle.icon;
                  const isExpanded = expandedOrder === order.id;

                  return (
                    <div key={order.id} className="rounded-[28px] bg-[#F9F9F9] shadow-[10px_10px_20px_rgba(121,118,118,0.08),-10px_-10px_20px_rgba(255,255,255,1)] overflow-hidden">
                      <div
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="cursor-pointer p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all hover:bg-[#1A1A1A]/5"
                      >
                        <div className="flex items-center gap-5">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)] bg-[#F9F9F9] text-[#D4A373]">
                            <ShoppingBag size={22} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-montserrat text-base font-bold text-[#1A1A1A]">
                                #{String(order.id).padStart(4, "0")}
                              </h3>
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${statusStyle.color} shadow-[inset_2px_2px_4px_rgba(121,118,118,0.08),inset_-2px_-2px_4px_rgba(255,255,255,1)]`}>
                                <StatusIcon size={12} />
                                {statusStyle.label}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-medium text-[#797676]">
                                {order.customer_name || "-"} •
                              </p>
                              {order.whatsapp ? (
                                <a
                                  href={formatWhatsAppLink(order.whatsapp)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-green-600 bg-[#F9F9F9] shadow-[inset_2px_2px_4px_rgba(121,118,118,0.08),inset_-2px_-2px_4px_rgba(255,255,255,1)] hover:text-green-700 transition-all"
                                >
                                  <MessageCircle size={12} />
                                  {order.whatsapp}
                                </a>
                              ) : (
                                <p className="text-xs font-medium text-[#797676]">-</p>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] font-medium text-[#797676]/70">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#797676]">Total</p>
                            <p className="mt-1 font-montserrat text-lg font-black text-[#D4A373]">
                              {formatRupiah(order.total_price)}
                            </p>
                          </div>
                          <ChevronRight size={20} className={`text-[#797676] transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-[#797676]/10 p-6 lg:p-8">
                          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                            <div>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#797676] mb-4">Detail Item</h4>
                              <div className="space-y-3">
                                {(order.items || []).map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between rounded-2xl bg-[#F9F9F9] shadow-[inset_3px_3px_6px_rgba(121,118,118,0.08),inset_-3px_-3px_6px_rgba(255,255,255,1)] p-4">
                                    <div>
                                      <p className="text-sm font-bold text-[#1A1A1A]">{item.product_name}</p>
                                      <p className="text-[11px] font-medium text-[#797676] mt-0.5">
                                        {item.quantity} × {formatRupiah(item.price)}
                                      </p>
                                    </div>
                                    <p className="text-sm font-bold text-[#D4A373]">
                                      {formatRupiah(item.price * item.quantity)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#F9F9F9] shadow-[inset_3px_3px_6px_rgba(121,118,118,0.08),inset_-3px_-3px_6px_rgba(255,255,255,1)] p-4">
                                <p className="text-sm font-bold text-[#1A1A1A]">Total Pembayaran</p>
                                <p className="font-montserrat text-lg font-black text-[#D4A373]">
                                  {formatRupiah(order.total_price)}
                                </p>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#797676] mb-4">Update Status</h4>
                              <div className="space-y-3">
                                {[
                                  { key: "Menunggu", label: "Menunggu", icon: Clock3 },
                                  { key: "Diproses", label: "Diproses", icon: RefreshCw },
                                  { key: "Selesai", label: "Selesai", icon: CheckCircle2 },
                                  { key: "Dibatalkan", label: "Dibatalkan", icon: XCircle },
                                ].map((s) => {
                                  const isActive = order.status === s.key;
                                  const Icon = s.icon;
                                  return (
                                    <button
                                      key={s.key}
                                      onClick={() => updateOrderStatus(order.id, s.key)}
                                      disabled={updatingId === order.id}
                                      className={`w-full flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-bold transition-all ${
                                        isActive
                                          ? "bg-[#F9F9F9] text-[#D4A373] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)]"
                                          : "bg-[#F9F9F9] text-[#797676] shadow-[5px_5px_10px_rgba(121,118,118,0.08),-5px_-5px_10px_rgba(255,255,255,1)] hover:text-[#1A1A1A] active:shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)] disabled:opacity-50"
                                      }`}
                                    >
                                      <span className="flex items-center gap-3">
                                        <Icon size={16} />
                                        {s.label}
                                      </span>
                                      {updatingId === order.id && isActive && (
                                        <Loader2 size={14} className="animate-spin" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}