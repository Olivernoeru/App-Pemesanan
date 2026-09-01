"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Coffee,
  Search,
  ShoppingBag,
  Loader2,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  User,
  Hash,
  Banknote,
  CreditCard,
  LayoutDashboard,
  ArrowLeft,
  ReceiptText,
  Package,
  Users,
  LogOut,
  Menu,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const CATEGORIES = [
  "Semua",
  "Coffee",
  "Non Coffee",
  "Arah Series",
  "Arah Toast",
  "Food",
];

const API = API_BASE_URL;

export default function POSPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState("");

  // Produk
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [category, setCategory] = useState("Semua");
  const [search, setSearch] = useState("");

  // Keranjang
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch(`${API}/api/products?limit=100`);
      const json = await res.json();
      const items = json?.data && Array.isArray(json.data) ? json.data : [];
      setProducts(
        items.filter((p) => p.is_active === 1 || p.is_active === undefined),
      );
    } catch (err) {
      console.error("POS fetch products error:", err);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
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
        // Verifikasi sisi server: fetch profil admin menggunakan token
        fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((data) => {
            if (!data.success || data.user?.role !== "admin") {
              localStorage.removeItem("token");
              router.push("/admin/login");
              return;
            }
            setIsAdmin(true);
            setAdminName(data.user.name || data.user.email?.split("@")[0] || "Admin");
            fetchProducts();
          })
          .catch(() => { localStorage.removeItem("token"); router.push("/admin/login"); });
      } catch {
        localStorage.removeItem("token");
        router.push("/admin/login");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  const filteredProducts = products.filter((p) => {
    const matchCat =
      category === "Semua" ||
      p.category?.toLowerCase() === category.toLowerCase();
    const matchSearch =
      !search.trim() ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (product) => {
    if (product.availability_status === "sold_out") return;
    setCart((prev) => {
      const found = prev.find((i) => i.product_id === product.id);
      if (found) {
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          price: Number(product.price),
          quantity: 1,
          image_url: product.image_url,
        },
      ];
    });
  };

  const updateQty = (pid, delta) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product_id === pid
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const removeItem = (pid) =>
    setCart((prev) => prev.filter((i) => i.product_id !== pid));

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const change = Math.max(0, (Number(cashReceived) || 0) - cartTotal);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return alert("Keranjang masih kosong.");
    if (paymentMethod === "cash" && Number(cashReceived) < cartTotal) {
      return alert("Uang tunai kurang dari total belanja.");
    }

    setIsSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const idempKey = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36);
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempKey,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customer_name: customerName.trim() || "Walk-in Customer",
          table_number: tableNumber.trim(),
          whatsapp: "",
          notes: `POS Kasir - ${paymentMethod === "cash" ? "Tunai" : "QRIS"}`,
          payment_method: paymentMethod,
          // Harga dan status pembayaran dihitung di server berdasarkan token admin
          items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal membuat pesanan.");
      setSuccessOrder(json.order_id || cartTotal);
    } catch (err) {
      console.error("POS submit error:", err);
      alert("Gagal memproses pesanan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAll = () => {
    setCart([]);
    setCustomerName("");
    setTableNumber("");
    setCashReceived("");
    setSuccessOrder(null);
    fetchProducts();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/admin/login");
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "Kasir / POS", icon: ReceiptText, path: "/pos", active: true },
    { name: "Manajemen Produk", icon: Package, path: "/admin/products" },
    { name: "Pesanan", icon: ShoppingBag, path: "/admin/orders" },
    { name: "Pelanggan", icon: Users, path: "/admin/customers" },
  ];

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4A373]" size={40} />
      </div>
    );
  }

  if (!isAdmin) return null;

  const fmt = (n) => "Rp " + Number(n).toLocaleString("id-ID");

  return (
    <div className="admin-theme app-surface min-h-screen font-inter text-[#1A1A1A] flex overflow-hidden">
      {/* SIDEBAR MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#F9F9F9] shadow-[8px_0_24px_rgba(0,0,0,0.06)] px-6 py-8 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-4 mb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F9F9F9] shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] text-[#D4A373]">
            <Coffee size={24} />
          </div>
          <div>
            <h1 className="font-montserrat text-[15px] font-black tracking-widest">
              ILANG ARAH
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#797676]">
              POS Kasir
            </p>
          </div>
        </div>

        <nav className="space-y-3">
          {menuItems.map((item) => (
            <div
              key={item.name}
              onClick={() => router.push(item.path)}
              className={`cursor-pointer flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all ${
                item.active
                  ? "bg-[#F9F9F9] shadow-[inset_6px_6px_12px_rgba(121,118,118,0.12),inset_-6px_-6px_12px_rgba(255,255,255,1)] text-[#D4A373] font-bold"
                  : "bg-[#F9F9F9] text-[#797676] hover:shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.name}</span>
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="flex items-center gap-4 px-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F9F9F9] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.15),inset_-4px_-4px_8px_rgba(255,255,255,1)] font-montserrat font-bold text-[#D4A373]">
              {(adminName || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold">{adminName}</p>
              <p className="text-[11px] text-[#797676]">Kasir Online</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#F9F9F9] py-4 text-xs font-bold text-[#797676] shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] hover:text-[#1A1A1A] active:shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)]"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="sticky top-0 flex h-[100px] shrink-0 items-center justify-between border-b border-white/60 bg-[#F9F9F9]/80 px-5 backdrop-blur-xl z-10 sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex h-11 w-11 items-center justify-center rounded-2xl shadow-[4px_4px_8px_rgba(121,118,118,0.1),-4px_-4px_8px_rgba(255,255,255,1)]"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="font-montserrat text-xl lg:text-2xl font-bold">
                Kasir / Point of Sale
              </h2>
              <p className="text-[11px] font-medium text-[#797676] hidden sm:block">
                Pilih menu, isi keranjang, dan proses pembayaran langsung.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-2 rounded-2xl bg-[#F9F9F9] px-4 py-2.5 text-xs font-bold text-[#D4A373] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)]">
              <ShoppingBag size={15} /> {cartCount} item
            </span>
            <button
              onClick={() => router.push("/")}
              className="hidden sm:flex items-center gap-2 rounded-2xl bg-[#F9F9F9] px-4 py-2.5 text-xs font-bold text-[#797676] shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] hover:text-[#D4A373] active:scale-95"
            >
              <ArrowLeft size={15} /> Lihat Website
            </button>
          </div>
        </header>

        {/* BODY */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1700px] p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
            {/* LEFT: PRODUCT GRID */}
            <div>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#797676]/50"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari menu..."
                    className="w-full rounded-2xl bg-[#F9F9F9] shadow-[inset_5px_5px_10px_rgba(121,118,118,0.08),inset_-5px_-5px_10px_rgba(255,255,255,1)] py-3.5 pl-11 pr-4 text-sm font-medium outline-none placeholder:text-[#797676]/40"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`shrink-0 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                        category === c
                          ? "bg-[#F9F9F9] text-[#D4A373] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)]"
                          : "bg-[#F9F9F9] text-[#797676] shadow-[4px_4px_8px_rgba(121,118,118,0.08),-4px_-4px_8px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingProducts ? (
                <div className="flex flex-col items-center justify-center py-32 text-[#797676]">
                  <Loader2
                    size={36}
                    className="animate-spin text-[#D4A373] mb-3"
                  />
                  <p className="text-xs font-bold">Memuat menu...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-32">
                  <p className="text-sm font-bold text-[#797676]">
                    Tidak ada menu.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((p) => {
                    const soldOut = p.availability_status === "sold_out";
                    return (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        disabled={soldOut}
                        className={`text-left rounded-[24px] bg-[#F9F9F9] p-4 shadow-[8px_8px_16px_rgba(121,118,118,0.08),-8px_-8px_16px_rgba(255,255,255,1)] transition-all ${
                          soldOut
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:-translate-y-1 hover:shadow-[12px_12px_24px_rgba(121,118,118,0.12),-12px_-12px_24px_rgba(255,255,255,1)] active:scale-95"
                        }`}
                      >
                        <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-white mb-3">
                          <Image
                            src={`${API}${p.image_url}`}
                            alt={p.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className={`object-cover ${soldOut ? "grayscale" : ""}`}
                          />
                          {soldOut && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-bold px-2 py-1 rounded-full">
                              HABIS
                            </span>
                          )}
                          <span className="absolute bottom-2 left-2 flex items-center justify-center h-7 w-7 rounded-full bg-[#D4A373] text-white shadow-md">
                            <Plus size={14} />
                          </span>
                        </div>
                        <h3 className="text-sm font-bold line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="text-[11px] font-medium text-[#797676] uppercase tracking-wider mt-0.5">
                          {p.category || "Coffee"}
                        </p>
                        <p className="mt-2 text-sm font-black text-[#D4A373]">
                          {fmt(p.price)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: CART / CHECKOUT */}
            <div className="rounded-[32px] bg-[#F9F9F9] p-6 shadow-[10px_10px_20px_rgba(121,118,118,0.08),-10px_-10px_20px_rgba(255,255,255,1)] flex flex-col lg:h-[calc(100vh-130px)] lg:sticky lg:top-6">
              {successOrder ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#F9F9F9] shadow-[inset_6px_6px_12px_rgba(121,118,118,0.14),inset_-6px_-6px_12px_rgba(255,255,255,1)]">
                    <CheckCircle2 size={48} className="text-[#D4A373]" />
                  </div>
                  <h3 className="font-montserrat text-2xl font-black">
                    Transaksi Berhasil! 🎉
                  </h3>
                  <p className="text-xs font-medium text-[#797676] mt-3 leading-relaxed max-w-xs">
                    Pesanan #{successOrder} berhasil dibuat. Total:
                    <span className="block font-black text-[#D4A373] text-lg mt-1">
                      {fmt(cartTotal)}
                    </span>
                  </p>
                  <button
                    onClick={resetAll}
                    className="mt-8 rounded-2xl bg-[#F9F9F9] px-8 py-4 text-sm font-bold text-[#D4A373] shadow-[8px_8px_16px_rgba(121,118,118,0.12),-8px_-8px_16px_rgba(255,255,255,1)] hover:scale-105 active:scale-95 transition-all"
                  >
                    Pesanan Baru
                  </button>
                </div>
              ) : (
                <>
                  {/* Customer Info */}
                  <div className="mb-5">
                    <h3 className="font-montserrat text-lg font-bold mb-4">
                      Detail Transaksi
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <User
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#797676]/40"
                        />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Nama (opsional)"
                          className="w-full rounded-xl bg-[#F9F9F9] shadow-[inset_3px_3px_6px_rgba(121,118,118,0.08),inset_-3px_-3px_6px_rgba(255,255,255,1)] py-3 pl-9 pr-3 text-xs font-medium outline-none placeholder:text-[#797676]/40"
                        />
                      </div>
                      <div className="relative">
                        <Hash
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#797676]/40"
                        />
                        <input
                          type="text"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          placeholder="No Meja"
                          className="w-full rounded-xl bg-[#F9F9F9] shadow-[inset_3px_3px_6px_rgba(121,118,118,0.08),inset_-3px_-3px_6px_rgba(255,255,255,1)] py-3 pl-9 pr-3 text-xs font-medium outline-none placeholder:text-[#797676]/40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="flex-1 overflow-auto space-y-3 pr-1 mb-4 min-h-[120px]">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F9F9F9] shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] mb-4 text-[#797676]/30">
                          <ShoppingBag size={28} />
                        </div>
                        <p className="text-sm font-bold text-[#1A1A1A]">
                          Belum ada item
                        </p>
                        <p className="text-[11px] text-[#797676] mt-1">
                          Klik menu di sebelah kiri untuk menambahkan.
                        </p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.product_id}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-[#F9F9F9] shadow-[6px_6px_12px_rgba(121,118,118,0.08),-6px_-6px_12px_rgba(255,255,255,1)]"
                        >
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white">
                            <Image src={`${API}${item.image_url}`} alt={item.product_name} fill sizes="44px" className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold line-clamp-1">
                              {item.product_name}
                            </p>
                            <p className="text-[11px] font-semibold text-[#D4A373]">
                              {fmt(item.price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(item.product_id, -1)}
                              className="p-1.5 rounded-lg bg-[#F9F9F9] shadow-[2px_2px_4px_rgba(121,118,118,0.1),-2px_-2px_4px_rgba(255,255,255,1)] text-[#797676] hover:text-[#D4A373] active:shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-black w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.product_id, 1)}
                              className="p-1.5 rounded-lg bg-[#F9F9F9] shadow-[2px_2px_4px_rgba(121,118,118,0.1),-2px_-2px_4px_rgba(255,255,255,1)] text-[#797676] hover:text-[#D4A373] active:shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <p className="text-xs font-black">
                              {fmt(item.price * item.quantity)}
                            </p>
                            <button
                              onClick={() => removeItem(item.product_id)}
                              className="text-[#797676]/40 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Payment */}
                  <div className="space-y-4 border-t border-[#797676]/10 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod("cash")}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                          paymentMethod === "cash"
                            ? "bg-[#F9F9F9] text-[#D4A373] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)] border border-[#D4A373]/20"
                            : "bg-[#F9F9F9] text-[#797676] shadow-[4px_4px_8px_rgba(121,118,118,0.08),-4px_-4px_8px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"
                        }`}
                      >
                        <Banknote size={15} /> Tunai
                      </button>
                      <button
                        onClick={() => setPaymentMethod("qris")}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                          paymentMethod === "qris"
                            ? "bg-[#F9F9F9] text-[#D4A373] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)] border border-[#D4A373]/20"
                            : "bg-[#F9F9F9] text-[#797676] shadow-[4px_4px_8px_rgba(121,118,118,0.08),-4px_-4px_8px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"
                        }`}
                      >
                        <CreditCard size={15} /> QRIS
                      </button>
                    </div>

                    {paymentMethod === "cash" && (
                      <div className="relative">
                        <Banknote
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#797676]/40"
                        />
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="Uang diterima..."
                          className="w-full rounded-xl bg-[#F9F9F9] shadow-[inset_3px_3px_6px_rgba(121,118,118,0.08),inset_-3px_-3px_6px_rgba(255,255,255,1)] py-3 pl-9 pr-3 text-xs font-medium outline-none placeholder:text-[#797676]/40"
                        />
                      </div>
                    )}

                    {/* Subtotal */}
                    <div className="rounded-2xl bg-[#F9F9F9] p-4 shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-[#797676]">
                          Total
                        </span>
                        <span className="font-montserrat text-2xl font-black text-[#D4A373]">
                          {fmt(cartTotal)}
                        </span>
                      </div>
                      {paymentMethod === "cash" && Number(cashReceived) > 0 && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-[#797676]">
                            Kembalian
                          </span>
                          <span className="font-bold text-[#1A1A1A]">
                            {fmt(change)}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSubmitOrder}
                      disabled={isSubmitting || cart.length === 0}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#D4A373] py-4 text-sm font-bold text-[#F9F9F9] shadow-[4px_4px_12px_rgba(212,163,115,0.3),-4px_-4px_12px_rgba(255,255,255,0.9)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />{" "}
                          Memproses...
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={17} /> Proses Pembayaran
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}