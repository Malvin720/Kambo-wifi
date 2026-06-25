const API_BASE = "/api";

function getHeaders(): HeadersInit {
  const token = localStorage.getItem("kambo_wifi_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `Request failed with status ${response.status}`;
    
    // Auto logout if unauthorized
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("kambo_wifi_token");
      localStorage.removeItem("kambo_wifi_user");
      // Only reload if not already at login
      if (!window.location.hash.includes("login") && window.location.pathname !== "/login") {
        window.location.reload();
      }
    }
    
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

export const api = {
  auth: {
    async login(username: string, password: string) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await handleResponse<{ token: string; user: { id: number; username: string } }>(res);
      localStorage.setItem("kambo_wifi_token", data.token);
      localStorage.setItem("kambo_wifi_user", JSON.stringify(data.user));
      return data;
    },
    async getMe() {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      });
      return handleResponse<{ user: { id: number; username: string } }>(res);
    },
    async changePassword(oldPassword: string, newPassword: string) {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      return handleResponse<{ message: string }>(res);
    },
    logout() {
      localStorage.removeItem("kambo_wifi_token");
      localStorage.removeItem("kambo_wifi_user");
    },
    isLoggedIn() {
      return !!localStorage.getItem("kambo_wifi_token");
    },
    getUser() {
      const userStr = localStorage.getItem("kambo_wifi_user");
      return userStr ? JSON.parse(userStr) : null;
    }
  },

  clients: {
    async getAll(filters?: { search?: string; status?: string; package_id?: string }) {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.package_id) params.append("package_id", filters.package_id);

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API_BASE}/clients${query}`, {
        headers: getHeaders(),
      });
      return handleResponse<any[]>(res);
    },
    async create(clientData: any) {
      const res = await fetch(`${API_BASE}/clients`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(clientData),
      });
      return handleResponse<any>(res);
    },
    async update(id: number, clientData: any) {
      const res = await fetch(`${API_BASE}/clients/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(clientData),
      });
      return handleResponse<any>(res);
    },
    async delete(id: number) {
      const res = await fetch(`${API_BASE}/clients/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse<any>(res);
    },
  },

  packages: {
    async getAll() {
      const res = await fetch(`${API_BASE}/packages`, {
        headers: getHeaders(),
      });
      return handleResponse<any[]>(res);
    },
    async create(pkgData: any) {
      const res = await fetch(`${API_BASE}/packages`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(pkgData),
      });
      return handleResponse<any>(res);
    },
    async update(id: number, pkgData: any) {
      const res = await fetch(`${API_BASE}/packages/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(pkgData),
      });
      return handleResponse<any>(res);
    },
    async delete(id: number) {
      const res = await fetch(`${API_BASE}/packages/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse<any>(res);
    },
  },

  payments: {
    async getAll() {
      const res = await fetch(`${API_BASE}/payments`, {
        headers: getHeaders(),
      });
      return handleResponse<any[]>(res);
    },
    async create(paymentData: any) {
      const res = await fetch(`${API_BASE}/payments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(paymentData),
      });
      return handleResponse<any>(res);
    },
    async stkPush(stkData: { client_id: number; phone: string; amount: number }) {
      const res = await fetch(`${API_BASE}/payments/stk-push`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(stkData),
      });
      return handleResponse<{ success: boolean; reference_number: string; message: string }>(res);
    },
    async getOverdue() {
      const res = await fetch(`${API_BASE}/payments/overdue`, {
        headers: getHeaders(),
      });
      return handleResponse<any[]>(res);
    },
  },

  repairs: {
    async getAll() {
      const res = await fetch(`${API_BASE}/repairs`, {
        headers: getHeaders(),
      });
      return handleResponse<any[]>(res);
    },
    async create(repairData: any) {
      const res = await fetch(`${API_BASE}/repairs`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(repairData),
      });
      return handleResponse<any>(res);
    },
    async update(id: number, repairData: any) {
      const res = await fetch(`${API_BASE}/repairs/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(repairData),
      });
      return handleResponse<any>(res);
    },
    async delete(id: number) {
      const res = await fetch(`${API_BASE}/repairs/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse<any>(res);
    },
  },

  products: {
    async getAll() {
      const res = await fetch(`${API_BASE}/products`, {
        headers: getHeaders(),
      });
      return handleResponse<any[]>(res);
    },
    async create(prodData: any) {
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(prodData),
      });
      return handleResponse<any>(res);
    },
    async update(id: number, prodData: any) {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(prodData),
      });
      return handleResponse<any>(res);
    },
    async delete(id: number) {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse<any>(res);
    },
  },

  sales: {
    async getAll() {
      const res = await fetch(`${API_BASE}/sales`, {
        headers: getHeaders(),
      });
      return handleResponse<any[]>(res);
    },
    async create(saleData: any) {
      const res = await fetch(`${API_BASE}/sales`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(saleData),
      });
      return handleResponse<any>(res);
    },
  },

  reports: {
    async get() {
      const res = await fetch(`${API_BASE}/reports`, {
        headers: getHeaders(),
      });
      return handleResponse<any>(res);
    },
  },

  settings: {
    async get() {
      const res = await fetch(`${API_BASE}/settings`, {
        headers: getHeaders(),
      });
      return handleResponse<any>(res);
    },
    async update(settingsData: any) {
      const res = await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(settingsData),
      });
      return handleResponse<any>(res);
    },
  },

  notifications: {
    async getAll() {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: getHeaders(),
      });
      return handleResponse<any[]>(res);
    },
    async markAsRead(id: number) {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PUT",
        headers: getHeaders(),
      });
      return handleResponse<any>(res);
    },
    async clearAll() {
      const res = await fetch(`${API_BASE}/notifications/clear`, {
        method: "POST",
        headers: getHeaders(),
      });
      return handleResponse<any>(res);
    },
  },

  dashboardStats: {
    async get() {
      const res = await fetch(`${API_BASE}/dashboard-stats`, {
        headers: getHeaders(),
      });
      return handleResponse<any>(res);
    },
  },
};
