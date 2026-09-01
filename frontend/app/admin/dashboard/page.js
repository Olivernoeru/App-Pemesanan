"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import NotificationDropdown from "@/components/NotificationDropdown";
import { API_ENDPOINTS, authFetch, getImageUrl, API_BASE_URL } from "@/lib/api";
import {
  LayoutDashboard,
  Coffee,
  ShoppingBag,
  Users,
  ReceiptText,
  LogOut,
  Search,
  Menu,
  X,
  ChevronRight,
  ArrowUpRight,
  Plus,
  Activity,
  CircleCheck,
  Clock3,
  Edit,
  Trash2,
  Loader2,
  Upload,
  ExternalLink,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [ordersToday, setOrdersToday] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  // State Modal Tambah
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "Coffee",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // State Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "Coffee",
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const editFileInputRef = useRef(null);

  // ==========================================
  // FETCH PRODUK
  // ==========================================
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await authFetch(`${API_ENDPOINTS.PRODUCTS}?limit=100`);
      if (!res.ok) throw new Error("Gagal mengambil data produk");

      const responseData = await res.json();

      if (responseData && Array.isArray(responseData.data)) {
        setProducts(responseData.data);
      } else if (Array.isArray(responseData)) {
        setProducts(responseData);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // ==========================================
  // FETCH PESANAN
  // ==========================================
  const fetchOrders = async () => {
    try {
      const res = await authFetch(API_ENDPOINTS.ORDERS);
      if (!res.ok) throw new Error("Gagal mengambil data pesanan");

      const json = await res.json();
      const orders = json.data || [];

      setTotalOrders(orders.length);
      setPendingOrders(orders.filter((o) => o.status === "Menunggu").length);

      const today = new Date().toISOString().slice(0, 10);
      setOrdersToday(
        orders.filter((o) => {
          const d = new Date(o.created_at).toISOString().slice(0, 10);
          return d === today;
        }).length,
      );
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // ==========================================
  // HANDLER TAMBAH PRODUK
  // ==========================================
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert("Wajib upload foto produk!");

    setIsSubmitting(true);

    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("price", formData.price);
    submitData.append("description", formData.description);
    submitData.append("category", formData.category);
    submitData.append("image", imageFile);

    try {
      const res = await authFetch(API_ENDPOINTS.PRODUCTS, {
        method: "POST",
        body: submitData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Gagal menambahkan produk");
      }

      setIsModalOpen(false);
      setFormData({ name: "", price: "", description: "", category: "Coffee" });
      setImageFile(null);
      setImagePreview(null);

      fetchProducts();
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Gagal menyimpan data!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ==========================================
  // HANDLER EDIT PRODUK
  // ==========================================
  const openEditModal = (product) => {
    setEditId(product.id);
    setEditFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category || "Coffee",
    });
    setEditImagePreview(`${API_BASE_URL}${product.image_url}`);
    setEditImageFile(null);
    setIsEditModalOpen(true);
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    const submitData = new FormData();
    submitData.append("name", editFormData.name);
    submitData.append("price", editFormData.price);
    submitData.append("description", editFormData.description);
    submitData.append("category", editFormData.category);
    if (editImageFile) {
      submitData.append("image", editImageFile);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${editId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: submitData,
      });

      const result = await res.json();
      if (result.success) {
        setIsEditModalOpen(false);
        fetchProducts();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Gagal update produk:", error);
      alert("Terjadi kesalahan sistem saat menyimpan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // HANDLER HAPUS PRODUK (SOFT DELETE)
  // ==========================================
  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Yakin ingin menyembunyikan/menghapus "${name}"?`)) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      if (result.success) {
        fetchProducts();
      } else {
        alert(result.message || "Gagal menghapus produk");
      }
    } catch (error) {
      console.error("Error delete product:", error);
      alert("Terjadi kesalahan saat menghapus.");
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((response) => response.json())
        .then((data) => setAdminEmail(data.user?.email || "Admin"));
      fetchProducts();
      fetchOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4A373]" size={40} />
      </div>
    );
  }

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
      active: true,
    },
    {
      name: "Kasir / POS",
      icon: ReceiptText,
      path: "/pos",
      active: false,
    },
    {
      name: "Manajemen Produk",
      icon: Coffee,
      path: "/admin/products",
      active: false,
    },
    {
      name: "Pesanan",
      icon: ShoppingBag,
      path: "/admin/orders",
      active: false,
    },
    {
      name: "Pelanggan",
      icon: Users,
      path: "/admin/customers",
      active: false,
    },
  ];

  const stats = [
    {
      title: "Total Produk",
      value: (Array.isArray(products) ? products.length : 0).toString(),
      description: "Katalog aktif saat ini",
      icon: Coffee,
    },
    {
      title: "Pesanan Hari Ini",
      value: ordersToday.toString(),
      description: `${pendingOrders} menunggu diproses`,
      icon: ShoppingBag,
    },
    {
      title: "Total Pesanan",
      value: totalOrders.toString(),
      description: "Semua transaksi tercatat",
      icon: Users,
    },
  ];

  return (
    <div className="admin-theme app-surface min-h-screen bg-[#F9F9F9] font-inter text-[#1A1A1A] flex overflow-hidden">
      {/* MODAL TAMBAH PRODUK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[500px] rounded-[32px] bg-[#F9F9F9] p-8 shadow-[6px_6px_16px_rgba(121,118,118,0.06),-6px_-6px_16px_rgba(255,255,255,0.8)] border border-white/60 flex flex-col max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-montserrat text-xl font-bold text-[#1A1A1A]">
                  Tambah Menu
                </h2>
                <p className="text-xs font-medium text-[#797676] mt-1">
                  Masukkan detail dan foto katalog baru
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-xl shadow-[2px_2px_6px_rgba(121,118,118,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)] bg-[#F9F9F9] text-[#797676] hover:text-red-500 active:shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)] transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#797676] ml-2 mb-2 block">
                  Foto Produk
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 cursor-pointer rounded-2xl shadow-[inset_3px_3px_8px_rgba(121,118,118,0.06),inset_-3px_-3px_8px_rgba(255,255,255,0.8)] border border-transparent hover:border-[#D4A373]/20 bg-[#F9F9F9] flex flex-col items-center justify-center overflow-hidden transition-all hover:bg-[#D4A373]/5"
                >
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element -- preview berasal dari blob/data URL file lokal.
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full shadow-[2px_2px_6px_rgba(121,118,118,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)] bg-[#F9F9F9] text-[#D4A373] mb-3">
                        <Upload size={20} />
                      </div>
                      <p className="text-xs font-bold text-[#1A1A1A]">
                        Klik untuk Upload Foto
                      </p>
                      <p className="text-[10px] font-medium text-[#797676] mt-1">
                        Format: JPG, PNG (Max 5MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#797676] ml-2 mb-2 block">
                  Nama Menu
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Kopi Kenangan Mantan"
                  className="w-full rounded-2xl bg-[#F9F9F9] shadow-[inset_2px_2px_6px_rgba(121,118,118,0.06),inset_-2px_-2px_6px_rgba(255,255,255,0.8)] border border-transparent focus:border-[#D4A373]/30 p-4 text-sm font-medium text-[#1A1A1A] outline-none placeholder:text-[#797676]/50 focus:text-[#D4A373] transition-all"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#797676] ml-2 mb-2 block">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full rounded-2xl bg-[#F9F9F9] shadow-[inset_2px_2px_6px_rgba(121,118,118,0.06),inset_-2px_-2px_6px_rgba(255,255,255,0.8)] border border-transparent focus:border-[#D4A373]/30 p-4 text-sm font-medium text-[#1A1A1A] outline-none transition-all cursor-pointer"
                  >
                    <option value="Coffee">Coffee</option>
                    <option value="Non Coffee">Non Coffee</option>
                    <option value="Arah Series">Arah Series</option>
                    <option value="Arah Toast">Arah Toast</option>
                    <option value="Food">Food</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#797676] ml-2 mb-2 block">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="Contoh: 18000"
                    className="w-full rounded-2xl bg-[#F9F9F9] shadow-[inset_2px_2px_6px_rgba(121,118,118,0.06),inset_-2px_-2px_6px_rgba(255,255,255,0.8)] border border-transparent focus:border-[#D4A373]/30 p-4 text-sm font-medium text-[#1A1A1A] outline-none placeholder:text-[#797676]/50 focus:text-[#D4A373] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#797676] ml-2 mb-2 block">
                  Deskripsi
                </label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsikan racikan menu ini..."
                  className="w-full rounded-2xl bg-[#F9F9F9] shadow-[inset_2px_2px_6px_rgba(121,118,118,0.06),inset_-2px_-2px_6px_rgba(255,255,255,0.8)] border border-transparent focus:border-[#D4A373]/30 p-4 text-sm font-medium text-[#1A1A1A] outline-none placeholder:text-[#797676]/50 focus:text-[#D4A373] resize-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#D4A373] py-4 text-sm font-bold text-[#F9F9F9] shadow-[4px_4px_12px_rgba(212,163,115,0.3),-4px_-4px_12px_rgba(255,255,255,0.9)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  "Simpan Produk"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT PRODUK */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[500px] rounded-[32px] bg-[#F9F9F9] p-8 shadow-[6px_6px_16px_rgba(121,118,118,0.06),-6px_-6px_16px_rgba(255,255,255,0.8)] border border-white/60 flex flex-col max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-montserrat text-xl font-bold text-[#1A1A1A]">
                  Edit Menu
                </h2>
                <p className="text-xs font-medium text-[#797676] mt-1">
                  Ubah informasi produk ini
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-xl shadow-[2px_2px_6px_rgba(121,118,118,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)] bg-[#F9F9F9] text-[#797676] hover:text-red-500 active:shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)] transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#797676] ml-2 mb-2 block">
                  Foto Saat Ini / Baru
                </label>
                <div
                  onClick={() => editFileInputRef.current?.click()}
                  className="w-full h-40 cursor-pointer rounded-2xl shadow-[inset_3px_3px_8px_rgba(121,118,118,0.06),inset_-3px_-3px_8px_rgba(255,255,255,0.8)] border border-transparent hover:border-[#D4A373]/20 bg-[#F9F9F9] flex flex-col items-center justify-center overflow-hidden transition-all group"
                >
                  {editImagePreview ? (
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element -- preview berasal dari blob/data URL file lokal. */}
                      <img
                        src={editImagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-bold flex items-center gap-2">
                          <Upload size={16} /> Ganti Foto
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full shadow-[2px_2px_6px_rgba(121,118,118,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)] bg-[#F9F9F9] text-[#D4A373] mb-3">
                      <Upload size={20} />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={handleEditImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#797676] ml-2 mb-2 block">
                  Nama Menu
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="w-full rounded-2xl bg-[#F9F9F9] shadow-[inset_2px_2px_6px_rgba(121,118,118,0.06),inset_-2px_-2px_6px_rgba(255,255,255,0.8)] border border-transparent focus:border-[#D4A373]/30 p-4 text-sm font-medium text-[#1A1A1A] outline-none transition-all"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#797676] ml-2 mb-2 block">
                    Kategori
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        category: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl bg-[#F9F9F9] shadow-[inset_2px_2px_6px_rgba(121,118,118,0.06),inset_-2px_-2px_6px_rgba(255,255,255,0.8)] border border-transparent focus:border-[#D4A373]/30 p-4 text-sm font-medium text-[#1A1A1A] outline-none transition-all cursor-pointer"
                  >
                    <option value="Coffee">Coffee</option>
                    <option value="Non Coffee">Non Coffee</option>
                    <option value="Arah Series">Arah Series</option>
                    <option value="Arah Toast">Arah Toast</option>
                    <option value="Food">Food</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#797676] ml-2 mb-2 block">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={editFormData.price}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        price: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl bg-[#F9F9F9] shadow-[inset_2px_2px_6px_rgba(121,118,118,0.06),inset_-2px_-2px_6px_rgba(255,255,255,0.8)] border border-transparent focus:border-[#D4A373]/30 p-4 text-sm font-medium text-[#1A1A1A] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#797676] ml-2 mb-2 block">
                  Deskripsi
                </label>
                <textarea
                  required
                  rows="3"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl bg-[#F9F9F9] shadow-[inset_2px_2px_6px_rgba(121,118,118,0.06),inset_-2px_-2px_6px_rgba(255,255,255,0.8)] border border-transparent focus:border-[#D4A373]/30 p-4 text-sm font-medium text-[#1A1A1A] outline-none resize-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#D4A373] py-4 text-sm font-bold text-[#F9F9F9] shadow-[4px_4px_12px_rgba(212,163,115,0.3),-4px_-4px_12px_rgba(255,255,255,0.9)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#F9F9F9]/70 backdrop-blur-sm lg:hidden transition-opacity cursor-pointer"
        />
      )}

      {/* SIDEBAR */}
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
                    if (item.path && item.path !== "#") {
                      router.push(item.path);
                    }
                  }}
                  className={`cursor-pointer flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition-all duration-300 ${item.active ? "bg-[#F9F9F9] shadow-[inset_6px_6px_12px_rgba(121,118,118,0.12),inset_-6px_-6px_12px_rgba(255,255,255,1)] text-[#D4A373]" : "bg-[#F9F9F9] text-[#797676] hover:shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"}`}
                >
                  <div className="flex items-center gap-4">
                    <Icon size={20} strokeWidth={item.active ? 2.5 : 2} />
                    <span
                      className={`text-sm ${item.active ? "font-bold" : "font-medium"}`}
                    >
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
              <p className="text-sm font-bold text-[#1A1A1A]">
                {getAdminName()}
              </p>
              <p className="text-[11px] font-medium text-[#797676]">
                {adminEmail || "Admin"}
              </p>
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

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="flex h-[100px] shrink-0 items-center justify-between px-8 lg:px-12 bg-[#F9F9F9] z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex h-12 w-12 items-center justify-center rounded-2xl shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] text-[#1A1A1A]"
            >
              <Menu size={20} />
            </button>
            <h2 className="hidden sm:block font-montserrat text-2xl font-bold text-[#1A1A1A]">
              Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex h-12 w-72 items-center gap-3 rounded-2xl bg-[#F9F9F9] shadow-[inset_6px_6px_12px_rgba(121,118,118,0.1),inset_-6px_-6px_12px_rgba(255,255,255,1)] px-5">
              <Search size={18} className="text-[#797676]" />
              <input
                type="text"
                placeholder="Cari menu, pesanan..."
                className="w-full bg-transparent text-sm font-medium text-[#1A1A1A] outline-none placeholder:text-[#797676]/60"
              />
            </div>

            <NotificationDropdown />
          </div>
        </header>

        <div className="flex-1 overflow-auto px-8 pb-12 lg:px-12 pt-2">
          <div className="mx-auto max-w-[1400px]">
            {/* HERO SECTION */}
            <section className="mb-14 flex flex-col md:flex-row justify-between gap-8 md:items-end">
              <div>
                <h1 className="font-montserrat text-3xl font-black text-[#1A1A1A] sm:text-4xl">
                  Selamat datang,{" "}
                  <span className="text-[#D4A373]">{getAdminName()}</span>
                </h1>
                <p className="mt-4 text-sm font-medium text-[#797676] max-w-xl leading-relaxed">
                  Kelola menu, pantau pesanan, dan atur operasional Ilang Arah
                  melalui satu panel kendali minimalis.
                </p>
              </div>
              <div className="flex gap-4">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#F9F9F9] px-6 py-4 text-sm font-bold text-[#797676] shadow-[8px_8px_16px_rgba(121,118,118,0.1),-8px_-8px_16px_rgba(255,255,255,1)] transition-all active:shadow-[inset_6px_6px_12px_rgba(121,118,118,0.1),inset_-6px_-6px_12px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"
                >
                  <ExternalLink size={18} /> Lihat Website Customer
                </a>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-3 rounded-2xl bg-[#F9F9F9] px-8 py-4 text-sm font-bold text-[#D4A373] shadow-[8px_8px_16px_rgba(121,118,118,0.1),-8px_-8px_16px_rgba(255,255,255,1)] transition-all active:shadow-[inset_6px_6px_12px_rgba(121,118,118,0.1),inset_-6px_-6px_12px_rgba(255,255,255,1)] hover:scale-105"
                >
                  <Plus size={20} strokeWidth={2.5} /> Tambah Menu
                </button>
              </div>
            </section>

            {/* STATS SECTION */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {stats.map((stat) => (
                <div
                  key={stat.title}
                  className="rounded-[32px] bg-[#F9F9F9] p-8 shadow-[10px_10px_20px_rgba(121,118,118,0.08),-10px_-10px_20px_rgba(255,255,255,1)]"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#797676]">
                        {stat.title}
                      </p>
                      <h3 className="mt-3 font-montserrat text-4xl font-black text-[#1A1A1A]">
                        {stat.value}
                      </h3>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F9F9F9] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)] text-[#D4A373]">
                      <stat.icon size={24} strokeWidth={2} />
                    </div>
                  </div>
                  <div className="mt-8 flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full shadow-[inset_2px_2px_4px_rgba(121,118,118,0.15)] bg-[#F9F9F9]">
                      <div className="h-full w-[15%] rounded-full bg-[#D4A373]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#797676]">
                      {stat.description}
                    </span>
                  </div>
                </div>
              ))}
            </section>

            {/* TABEL & AKSI CEPAT SECTION */}
            <section className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
              <div
                id="katalog-tabel"
                className="rounded-[32px] bg-[#F9F9F9] p-8 shadow-[10px_10px_20px_rgba(121,118,118,0.08),-10px_-10px_20px_rgba(255,255,255,1)] flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-montserrat text-lg font-bold text-[#1A1A1A]">
                      Katalog Menu Aktif
                    </h3>
                    <p className="text-xs font-medium text-[#797676] mt-1">
                      Daftar produk yang ditarik dari database
                    </p>
                  </div>
                  <button
                    onClick={fetchProducts}
                    className="h-10 w-10 flex items-center justify-center rounded-xl shadow-[4px_4px_8px_rgba(121,118,118,0.1),-4px_-4px_8px_rgba(255,255,255,1)] bg-[#F9F9F9] text-[#797676] hover:text-[#D4A373] active:shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                  >
                    <Activity size={20} />
                  </button>
                </div>

                {isLoadingProducts ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] rounded-[24px] shadow-[inset_8px_8px_16px_rgba(121,118,118,0.08),inset_-8px_-8px_16px_rgba(255,255,255,1)] bg-[#F9F9F9] p-8">
                    <Loader2
                      size={32}
                      className="text-[#D4A373] animate-spin mb-4"
                    />
                    <p className="text-sm font-bold text-[#797676]">
                      Menarik data dari database...
                    </p>
                  </div>
                ) : !Array.isArray(products) || products.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] rounded-[24px] shadow-[inset_8px_8px_16px_rgba(121,118,118,0.08),inset_-8px_-8px_16px_rgba(255,255,255,1)] bg-[#F9F9F9] p-8 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] mb-6 bg-[#F9F9F9]">
                      <Coffee size={32} className="text-[#D4A373]" />
                    </div>
                    <h4 className="font-montserrat text-base font-bold text-[#1A1A1A]">
                      Belum Ada Menu
                    </h4>
                    <p className="mt-3 text-xs font-medium text-[#797676] max-w-sm leading-relaxed">
                      Katalog lu masih kosong. Klik tombol &quot;Tambah Menu&quot; di atas
                      untuk mulai memasukkan foto, nama, dan harga produk.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[24px] overflow-hidden shadow-[inset_6px_6px_12px_rgba(121,118,118,0.08),inset_-6px_-6px_12px_rgba(255,255,255,1)] bg-[#F9F9F9]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#797676]/10">
                            <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#797676]">
                              Produk
                            </th>
                            <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#797676]">
                              Kategori
                            </th>
                            <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#797676]">
                              Harga
                            </th>
                            <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#797676]">
                              Status
                            </th>
                            <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#797676] text-center">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#797676]/10">
                          {Array.isArray(products) &&
                            products.map((product) => (
                              <tr
                                key={product.id}
                                className="transition-colors hover:bg-[#1A1A1A]/5"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white shadow-[4px_4px_8px_rgba(121,118,118,0.1),-4px_-4px_8px_rgba(255,255,255,1)]">
                                      <Image src={`${API_BASE_URL}${product.image_url}`} alt={product.name} fill sizes="48px" className="object-cover" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-[#1A1A1A]">
                                        {product.name}
                                      </p>
                                      <p className="text-[11px] font-medium text-[#797676] line-clamp-1 max-w-[150px]">
                                        {product.description}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center rounded-full bg-[#F9F9F9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#D4A373] shadow-[inset_2px_2px_4px_rgba(121,118,118,0.08),inset_-2px_-2px_4px_rgba(255,255,255,1)] border border-white/50">
                                    {product.category || "Coffee"}
                                  </span>
                                </td>

                                <td className="px-6 py-4">
                                  <p className="text-sm font-bold text-[#D4A373]">
                                    Rp{" "}
                                    {Number(product.price).toLocaleString(
                                      "id-ID",
                                    )}
                                  </p>
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)]`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${product.availability_status === "sold_out" ? "bg-red-500" : "bg-green-500"}`}
                                    ></span>
                                    {product.availability_status === "sold_out"
                                      ? "Habis"
                                      : "Tersedia"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => openEditModal(product)}
                                      className="p-2 text-[#797676] hover:text-[#D4A373] transition-colors rounded-lg hover:shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                                      title="Edit Menu"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteProduct(
                                          product.id,
                                          product.name,
                                        )
                                      }
                                      className="p-2 text-[#797676] hover:text-red-500 transition-colors rounded-lg hover:shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                                      title="Hapus Menu"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <div className="rounded-[32px] bg-[#F9F9F9] p-8 shadow-[10px_10px_20px_rgba(121,118,118,0.08),-10px_-10px_20px_rgba(255,255,255,1)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#797676]">
                        Sistem Backend
                      </p>
                      <h3 className="mt-2 font-montserrat text-xl font-bold text-[#1A1A1A]">
                        Online & Aktif
                      </h3>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-[inset_4px_4px_8px_rgba(121,118,118,0.12),inset_-4px_-4px_8px_rgba(255,255,255,1)] text-[#D4A373] bg-[#F9F9F9]">
                      <CircleCheck size={24} />
                    </div>
                  </div>
                  <p className="mt-6 text-xs font-medium text-[#797676] leading-relaxed">
                    Sistem terintegrasi dengan REST API. Anda dapat mengelola
                    menu dari Dashboard maupun Manajemen Produk.
                  </p>
                </div>

                <div className="rounded-[32px] bg-[#F9F9F9] p-8 shadow-[10px_10px_20px_rgba(121,118,118,0.08),-10px_-10px_20px_rgba(255,255,255,1)]">
                  <div className="flex items-center gap-3 mb-6">
                    <Clock3 size={20} className="text-[#D4A373]" />
                    <h3 className="font-montserrat text-base font-bold text-[#1A1A1A]">
                      Aksi Cepat
                    </h3>
                  </div>

                  <div className="space-y-5">
                    <div
                      onClick={() => router.push("/admin/orders")}
                      className="cursor-pointer flex w-full items-center justify-between rounded-2xl p-4 shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] active:shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)] bg-[#F9F9F9] transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl shadow-[inset_3px_3px_6px_rgba(121,118,118,0.12),inset_-3px_-3px_6px_rgba(255,255,255,1)] bg-[#F9F9F9] text-[#D4A373] group-hover:scale-105 transition-transform">
                          <ShoppingBag size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-[#1A1A1A]">
                            Lihat Pesanan
                          </p>
                          <p className="mt-1 text-[10px] font-medium text-[#797676]">
                            Kelola pesanan masuk
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={20}
                        className="text-[#797676] group-hover:translate-x-1 transition-transform"
                      />
                    </div>

                    <div
                      onClick={() => router.push("/admin/products")}
                      className="cursor-pointer flex w-full items-center justify-between rounded-2xl p-4 shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] active:shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)] bg-[#F9F9F9] transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl shadow-[inset_3px_3px_6px_rgba(121,118,118,0.12),inset_-3px_-3px_6px_rgba(255,255,255,1)] bg-[#F9F9F9] text-[#1A1A1A] group-hover:scale-105 transition-transform">
                          <ArrowUpRight size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-[#1A1A1A]">
                            Lihat Daftar
                          </p>
                          <p className="mt-1 text-[10px] font-medium text-[#797676]">
                            Ke Manajemen Produk
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={20}
                        className="text-[#797676] group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}