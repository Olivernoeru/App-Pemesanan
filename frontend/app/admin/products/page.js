"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, useRef } from "react";
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
  Plus,
  Edit,
  Trash2,
  Loader2,
  Upload,
  SlidersHorizontal,
  RefreshCcw,
  EyeOff,
  Eye,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export default function ProductManagement() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State untuk Data Produk & Pagination
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    limit: 10,
  });

  // State untuk Filter, Sort & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("Semua Kategori");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // ==========================================
  // STATE & REFS UNTUK MODAL EDIT
  // ==========================================
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  // FETCH DATA DARI BACKEND
  // ==========================================
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = new URL(`${API_BASE_URL}/api/products`);
      url.searchParams.append("page", currentPage);
      url.searchParams.append("limit", 10);
      if (searchQuery) url.searchParams.append("search", searchQuery);
      if (filterCategory !== "Semua Kategori")
        url.searchParams.append("category", filterCategory);
      // Selalu kirim status agar backend bisa deteksi admin (Semua Status = tampilkan semua)
      url.searchParams.append("status", filterStatus);
      url.searchParams.append("sort", sortBy);

      const res = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await res.json();

      if (result.success) {
        setProducts(result.data);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error("Gagal menarik data produk:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterCategory, filterStatus, searchQuery, sortBy]);

  // Trigger Fetching setiap kali filter/page berubah
  useEffect(() => {
    if (!isMounted) return;
    const fetchTimer = setTimeout(() => fetchProducts(), 0);
    return () => clearTimeout(fetchTimer);
  }, [fetchProducts, isMounted]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  // ==========================================
  // FUNGSI EDIT MENU
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
    setEditImageFile(null); // Reset file baru
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
    // Hanya append image jika admin pilih foto baru
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
        fetchProducts(); // Refresh tabel otomatis
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
  // FUNGSI AKSI CEPAT (TOGGLE & VISIBILITY)
  // ==========================================
  const handleToggleAvailability = async (id, currentStatus) => {
    const newStatus = currentStatus === "available" ? "sold_out" : "available";
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/products/${id}/availability`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ availability_status: newStatus }),
        },
      );
      if (res.ok) fetchProducts();
    } catch (error) {
      console.error("Gagal toggle status", error);
    }
  };

  const handleToggleVisibility = async (id, isActive) => {
    const action = isActive === 1 ? "Sembunyikan" : "Pulihkan";
    if (!confirm(`Yakin ingin ${action} produk ini?`)) return;

    const newVisibility = isActive === 1 ? 0 : 1;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/products/${id}/visibility`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_active: newVisibility }),
        },
      );
      if (res.ok) fetchProducts();
    } catch (error) {
      console.error("Gagal toggle visibility", error);
    }
  };

  // ==========================================
  // AUTH & RENDER INITIALIZATION
  // ==========================================
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/admin/login");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      fetch(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
        .then((response) => response.json())
        .then((data) => setAdminEmail(data.user?.email || "Admin"));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted)
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4A373]" size={40} />
      </div>
    );

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
      active: false,
    },
    {
      name: "Manajemen Produk",
      icon: Coffee,
      path: "/admin/products",
      active: true,
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

  return (
    <div className="admin-theme app-surface min-h-screen bg-[#F9F9F9] font-inter text-[#1A1A1A] flex overflow-hidden">
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
        </div>

        <div className="flex-1">
          <nav className="space-y-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  onClick={() => item.path !== "#" && router.push(item.path)}
                  className={`cursor-pointer flex w-full items-center justify-between rounded-2xl px-5 py-4 transition-all duration-300 ${item.active ? "bg-[#F9F9F9] shadow-[inset_6px_6px_12px_rgba(121,118,118,0.12),inset_-6px_-6px_12px_rgba(255,255,255,1)] text-[#D4A373]" : "bg-[#F9F9F9] text-[#797676] hover:shadow-[6px_6px_12px_rgba(121,118,118,0.1),-6px_-6px_12px_rgba(255,255,255,1)] hover:text-[#1A1A1A]"}`}
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
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="flex h-[100px] shrink-0 items-center justify-between px-8 lg:px-12 bg-[#F9F9F9] z-10">
          <div className="flex items-center gap-4">
            <h2 className="hidden sm:block font-montserrat text-2xl font-bold text-[#1A1A1A]">
              Pusat Kendali Menu
            </h2>
          </div>
          <NotificationDropdown />
        </header>

        <div className="flex-1 overflow-auto px-8 pb-12 lg:px-12 pt-2">
          <div className="mx-auto max-w-[1400px]">
            {/* TOOLBAR FILTER & SEARCH */}
            <div className="rounded-[32px] bg-[#F9F9F9] p-6 lg:p-8 mb-8 shadow-[10px_10px_20px_rgba(121,118,118,0.08),-10px_-10px_20px_rgba(255,255,255,1)]">
              <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
                {/* Search Bar */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="w-full lg:w-96 relative flex"
                >
                  <input
                    type="text"
                    placeholder="Cari nama produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl bg-[#F9F9F9] shadow-[inset_4px_4px_8px_rgba(121,118,118,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)] border border-transparent focus:border-[#D4A373]/30 py-3.5 pl-5 pr-14 text-sm font-medium text-[#1A1A1A] outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#797676] hover:text-[#D4A373]"
                  >
                    <Search size={18} />
                  </button>
                </form>

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl bg-[#F9F9F9] shadow-[4px_4px_8px_rgba(121,118,118,0.1),-4px_-4px_8px_rgba(255,255,255,1)] py-3 px-4 text-xs font-bold text-[#797676] outline-none cursor-pointer hover:text-[#D4A373] transition-colors"
                  >
                    <option value="Semua Kategori">Semua Kategori</option>
                    <option value="Coffee">Coffee</option>
                    <option value="Non Coffee">Non Coffee</option>
                    <option value="Arah Series">Arah Series</option>
                    <option value="Arah Toast">Arah Toast</option>
                    <option value="Food">Food</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl bg-[#F9F9F9] shadow-[4px_4px_8px_rgba(121,118,118,0.1),-4px_-4px_8px_rgba(255,255,255,1)] py-3 px-4 text-xs font-bold text-[#797676] outline-none cursor-pointer hover:text-[#D4A373] transition-colors"
                  >
                    <option value="Semua Status">Semua Status</option>
                    <option value="Tersedia">🟢 Tersedia</option>
                    <option value="Habis">🔴 Habis</option>
                    <option value="Disembunyikan">👁️‍🗨️ Disembunyikan</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl bg-[#F9F9F9] shadow-[4px_4px_8px_rgba(121,118,118,0.1),-4px_-4px_8px_rgba(255,255,255,1)] py-3 px-4 text-xs font-bold text-[#797676] outline-none cursor-pointer hover:text-[#D4A373] transition-colors"
                  >
                    <option value="newest">Terbaru</option>
                    <option value="name_asc">Nama (A-Z)</option>
                    <option value="price_asc">Harga Terendah</option>
                    <option value="price_desc">Harga Tertinggi</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TABEL SUPER (GOD MODE) */}
            <div className="rounded-[32px] bg-[#F9F9F9] p-8 shadow-[10px_10px_20px_rgba(121,118,118,0.08),-10px_-10px_20px_rgba(255,255,255,1)]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-montserrat text-lg font-bold text-[#1A1A1A]">
                    Katalog Produk Lengkap
                  </h3>
                  <p className="text-xs font-medium text-[#797676] mt-1">
                    Total: {pagination.total_items} Menu Ditemukan
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="animate-spin text-[#D4A373]" size={40} />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 text-[#797676] font-medium text-sm">
                  Tidak ada produk yang cocok dengan pencarian/filter ini.
                </div>
              ) : (
                <div className="rounded-[24px] overflow-hidden shadow-[inset_6px_6px_12px_rgba(121,118,118,0.08),inset_-6px_-6px_12px_rgba(255,255,255,1)] bg-[#F9F9F9]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
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
                          <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#797676] text-center">
                            Ketersediaan
                          </th>
                          <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#797676] text-center">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#797676]/10">
                        {products.map((product) => (
                          <tr
                            key={product.id}
                            className={`transition-colors ${product.is_active === 0 ? "opacity-60 bg-[#797676]/5" : "hover:bg-[#1A1A1A]/5"}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden shadow-[4px_4px_8px_rgba(121,118,118,0.1),-4px_-4px_8px_rgba(255,255,255,1)] bg-white relative">
                                  <Image
                                    src={`${API_BASE_URL}${product.image_url}`}
                                    alt={product.name}
                                    fill
                                    sizes="48px"
                                    className={`object-cover ${product.availability_status === "sold_out" ? "grayscale" : ""}`}
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                                    {product.name}
                                    {product.is_active === 0 && (
                                      <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-md">
                                        Hidden
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] font-medium text-[#797676] line-clamp-1 max-w-[180px]">
                                    {product.description}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className="inline-flex items-center rounded-full bg-[#F9F9F9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#D4A373] shadow-[inset_2px_2px_4px_rgba(121,118,118,0.08),inset_-2px_-2px_4px_rgba(255,255,255,1)]">
                                {product.category}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-[#D4A373]">
                                Rp{" "}
                                {Number(product.price).toLocaleString("id-ID")}
                              </p>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() =>
                                  handleToggleAvailability(
                                    product.id,
                                    product.availability_status,
                                  )
                                }
                                className={`flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-xl transition-all font-bold text-xs ${
                                  product.availability_status === "available"
                                    ? "text-green-600 shadow-[inset_2px_2px_5px_rgba(34,197,94,0.15),inset_-2px_-2px_5px_rgba(255,255,255,1)] bg-green-50/50"
                                    : "text-red-500 shadow-[inset_2px_2px_5px_rgba(239,68,68,0.15),inset_-2px_-2px_5px_rgba(255,255,255,1)] bg-red-50/50"
                                }`}
                              >
                                {product.availability_status === "available" ? (
                                  <ToggleRight size={18} />
                                ) : (
                                  <ToggleLeft size={18} />
                                )}
                                {product.availability_status === "available"
                                  ? "Tersedia"
                                  : "Habis"}
                              </button>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center gap-3">
                                {product.is_active === 1 ? (
                                  <>
                                    <button
                                      onClick={() => openEditModal(product)}
                                      className="p-2 text-[#797676] hover:text-[#D4A373] transition-colors rounded-lg shadow-[2px_2px_5px_rgba(121,118,118,0.1),-2px_-2px_5px_rgba(255,255,255,1)] active:shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                                      title="Edit Menu"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleToggleVisibility(
                                          product.id,
                                          product.is_active,
                                        )
                                      }
                                      className="p-2 text-[#797676] hover:text-orange-500 transition-colors rounded-lg shadow-[2px_2px_5px_rgba(121,118,118,0.1),-2px_-2px_5px_rgba(255,255,255,1)] active:shadow-[inset_2px_2px_4px_rgba(121,118,118,0.1),inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                                      title="Sembunyikan dari User"
                                    >
                                      <EyeOff size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleToggleVisibility(
                                        product.id,
                                        product.is_active,
                                      )
                                    }
                                    className="flex items-center gap-2 px-4 py-2 text-[#797676] hover:text-green-600 transition-colors rounded-lg shadow-[2px_2px_5px_rgba(121,118,118,0.1),-2px_-2px_5px_rgba(255,255,255,1)] text-xs font-bold"
                                    title="Pulihkan Menu"
                                  >
                                    <Eye size={16} /> Pulihkan
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PAGINATION */}
              {!isLoading && pagination.total_pages > 1 && (
                <div className="flex justify-between items-center mt-8">
                  <p className="text-xs font-bold text-[#797676]">
                    Halaman {pagination.current_page} dari{" "}
                    {pagination.total_pages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((curr) => curr - 1)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#797676] shadow-[4px_4px_8px_rgba(121,118,118,0.1),-4px_-4px_8px_rgba(255,255,255,1)] hover:text-[#D4A373] disabled:opacity-50 disabled:shadow-none"
                    >
                      Mundur
                    </button>
                    <button
                      disabled={currentPage === pagination.total_pages}
                      onClick={() => setCurrentPage((curr) => curr + 1)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#797676] shadow-[4px_4px_8px_rgba(121,118,118,0.1),-4px_-4px_8px_rgba(255,255,255,1)] hover:text-[#D4A373] disabled:opacity-50 disabled:shadow-none"
                    >
                      Lanjut
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ========================================== */}
      {/* MODAL EDIT PRODUK (PRE-FILLED) */}
      {/* ========================================== */}
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
              {/* Foto Produk */}
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
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full shadow-[2px_2px_6px_rgba(121,118,118,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)] bg-[#F9F9F9] text-[#D4A373] mb-3">
                        <Upload size={20} />
                      </div>
                      <p className="text-xs font-bold text-[#1A1A1A]">
                        Klik untuk Upload Foto
                      </p>
                    </>
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

              {/* Nama */}
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

              {/* Kategori & Harga */}
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

              {/* Deskripsi */}
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
    </div>
  );
}
