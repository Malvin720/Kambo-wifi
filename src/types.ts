export interface User {
  id: number;
  username: string;
}

export interface Package {
  id: number;
  name: string;
  speed_mbps: number;
  price: number;
  created_at?: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  national_id: string;
  estate: string;
  house_number: string;
  gps_location?: string;
  package_id?: number | null;
  package_name?: string;
  package_speed?: number;
  monthly_price: number;
  installation_date: string;
  status: "active" | "suspended" | "offline";
  notes?: string;
  created_at?: string;
}

export interface Payment {
  id: number;
  client_id: number;
  client_name?: string;
  client_phone?: string;
  amount: number;
  date: string;
  method: "M-Pesa" | "Cash" | "Bank";
  reference_number: string;
  created_at?: string;
}

export interface Repair {
  id: number;
  client_id: number;
  client_name?: string;
  client_phone?: string;
  estate?: string;
  house_number?: string;
  problem: string;
  technician: string;
  date: string;
  status: "Pending" | "Assigned" | "In Progress" | "Completed";
  notes?: string;
  created_at?: string;
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  stock: number;
  buying_price: number;
  selling_price: number;
  created_at?: string;
}

export interface Sale {
  id: number;
  product_id: number;
  product_name?: string;
  product_brand?: string;
  quantity: number;
  total_price: number;
  date: string;
  customer_name: string;
  created_at?: string;
}

export interface Invoice {
  id: number;
  client_id: number;
  client_name?: string;
  client_phone?: string;
  estate?: string;
  house_number?: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: "Paid" | "Unpaid" | "Overdue";
  created_at?: string;
}

export interface Notification {
  id: number;
  type: "Payment Due" | "Suspended Account" | "New Repair" | "Low Router Stock";
  message: string;
  read: number; // 0 for false, 1 for true
  created_at?: string;
}

export interface Settings {
  id: number;
  business_name: string;
  phone_number: string;
  mpesa_number: string;
  logo_url: string;
  tax_rate: number;
  currency: string;
  dark_mode: number; // 0 for false, 1 for true
}

export interface DashboardSummary {
  totalClients: number;
  activeClients: number;
  suspendedClients: number;
  offlineClients: number;
  monthlyRevenue: number;
  pendingRepairs: number;
  lowStockAlerts: number;
}

export interface DashboardStats {
  summary: DashboardSummary;
  recentPayments: Payment[];
  recentActivities: {
    type: "signup" | "payment" | "repair";
    message: string;
    date: string;
  }[];
}

export interface ReportTopClient {
  id: number;
  name: string;
  phone: string;
  payment_count: number;
  total_paid: number;
}

export interface ReportOutstandingClient {
  name: string;
  phone: string;
  invoice_count: number;
  total_due: number;
}

export interface ReportRouterSale {
  product_name: string;
  items_sold: number;
  revenue: number;
  buying_cost: number;
  profit: number;
}

export interface ReportRepairStat {
  status: "Pending" | "Assigned" | "In Progress" | "Completed";
  count: number;
}

export interface ReportsData {
  revenue: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  topClients: ReportTopClient[];
  outstanding: {
    total: number;
    clients: ReportOutstandingClient[];
  };
  routerSales: ReportRouterSale[];
  repairStats: ReportRepairStat[];
}
