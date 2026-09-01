// Centralized API configuration
// Menghindari hardcode URL di setiap file

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  ME: `${API_BASE_URL}/api/auth/me`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,

  // Products
  PRODUCTS: `${API_BASE_URL}/api/products`,
  PRODUCT_BY_ID: (id) => `${API_BASE_URL}/api/products/${id}`,
  PRODUCT_AVAILABILITY: (id) => `${API_BASE_URL}/api/products/${id}/availability`,
  PRODUCT_VISIBILITY: (id) => `${API_BASE_URL}/api/products/${id}/visibility`,

  // Categories
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  CATEGORIES_WITH_COUNT: `${API_BASE_URL}/api/categories/with-count`,

  // Orders
  ORDERS: `${API_BASE_URL}/api/orders`,
  ORDER_TRACK: `${API_BASE_URL}/api/orders/track`,
  ORDER_CUSTOMERS: `${API_BASE_URL}/api/orders/customers`,
  ORDER_STATS: `${API_BASE_URL}/api/orders/stats`,
  ORDER_STATUS: (id) => `${API_BASE_URL}/api/orders/${id}/status`,

  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
  NOTIFICATIONS_UNREAD_COUNT: `${API_BASE_URL}/api/notifications/unread-count`,
  NOTIFICATIONS_READ_ALL: `${API_BASE_URL}/api/notifications/read-all`,
  NOTIFICATION_READ: (id) => `${API_BASE_URL}/api/notifications/${id}/read`,
};

// Helper untuk fetch dengan auth token otomatis
export async function authFetch(url, options = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Jangan set Content-Type kalau body FormData (browser akan set boundary otomatis)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });

  // Auto-handle 401 (token expired/invalid)
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("token");
    if (window.location.pathname.startsWith("/admin")) {
      // Helper non-komponen: reload penuh sengaja dipakai setelah token dihapus.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/admin/login";
    }
  }

  return res;
}

// Helper untuk full URL gambar upload
export function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}
