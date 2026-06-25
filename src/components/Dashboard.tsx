import { useEffect, useState } from "react";
import { api } from "../api";
import { DashboardStats, Notification } from "../types";
import {
  Users,
  CheckCircle,
  AlertTriangle,
  WifiOff,
  DollarSign,
  Wrench,
  Package as PackageIcon,
  Bell,
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
  ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface DashboardProps {
  onTabChange: (tab: string) => void;
  currency: string;
}

export default function Dashboard({ onTabChange, currency }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const statsData = await api.dashboardStats.get();
      const notifData = await api.notifications.getAll();
      setStats(statsData);
      setNotifications(notifData.filter(n => n.read === 0)); // Unread only
      setError("");
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch dashboard statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
        <p className="text-slate-500 font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

  const summary = stats?.summary;
  const recentPayments = stats?.recentPayments || [];
  const recentActivities = stats?.recentActivities || [];

  // Chart data helpers
  const clientStatusData = [
    { name: "Active", value: summary?.activeClients || 0, color: "#10b981" }, // Emerald-500
    { name: "Suspended", value: summary?.suspendedClients || 0, color: "#f59e0b" }, // Amber-500
    { name: "Offline", value: summary?.offlineClients || 0, color: "#ef4444" } // Red-500
  ];

  // Mock revenue chart data - aggregates weekly/monthly pattern
  const revenueChartData = [
    { label: "Jan", revenue: (summary?.monthlyRevenue || 30000) * 0.7 },
    { label: "Feb", revenue: (summary?.monthlyRevenue || 30000) * 0.8 },
    { label: "Mar", revenue: (summary?.monthlyRevenue || 30000) * 0.95 },
    { label: "Apr", revenue: (summary?.monthlyRevenue || 30000) * 0.9 },
    { label: "May", revenue: (summary?.monthlyRevenue || 30000) * 1.1 },
    { label: "Jun (Current)", revenue: summary?.monthlyRevenue || 30000 }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kambo WiFi Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">Real-time overview of your network subscribers, cash flow, and status.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white hover:bg-blue-800 disabled:bg-blue-300 rounded-full font-black text-xs tracking-wider uppercase shadow-lg shadow-blue-200 transition duration-150"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Stats"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm font-bold uppercase tracking-wide">
          {error}
        </div>
      )}

      {/* Notifications / Warnings Alerts Section */}
      {notifications.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-900 font-black uppercase text-sm tracking-wider">
            <Bell className="w-5 h-5 text-amber-600 animate-bounce" />
            <h2>System Notifications ({notifications.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifications.slice(0, 4).map((notif) => (
              <div
                key={notif.id}
                className="flex justify-between items-start bg-white p-4 rounded-2xl border border-amber-100 shadow-xs transition hover:shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="mt-0.5 p-1.5 bg-amber-50 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block">
                      {notif.type}
                    </span>
                    <p className="text-sm text-slate-700 mt-0.5 font-bold leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleMarkNotificationRead(notif.id)}
                  className="text-xs text-blue-700 hover:text-blue-900 font-black uppercase tracking-wider pl-2 self-center whitespace-nowrap"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
          {notifications.length > 4 && (
            <div className="text-right">
              <button
                onClick={() => onTabChange("notifications")}
                className="text-xs font-black text-blue-700 hover:text-blue-900 uppercase tracking-widest inline-flex items-center gap-1"
              >
                View all notifications ({notifications.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Clients Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 block">Total Clients</span>
            <span className="text-4xl font-black text-blue-900 mt-2 block">{summary?.totalClients}</span>
            <button
              onClick={() => onTabChange("clients")}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest mt-3 inline-flex items-center gap-1"
            >
              Manage clients <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Clients Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 block">Active Status</span>
            <span className="text-4xl font-black text-emerald-500 mt-2 block">{summary?.activeClients}</span>
            <div className="text-xs text-slate-400 mt-3 font-bold uppercase tracking-wider">
              Uptime: <span className="text-emerald-500 font-black">100% stable</span>
            </div>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Suspended/Offline Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 block">Attention Needed</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black text-amber-500">{summary?.suspendedClients}</span>
              <span className="text-slate-300 font-light text-2xl">/</span>
              <span className="text-3xl font-black text-rose-500">{summary?.offlineClients}</span>
            </div>
            <span className="text-xs text-slate-400 mt-3 block font-bold uppercase tracking-wider">Suspended / Offline</span>
          </div>
          <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl">
            <WifiOff className="w-6 h-6" />
          </div>
        </div>

        {/* Monthly Revenue Card - Highlight styled */}
        <div className="bg-blue-700 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between hover:shadow-2xl transition duration-200 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200 block">Monthly Invoiced</span>
            <span className="bg-emerald-400 text-blue-900 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">+12.4% vs L.M.</span>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-xl font-light opacity-60 mr-1.5 uppercase">{currency}</span>
            <span className="text-4xl font-black tracking-tighter">
              {summary?.monthlyRevenue?.toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => onTabChange("payments")}
            className="text-xs font-bold text-white hover:text-emerald-300 uppercase tracking-widest mt-4 inline-flex items-center gap-1.5 self-start"
          >
            View invoices <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Access Status Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Repairs Warning Box */}
        <div
          onClick={() => onTabChange("repairs")}
          className="bg-white border border-slate-200 p-6 rounded-3xl flex items-center justify-between cursor-pointer hover:border-blue-400 hover:shadow-sm transition duration-150"
        >
          <div className="flex gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl self-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Open Repairs Tickets</h3>
              <p className="text-xs text-slate-500 mt-0.5">Subscribers reporting speed or fiber signal disconnects.</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-red-600">{summary?.pendingRepairs}</span>
            <span className="text-[10px] text-red-700 font-black block uppercase tracking-wider">Pending</span>
          </div>
        </div>

        {/* Router Stock Alarm */}
        <div
          onClick={() => onTabChange("router-shop")}
          className="bg-white border border-slate-200 p-6 rounded-3xl flex items-center justify-between cursor-pointer hover:border-blue-400 hover:shadow-sm transition duration-150"
        >
          <div className="flex gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl self-center">
              <PackageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Router Inventory Alert</h3>
              <p className="text-xs text-slate-500 mt-0.5">Critical stock item counts for customer installations.</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-black ${summary?.lowStockAlerts ? "text-amber-600 animate-pulse" : "text-slate-600"}`}>
              {summary?.lowStockAlerts}
            </span>
            <span className="text-[10px] text-slate-600 font-black block uppercase tracking-wider">Low Stock</span>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Growth Trend */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Revenue Growth Trend</h2>
              <p className="text-xs text-slate-400">Total KES billed and collected over the past 6 months.</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Avg</span>
              <span className="text-lg font-black text-blue-700 block">KES 28,500</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, "Collected"]}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #f1f5f9" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscriber Status Breakdown */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Subscriber Status</h2>
            <p className="text-xs text-slate-400">Active vs Suspended vs Offline clients.</p>
          </div>
          <div className="h-44 relative flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clientStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {clientStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} Clients`, "Count"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-800">{summary?.totalClients}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Clients</span>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-4 space-y-2.5">
            {clientStatusData.map((data, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
                  <span className="font-bold text-slate-600">{data.name}</span>
                </div>
                <div className="font-black text-slate-700">
                  {data.value} ({summary?.totalClients ? Math.round((data.value / summary.totalClients) * 100) : 0}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS & ACTIVITY logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments Log */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Recent Cash collections</h2>
              <p className="text-xs text-slate-400">The last 5 payments received.</p>
            </div>
            <button
              onClick={() => onTabChange("payments")}
              className="text-xs font-black text-blue-700 hover:text-blue-900 uppercase tracking-widest"
            >
              See all payments
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentPayments.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-sm">No recent payments recorded.</p>
            ) : (
              recentPayments.map((pay) => (
                <div key={pay.id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">{pay.client_name}</h4>
                      <p className="text-2xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className="font-medium">{pay.date}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-wider">
                          {pay.method}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 text-sm">
                      +{currency} {pay.amount.toLocaleString()}
                    </span>
                    <span className="font-mono text-2xs text-slate-400 block tracking-tight mt-0.5">
                      {pay.reference_number}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Network logs & operations */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Operations Activity logs</h2>
              <p className="text-xs text-slate-400">Live operational events on Kambo WiFi system.</p>
            </div>
          </div>
          <div className="relative border-l-2 border-slate-100 pl-4 space-y-5 py-2 ml-2">
            {recentActivities.length === 0 ? (
              <p className="text-slate-400 text-sm pl-2">No recent system activities.</p>
            ) : (
              recentActivities.map((act, index) => {
                let badgeColor = "bg-slate-400";
                if (act.type === "signup") badgeColor = "bg-blue-500";
                if (act.type === "payment") badgeColor = "bg-emerald-500";
                if (act.type === "repair") badgeColor = "bg-red-500";

                return (
                  <div key={index} className="relative">
                    {/* Circle timeline dot */}
                    <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-white ring-4 ring-slate-50 ${badgeColor}`}></div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                      <p className="text-xs font-bold text-slate-800 pr-4 leading-normal">
                        {act.message}
                      </p>
                      <span className="text-3xs text-slate-400 font-mono flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(act.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
