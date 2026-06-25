import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Repair, Client } from "../types";
import {
  Wrench,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Briefcase,
  User as UserIcon,
  Phone
} from "lucide-react";

export default function Repairs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);

  // Form State
  const [clientId, setClientId] = useState("");
  const [problem, setProblem] = useState("");
  const [technician, setTechnician] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<"Pending" | "Assigned" | "In Progress" | "Completed">("Pending");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchData = async () => {
    try {
      const repairList = await api.repairs.getAll();
      const clientList = await api.clients.getAll();
      setRepairs(repairList);
      setClients(clientList);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch fiber repair tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOpen = () => {
    setSelectedRepair(null);
    setClientId(clients[0]?.id.toString() || "");
    setProblem("");
    setTechnician("");
    setDate(new Date().toISOString().split("T")[0]);
    setStatus("Pending");
    setNotes("");
    setSubmitError("");
    setIsModalOpen(true);
  };

  const handleEditOpen = (rep: Repair) => {
    setSelectedRepair(rep);
    setClientId(rep.client_id.toString());
    setProblem(rep.problem);
    setTechnician(rep.technician);
    setDate(rep.date);
    setStatus(rep.status);
    setNotes(rep.notes || "");
    setSubmitError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !problem || !technician || !date || !status) {
      setSubmitError("All core repair fields are required.");
      return;
    }

    setSaving(true);
    setSubmitError("");

    try {
      const repairData = {
        client_id: Number(clientId),
        problem,
        technician,
        date,
        status,
        notes,
      };

      if (selectedRepair) {
        await api.repairs.update(selectedRepair.id, repairData);
      } else {
        await api.repairs.create(repairData);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to record repair log.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRepair = async (id: number) => {
    if (!confirm("Are you sure you want to delete this repair ticket?")) return;

    try {
      await api.repairs.delete(id);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete repair log.");
    }
  };

  const getStatusStyle = (statusStr: string) => {
    switch (statusStr) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      case "Assigned":
        return "bg-blue-50 text-blue-700 border border-blue-100";
      case "In Progress":
        return "bg-indigo-50 text-indigo-700 border border-indigo-100";
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Repairs & Maintenance</h1>
          <p className="text-sm text-slate-500">Track and dispatch network engineers for fiber cuts, speed drops, and router resets.</p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/10 transition"
        >
          <Plus className="w-5 h-5" />
          Create Repair Ticket
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-semibold rounded-r-xl">
          {error}
        </div>
      )}

      {/* Main Repair Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm">Mapping subscriber fiber networks...</p>
        </div>
      ) : repairs.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-base font-medium">No open repair tickets registered.</p>
          <p className="text-slate-400 text-xs mt-1">Uptime is healthy across all Kambo WiFi estate drops!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repairs.map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 hover:shadow-md transition duration-200 relative flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Header status and date */}
                <div className="flex justify-between items-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusStyle(rep.status)}`}>
                    ● {rep.status}
                  </span>
                  <span className="text-2xs text-slate-400 font-bold">{rep.date}</span>
                </div>

                {/* Client Info */}
                <div>
                  <span className="text-3xs uppercase text-slate-400 font-bold block">Subscriber</span>
                  <h4 className="font-extrabold text-slate-800 text-base">{rep.client_name}</h4>
                  <p className="text-2xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    {rep.client_phone} | {rep.estate} {rep.house_number}
                  </p>
                </div>

                {/* Issue Problem */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                  <span className="text-3xs uppercase text-slate-400 font-bold block">Reported Fault</span>
                  <p className="text-xs text-slate-700 font-bold mt-1 leading-relaxed">
                    "{rep.problem}"
                  </p>
                </div>

                {/* Tech Assigned */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                  Technician: <span className="text-blue-600 font-extrabold">{rep.technician}</span>
                </div>

                {/* Notes */}
                {rep.notes && (
                  <div>
                    <span className="text-3xs uppercase text-slate-400 font-bold block">Ops Notes</span>
                    <p className="text-2xs text-slate-500 mt-1 italic leading-normal">
                      {rep.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-2.5 mt-4">
                <button
                  onClick={() => handleEditOpen(rep)}
                  className="flex-1 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Ticket
                </button>
                <button
                  onClick={() => handleDeleteRepair(rep.id)}
                  className="p-1.5 border border-red-50 hover:bg-red-50 text-red-500 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REPAIR FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">
                {selectedRepair ? "Edit Repair Ticket" : "File Repair Ticket"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
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
                  Affected Subscriber *
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
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
                  Problem Description *
                </label>
                <input
                  type="text"
                  required
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="e.g. Red light LOS blinking on ONT modem"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Assigned Technician / Team *
                </label>
                <input
                  type="text"
                  required
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  placeholder="e.g. Charles Tech Team"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Logged Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Repair Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                  >
                    <option value="Pending">Pending Assignment</option>
                    <option value="Assigned">Assigned Technician</option>
                    <option value="In Progress">Maintenance In-Progress</option>
                    <option value="Completed">Completed / Signals Restored</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Resolution / Field Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cleared ONT dust port, replaced fiber patch cord SC/APC..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  {selectedRepair ? "Update Ticket" : "File Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
