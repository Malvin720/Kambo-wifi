import { useEffect, useState } from "react";
import { api } from "../api";
import { ReportsData } from "../types";
import {
  FileText,
  Loader2,
  Calendar,
  DollarSign,
  TrendingUp,
  Download,
  Printer,
  Users,
  CheckCircle,
  AlertTriangle,
  Package,
  Wrench,
  HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface ReportsProps {
  currency: string;
}

export default function Reports({ currency }: ReportsProps) {
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.reports.get();
        setReports(data);
        setError("");
      } catch (err: any) {
        console.error(err);
        setError("Failed to generate system analytics reports.");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Export to CSV helper
  const exportToCSV = (title: string, headers: string[], rows: any[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRevenueCSV = () => {
    if (!reports) return;
    const headers = ["Metric", "Value (KES)"];
    const rows = [
      ["Daily Revenue", reports.revenue.daily],
      ["Weekly Revenue", reports.revenue.weekly],
      ["Monthly Revenue", reports.revenue.monthly],
      ["Yearly Revenue", reports.revenue.yearly],
      ["Outstanding Receivables", reports.outstanding.total],
    ];
    exportToCSV("Revenue Summary", headers, rows);
  };

  const handleExportTopClientsCSV = () => {
    if (!reports) return;
    const headers = ["Client Name", "Phone", "Receipt Count", "Total Paid (KES)"];
    const rows = reports.topClients.map((c) => [c.name, c.phone, c.payment_count, c.total_paid]);
    exportToCSV("Top Paying Clients", headers, rows);
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
        <p className="text-slate-500 font-medium">Assembling Ledger balance sheets...</p>
      </div>
    );
  }

  const revenue = reports?.revenue;
  const topClients = reports?.topClients || [];
  const outstanding = reports?.outstanding;
  const routerSales = reports?.routerSales || [];
  const repairStats = reports?.repairStats || [];

  // Recharts Sales Bar Chart data
  const barChartData = routerSales.slice(0, 5).map((sale) => ({
    name: sale.product_name.slice(0, 15) + "...",
    revenue: sale.revenue,
    profit: sale.profit,
  }));

  const COLORS = ["#f59e0b", "#3b82f6", "#6366f1", "#10b981"];

  return (
    <div className="space-y-8 animate-fade-in printable-report">
      {/* Header controls (not printed) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Financial & System Reports</h1>
          <p className="text-sm text-slate-500">Examine ISP revenues, router sales audits, repair logs, and outstanding balances.</p>
        </div>
        <button
          onClick={handlePrintReport}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/10 transition"
        >
          <Printer className="w-5 h-5" />
          Print / Export PDF
        </button>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print-only text-center border-b pb-6 space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-blue-600">KAMBO WIFI MANAGEMENT SYSTEM</h1>
        <p className="text-sm text-slate-500 font-semibold uppercase">Official Auditor Financial and Operations Report</p>
        <p className="text-xs text-slate-400">Generated on: {new Date().toLocaleString()}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-semibold rounded-r-xl">
          {error}
        </div>
      )}

      {/* Revenue Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Daily */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-3xs uppercase tracking-wider font-extrabold text-slate-400 block">Daily Revenue</span>
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-black text-slate-800">
              {currency} {revenue?.daily.toLocaleString()}
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Weekly */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-3xs uppercase tracking-wider font-extrabold text-slate-400 block">Weekly Sum</span>
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-black text-slate-800">
              {currency} {revenue?.weekly.toLocaleString()}
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Monthly */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-3xs uppercase tracking-wider font-extrabold text-slate-400 block">Monthly Billings</span>
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-black text-slate-800">
              {currency} {revenue?.monthly.toLocaleString()}
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-3xs uppercase tracking-wider font-extrabold text-slate-400 block">Outstanding Arrears</span>
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-black text-rose-600">
              {currency} {outstanding?.total.toLocaleString()}
            </span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content sections split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP PAYING CLIENTS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Top Paying WiFi Subscribers</h2>
                <p className="text-xs text-slate-400">Top subscribers ordered by high lifetime payment collections.</p>
              </div>
              <button
                onClick={handleExportTopClientsCSV}
                title="Export Clients CSV"
                className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition no-print inline-flex items-center gap-1 text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {topClients.map((client, idx) => (
                <div key={client.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-extrabold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{client.name}</h4>
                      <p className="text-2xs text-slate-400 mt-0.5">{client.phone} | {client.payment_count} payments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-600 text-sm">
                      {currency} {client.total_paid.toLocaleString()}
                    </span>
                    <span className="text-3xs text-slate-400 block uppercase font-bold">Paid Lifetime</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OUTSTANDING ARREARS CLIENTS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Arrears / Unpaid Accounts</h2>
                <p className="text-xs text-slate-400">Clients with unpaid monthly invoices or expired billing periods.</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {outstanding?.clients.length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-sm">Perfect billing ledger! All dues cleared.</p>
              ) : (
                outstanding?.clients.map((client, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">{client.name}</h4>
                        <p className="text-2xs text-slate-400 mt-0.5">{client.phone} | {client.invoice_count} unpaid bills</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-rose-600 text-sm">
                        {currency} {client.total_due.toLocaleString()}
                      </span>
                      <span className="text-3xs text-slate-400 block uppercase font-bold">Outstanding</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Router shop performance & Repair metrics split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Shop Sales bar chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Router Terminal Sales Performance</h2>
            <p className="text-xs text-slate-400">Total revenue generated by hardware inventory items.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, "Amount"]} />
                <Legend iconType="circle" />
                <Bar dataKey="revenue" fill="#3b82f6" name="Total Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#10b981" name="Net Profit margin" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Repair stats Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Repair Task Status Audit</h2>
            <p className="text-xs text-slate-400">Breakdown of support tickets filed.</p>
          </div>
          <div className="h-44 relative flex justify-center items-center">
            {repairStats.length === 0 ? (
              <p className="text-slate-400 text-sm text-center">No repair history rows.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={repairStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                    >
                      {repairStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [`${val} Tickets`, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800">
                    {repairStats.reduce((acc, curr) => acc + curr.count, 0)}
                  </span>
                  <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">Total Tickets</span>
                </div>
              </>
            )}
          </div>
          {/* Legend */}
          <div className="mt-4 space-y-2 text-xs font-semibold">
            {repairStats.map((stat, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-slate-600">{stat.status}</span>
                </div>
                <span className="text-slate-700 font-bold">{stat.count} tickets</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
