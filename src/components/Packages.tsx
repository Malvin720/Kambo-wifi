import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Package } from "../types";
import { Plus, Edit2, Trash2, Wifi, Loader2, DollarSign, Activity, Settings, X, Check } from "lucide-react";

interface PackagesProps {
  currency: string;
}

export default function Packages({ currency }: PackagesProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [speedMbps, setSpeedMbps] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchPackages = async () => {
    try {
      const data = await api.packages.getAll();
      setPackages(data);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch packages lists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreateOpen = () => {
    setSelectedPkg(null);
    setName("");
    setSpeedMbps("");
    setPrice("");
    setSubmitError("");
    setIsModalOpen(true);
  };

  const handleEditOpen = (pkg: Package) => {
    setSelectedPkg(pkg);
    setName(pkg.name);
    setSpeedMbps(pkg.speed_mbps.toString());
    setPrice(pkg.price.toString());
    setSubmitError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !speedMbps || !price) {
      setSubmitError("All fields are required.");
      return;
    }

    setSaving(true);
    setSubmitError("");

    try {
      const pkgData = {
        name,
        speed_mbps: Number(speedMbps),
        price: Number(price),
      };

      if (selectedPkg) {
        await api.packages.update(selectedPkg.id, pkgData);
      } else {
        await api.packages.create(pkgData);
      }
      setIsModalOpen(false);
      await fetchPackages();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to save package plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePkg = async (id: number) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      await api.packages.delete(id);
      await fetchPackages();
    } catch (err: any) {
      alert(err.message || "Failed to delete package.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">WiFi Subscription Plans</h1>
          <p className="text-sm text-slate-500 font-medium">Configure speed capabilities and pricing models for client plans.</p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-full font-black text-xs tracking-wider uppercase shadow-lg shadow-blue-200 transition-all"
        >
          <Plus className="w-4.5 h-4.5" />
          Create New Plan
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold uppercase tracking-wide rounded-r-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm">Synchronizing tariff records...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition duration-200"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-8 text-white text-center relative">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-lg translate-x-4 -translate-y-4"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full blur-md -translate-x-3 translate-y-3"></div>
                
                <span className="text-xs uppercase tracking-wider font-extrabold text-blue-100 block mb-1">
                  Kambo WiFi
                </span>
                <h3 className="text-xl font-black">{pkg.name}</h3>
                
                {/* Speed display */}
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full backdrop-blur-xs text-xs font-bold text-emerald-300">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  {pkg.speed_mbps} Mbps Bandwidth
                </div>
              </div>

              {/* Price Content */}
              <div className="p-6 text-center bg-slate-50/50 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tariff Rate</span>
                  <div className="mt-1 flex items-baseline justify-center text-slate-800">
                    <span className="text-xl font-bold">{currency}</span>
                    <span className="text-3xl font-extrabold ml-1">{pkg.price.toLocaleString()}</span>
                    <span className="text-slate-400 text-sm font-semibold ml-1">/ month</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm text-slate-600 text-left border-t border-slate-100 pt-5">
                    <li className="flex items-center gap-2 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Unlimited high-speed internet
                    </li>
                    <li className="flex items-center gap-2 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Free installation & fiber drops
                    </li>
                    <li className="flex items-center gap-2 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      24/7 dedicated technician support
                    </li>
                  </ul>
                </div>

                {/* Plan Operations */}
                <div className="mt-8 pt-5 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => handleEditOpen(pkg)}
                    className="flex-1 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Modify Plan
                  </button>
                  <button
                    onClick={() => handleDeletePkg(pkg.id)}
                    className="p-2 border border-red-100 hover:border-red-200 text-red-500 hover:bg-red-50 rounded-xl transition"
                    title="Delete Tariff Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">
                {selectedPkg ? "Edit Tariff Plan" : "Create Tariff Plan"}
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
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Premium HighSpeed"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Bandwidth (Mbps Speed) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={speedMbps}
                    onChange={(e) => setSpeedMbps(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full pr-14 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs font-bold">
                    Mbps
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Monthly Rate Price *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    {currency}
                  </span>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                </div>
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
                  {selectedPkg ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
