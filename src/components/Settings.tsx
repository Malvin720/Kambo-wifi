import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Settings as SettingsType } from "../types";
import {
  Settings as SettingsIcon,
  Loader2,
  X,
  Phone,
  DollarSign,
  Building,
  Image,
  Percent,
  Check,
  Moon,
  Sun,
  Lock,
  KeyRound
} from "lucide-react";

interface SettingsProps {
  onSettingsUpdate: (settings: SettingsType) => void;
  currency: string;
}

export default function Settings({ onSettingsUpdate, currency }: SettingsProps) {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Business settings state
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [settingCurrency, setSettingCurrency] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Password reset state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [saving, setSaving] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.settings.get();
        if (data) {
          setSettings(data);
          setBusinessName(data.business_name);
          setPhoneNumber(data.phone_number);
          setMpesaNumber(data.mpesa_number);
          setLogoUrl(data.logo_url || "");
          setTaxRate(data.tax_rate.toString());
          setSettingCurrency(data.currency);
          setDarkMode(data.dark_mode === 1);
        }
        setError("");
      } catch (err) {
        setError("Failed to load settings rows.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !phoneNumber || !mpesaNumber || !settingCurrency) {
      setError("Please fill in all core fields.");
      return;
    }

    setSaving(true);
    setError("");
    setSubmitSuccess(false);

    try {
      const updatedData = {
        business_name: businessName,
        phone_number: phoneNumber,
        mpesa_number: mpesaNumber,
        logo_url: logoUrl,
        tax_rate: Number(taxRate || 0),
        currency: settingCurrency,
        dark_mode: darkMode ? 1 : 0,
      };

      await api.settings.update(updatedData);
      
      // Update parent component state instantly
      onSettingsUpdate({
        id: settings?.id || 1,
        ...updatedData
      });

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update business settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 5) {
      setPasswordError("New password must be at least 5 characters long.");
      return;
    }

    setSaving(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      await api.auth.changePassword(oldPassword, newPassword);
      setPasswordSuccess("Admin password updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
        <p className="text-slate-500 font-medium">Assembling configurations panels...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Portal Configurations</h1>
        <p className="text-sm text-slate-500">Configure business coordinates, currency mappings, tax percentages, and credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Core Settings Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm md:col-span-3">
          <div className="flex items-center gap-2 text-blue-600 font-bold border-b border-slate-100 pb-4 mb-5">
            <Building className="w-5 h-5" />
            <h2>Business Particulars</h2>
          </div>

          {submitSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs font-semibold rounded-r-lg flex items-center gap-1">
              <Check className="w-4 h-4" />
              Settings updated successfully!
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-r-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Business / ISP Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Support Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  M-Pesa Express Number *
                </label>
                <input
                  type="text"
                  required
                  value={mpesaNumber}
                  onChange={(e) => setMpesaNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Currency Symbol *
                </label>
                <input
                  type="text"
                  required
                  value={settingCurrency}
                  onChange={(e) => setSettingCurrency(e.target.value)}
                  placeholder="e.g. KES, USD"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  VAT / KRA Tax Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                    <Percent className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Simulate Dark Mode Theme
                </label>
                <button
                  type="button"
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border transition ${
                    darkMode
                      ? "bg-slate-900 text-yellow-400 border-slate-950 hover:bg-slate-800"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {darkMode ? (
                    <>
                      <Sun className="w-4 h-4 text-yellow-400" /> Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-slate-500" /> Dark Mode
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Brand Logo URL Image
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="e.g. https://kambowifi.co.ke/assets/logo.png"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/10 transition flex items-center justify-center gap-1.5 mt-4"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Configuration Settings
            </button>
          </form>
        </div>

        {/* Change Password Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm md:col-span-2 space-y-5">
          <div className="flex items-center gap-2 text-slate-700 font-bold border-b border-slate-100 pb-4 mb-5">
            <Lock className="w-5 h-5" />
            <h2>Security Credentials</h2>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs font-semibold rounded-r-lg flex items-center gap-1">
              <Check className="w-4 h-4" />
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-r-lg">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Type old password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                New Password *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 5 characters"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <KeyRound className="w-3.5 h-3.5" />
              Update Account Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
