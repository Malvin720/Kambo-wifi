import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Payment, Client, Invoice } from "../types";
import {
  Plus,
  Search,
  FileText,
  DollarSign,
  Calendar,
  CreditCard,
  User as UserIcon,
  Loader2,
  AlertTriangle,
  X,
  Printer,
  CheckCircle,
  Clock,
  Check
} from "lucide-react";

interface PaymentsProps {
  currency: string;
  businessName: string;
  phone: string;
  mpesaNumber: string;
  onTabChange: (tab: string) => void;
}

export default function Payments({ currency, businessName, phone, mpesaNumber, onTabChange }: PaymentsProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sub-tabs
  const [subTab, setSubTab] = useState<"history" | "overdue">("history");

  // Receipt Modal
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);

  // Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState<"M-Pesa" | "Cash" | "Bank">("M-Pesa");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Search filter
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      const paymentList = await api.payments.getAll();
      const clientList = await api.clients.getAll();
      const overdueList = await api.payments.getOverdue();
      setPayments(paymentList);
      setClients(clientList);
      setOverdueInvoices(overdueList);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch billing and payments data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When a client is selected in recording payment, automatically pre-fill monthly price
  const handleClientSelectChange = (idStr: string) => {
    setClientId(idStr);
    const selectedCli = clients.find(c => c.id.toString() === idStr);
    if (selectedCli) {
      setAmount(selectedCli.monthly_price.toString());
    }
  };

  const handleOpenForm = () => {
    setClientId(clients[0]?.id.toString() || "");
    setAmount(clients[0]?.monthly_price.toString() || "0");
    setDate(new Date().toISOString().split("T")[0]);
    setMethod("M-Pesa");
    setReferenceNumber("");
    setSubmitError("");
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !amount || !date || !method || !referenceNumber) {
      setSubmitError("All fields are strictly required.");
      return;
    }

    setSaving(true);
    setSubmitError("");

    try {
      await api.payments.create({
        client_id: Number(clientId),
        amount: Number(amount),
        date,
        method,
        reference_number: referenceNumber,
      });
      setIsFormOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const filteredPayments = payments.filter(
    (pay) =>
      pay.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      pay.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
      pay.client_phone?.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Billing & Payments</h1>
          <p className="text-sm text-slate-500">Record cash collections, generate official invoice receipts and monitor overdue clients.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onTabChange("stk-push")}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/10 transition text-sm"
          >
            <CreditCard className="w-4 h-4" />
            Safaricom M-Pesa STK
          </button>
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/10 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Record Cash / Bank Pay
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-semibold rounded-r-xl">
          {error}
        </div>
      )}

      {/* Sub Tabs Toggle (History vs Overdue Alerts) */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setSubTab("history")}
          className={`pb-3 text-sm font-bold tracking-tight transition border-b-2 ${
            subTab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Payment Collections ({payments.length})
        </button>
        <button
          onClick={() => setSubTab("overdue")}
          className={`pb-3 text-sm font-bold tracking-tight transition border-b-2 flex items-center gap-1.5 ${
            subTab === "overdue"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-400 hover:text-amber-600"
          }`}
        >
          Overdue Clients Alert ({overdueInvoices.length})
          {overdueInvoices.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm">Collating ledger transaction rows...</p>
        </div>
      ) : subTab === "history" ? (
        <div className="space-y-4">
          {/* Search bar inside payments history */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search payments by Client name, phone or M-Pesa ref..."
                className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-800 transition"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium">No payments matching query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Subscriber Name</th>
                      <th className="px-6 py-4">Transaction Reference</th>
                      <th className="px-6 py-4">Payment Date</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Amount Paid</th>
                      <th className="px-6 py-4 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                    {filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-extrabold text-slate-800 block">{pay.client_name}</span>
                            <span className="text-2xs text-slate-400 block mt-0.5">{pay.client_phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                            {pay.reference_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {pay.date}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                            {pay.method === "M-Pesa" ? "Safaricom M-Pesa" : pay.method}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-emerald-600 font-extrabold">
                            +{currency} {pay.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedPaymentForReceipt(pay)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-800 rounded-lg transition inline-flex items-center gap-1"
                            title="Generate Receipt Invoice"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-xs font-bold">Print</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {overdueInvoices.length === 0 ? (
            <div className="text-center py-20 bg-slate-50/50">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="text-slate-700 text-base font-bold">Zero Outstanding Balances!</p>
              <p className="text-slate-400 text-xs mt-1">All subscribers have paid their monthly WiFi invoice.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Invoice Number</th>
                    <th className="px-6 py-4">Address / Estate</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Overdue Sum</th>
                    <th className="px-6 py-4">Alert Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                  {overdueInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-extrabold text-slate-800 block">{inv.client_name}</span>
                          <span className="text-2xs text-slate-400 mt-0.5">{inv.client_phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {inv.estate}, {inv.house_number}
                      </td>
                      <td className="px-6 py-4 text-rose-500 flex items-center gap-1.5 pt-6">
                        <Clock className="w-4 h-4 shrink-0" />
                        {inv.due_date}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-red-600 font-extrabold">
                          {currency} {inv.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 animate-pulse">
                          ⚠️ Action Required
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RECORD CASH / BANK PAYMENT DIALOG */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">Record Client Payment</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-r-lg">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Subscriber *
                </label>
                <select
                  value={clientId}
                  onChange={(e) => handleClientSelectChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                >
                  {clients.map((cli) => (
                    <option key={cli.id} value={cli.id}>
                      {cli.name} ({cli.phone} - {cli.estate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Received Amount *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    {currency}
                  </span>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Collection Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Payment Method *
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                  >
                    <option value="M-Pesa">Safaricom M-Pesa</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Bank">Bank Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Ref Number / Receipt ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. QRA87HJY62"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL BILLING RECEIPT MODAL (PRINT-FRIENDLY) */}
      {selectedPaymentForReceipt && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header Controls (Not Printed) */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <span className="font-bold text-slate-500 text-xs uppercase tracking-wider">
                Official Billing Receipt
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setSelectedPaymentForReceipt(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Receipt Printable Area */}
            <div id="receipt-print-container" className="p-10 overflow-y-auto space-y-8 bg-white text-slate-800 font-sans flex-1">
              {/* Branding and Receipt Details */}
              <div className="flex justify-between items-start border-b border-dashed border-slate-200 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-blue-600 tracking-tight">{businessName}</h2>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Reliable High-Speed Fiber Internet</p>
                  <p className="text-2xs text-slate-400 font-mono">Owner: Peter Kambo | M-Pesa: {mpesaNumber}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-extrabold uppercase mb-2">
                    Paid Invoice
                  </span>
                  <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Receipt No</p>
                  <p className="font-mono text-sm font-black text-slate-700">REC-KM-{selectedPaymentForReceipt.id}</p>
                </div>
              </div>

              {/* Client Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div>
                  <span className="text-3xs text-slate-400 uppercase font-bold block">Bill To</span>
                  <span className="text-sm font-extrabold text-slate-800 block mt-0.5">
                    {selectedPaymentForReceipt.client_name}
                  </span>
                  <span className="text-slate-500 block mt-1">Phone: {selectedPaymentForReceipt.client_phone}</span>
                </div>
                <div className="text-right">
                  <span className="text-3xs text-slate-400 uppercase font-bold block">Transaction Details</span>
                  <p className="text-slate-600 mt-0.5">Date: {selectedPaymentForReceipt.date}</p>
                  <p className="font-mono text-slate-600 mt-0.5">Ref ID: {selectedPaymentForReceipt.reference_number}</p>
                  <p className="text-slate-600 mt-0.5">Method: {selectedPaymentForReceipt.method}</p>
                </div>
              </div>

              {/* Invoice Ledger Item */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-6 text-xs">
                <div className="bg-slate-50 px-4 py-3 font-bold border-b border-slate-200 grid grid-cols-3">
                  <span>WiFi Package Details</span>
                  <span className="text-center">Speed (Tariff)</span>
                  <span className="text-right">Amount Billed</span>
                </div>
                <div className="px-4 py-4 grid grid-cols-3 font-medium text-slate-600 border-b border-slate-100 items-center">
                  <div>
                    <span className="font-bold text-slate-800 text-sm block">Unlimited Internet Access</span>
                    <span className="text-3xs text-slate-400 mt-0.5 block">Standard monthly broadband license</span>
                  </div>
                  <span className="text-center font-bold text-slate-700">Broadband</span>
                  <span className="text-right font-extrabold text-slate-800">
                    {currency} {selectedPaymentForReceipt.amount.toLocaleString()}.00
                  </span>
                </div>

                {/* Summaries */}
                <div className="px-4 py-4 bg-slate-50/50 space-y-1.5 text-right font-semibold text-slate-500">
                  <div className="flex justify-between max-w-xs ml-auto">
                    <span>Subtotal:</span>
                    <span className="text-slate-800">
                      {currency} {selectedPaymentForReceipt.amount.toLocaleString()}.00
                    </span>
                  </div>
                  <div className="flex justify-between max-w-xs ml-auto text-xs font-bold text-slate-800 border-t border-slate-200 pt-1.5">
                    <span>Total Settled:</span>
                    <span className="text-emerald-600 font-black">
                      {currency} {selectedPaymentForReceipt.amount.toLocaleString()}.00
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Stamp / Terms */}
              <div className="border-t border-dashed border-slate-200 pt-6 text-center space-y-3 mt-10">
                <p className="text-xs font-semibold text-slate-600 italic">
                  "Thank you for choosing Kambo WiFi. We appreciate your partnership!"
                </p>
                <p className="text-3xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  For support queries, signal drops, or router upgrades, contact customer support at {phone} or visit Kambo offices.
                </p>
                <div className="pt-6 flex justify-between items-end text-3xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>SYSTEM REGISTERED INVOICE</span>
                  <span className="border-t border-slate-300 w-32 pt-1">Authorized signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
