import { useEffect, useState } from "react";
import { api } from "./api";
import { Settings as SettingsType } from "./types";
import {
  Wifi,
  Users,
  CreditCard,
  Wrench,
  ShoppingBag,
  BarChart,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Bell,
  Layers,
  User as UserIcon,
  KeyRound,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

// Components
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Clients from "./components/Clients";
import Packages from "./components/Packages";
import Payments from "./components/Payments";
import MpesaPush from "./components/MpesaPush";
import Repairs from "./components/Repairs";
import RouterShop from "./components/RouterShop";
import Reports from "./components/Reports";
import Settings from "./components/Settings";

export default function App() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Notifications badge counts
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Check login session & settings on mount
  useEffect(() => {
    const initApp = async () => {
      if (api.auth.isLoggedIn()) {
        const currentUser = api.auth.getUser();
        setUser(currentUser);
        try {
          const bizSettings = await api.settings.get();
          if (bizSettings) setSettings(bizSettings);

          // Get initial notifications
          const notifs = await api.notifications.getAll();
          setUnreadNotifCount(notifs.filter((n) => n.read === 0).length);
        } catch (err) {
          console.error("Failed to initialize app settings:", err);
        }
      }
      setLoading(false);
    };
    initApp();
  }, []);

  // Sync state when tab changes
  const handleTabChange = (tabName: string) => {
    setCurrentTab(tabName);
    setMobileMenuOpen(false);
    
    // Periodically fetch notification count
    api.notifications.getAll().then((notifs) => {
      setUnreadNotifCount(notifs.filter((n) => n.read === 0).length);
    }).catch(() => {});
  };

  const handleLoginSuccess = async (loggedInUser: { id: number; username: string }) => {
    setUser(loggedInUser);
    setLoading(true);
    try {
      const bizSettings = await api.settings.get();
      if (bizSettings) setSettings(bizSettings);
      const notifs = await api.notifications.getAll();
      setUnreadNotifCount(notifs.filter((n) => n.read === 0).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out from Kambo WiFi Management Portal?")) {
      api.auth.logout();
      setUser(null);
      setCurrentTab("dashboard");
    }
  };

  const handleSettingsUpdate = (updatedSettings: SettingsType) => {
    setSettings(updatedSettings);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Wifi className="w-12 h-12 text-blue-600 animate-pulse mx-auto" />
          <p className="text-slate-600 font-extrabold tracking-tight text-lg">Kambo WiFi ISP Platform</p>
          <p className="text-slate-400 text-xs">Synchronizing database assets...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render Login Portal
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Get current settings values (fallbacks to default Kenyan ISP values)
  const businessName = settings?.business_name || "Kambo WiFi";
  const phone = settings?.phone_number || "0795 099525";
  const mpesaNumber = settings?.mpesa_number || "0795 099525";
  const currency = settings?.currency || "KES";
  const isDarkModeSimulated = settings?.dark_mode === 1;

  // Navigation Items
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart },
    { id: "clients", label: "Clients Directory", icon: Users },
    { id: "packages", label: "WiFi Packages", icon: ShieldCheck },
    { id: "payments", label: "Billing & Ledger", icon: CreditCard },
    { id: "stk-push", label: "M-Pesa Express", icon: Wifi, badge: false },
    { id: "repairs", label: "Repairs Faults", icon: Wrench },
    { id: "router-shop", label: "Router Shop", icon: ShoppingBag },
    { id: "reports", label: "Financial Reports", icon: BarChart },
    { id: "settings", label: "Settings Portal", icon: SettingsIcon },
  ];

  return (
    <div className={`min-h-screen flex ${isDarkModeSimulated ? "bg-slate-950 text-slate-100 dark-mode-override" : "bg-slate-50 text-slate-800"}`}>
      {/* 1. SIDEBAR NAVIGATION - DESKTOP VIEW */}
      <aside className="w-64 bg-blue-900 flex-shrink-0 flex flex-col border-r border-blue-800">
        {/* Sidebar Header Brand */}
        <div className="p-6 border-b border-blue-800">
          <h1 className="text-2xl font-black tracking-tighter text-white">
            {businessName.toUpperCase().includes("WIFI") ? (
              <>
                {businessName.toUpperCase().replace("WIFI", "")}
                <span className="text-emerald-400">WIFI</span>
              </>
            ) : (
              businessName.toUpperCase()
            )}
          </h1>
          <p className="text-[10px] text-blue-300 uppercase tracking-widest font-bold mt-1">Management System v2.1</p>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold tracking-tight transition-all duration-150 ${
                  isActive
                    ? "bg-blue-800 text-white shadow-lg shadow-blue-950/20"
                    : "text-blue-200 hover:bg-blue-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="font-semibold">{item.label}</span>
                </div>
                {item.id === "dashboard" && unreadNotifCount > 0 && (
                  <span className="bg-red-500 text-white font-black text-3xs px-2 py-0.5 rounded-full animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (Admin session info) */}
        <div className="p-6 border-t border-blue-800 mt-auto">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-black text-blue-900">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight capitalize">{user.username}</p>
              <p className="text-xs text-blue-300">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-800/50 hover:bg-red-900/50 text-blue-200 hover:text-white text-xs font-bold rounded-xl border border-blue-700/50 transition-all duration-150"
          >
            <LogOut className="w-4.5 h-4.5" />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* 2. MAIN LAYOUT AND RESPONSIVE SHELL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top bar header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-10 no-print">
          {/* Mobile menu and Brand trigger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-blue-600 animate-pulse" />
              <span className="font-extrabold text-sm text-slate-800 uppercase">{businessName}</span>
            </div>
          </div>

          {/* Desktop status details */}
          <div className="hidden lg:flex items-center space-x-4">
            <span className="text-slate-400 font-medium capitalize">{currentTab.replace("-", " ")} Overview</span>
            <span className="text-slate-200">/</span>
            <span className="text-blue-600 font-bold tracking-tight italic">Daily Insights</span>
          </div>

          {/* User badge and Actions */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              {unreadNotifCount > 0 ? (
                <button
                  onClick={() => handleTabChange("dashboard")}
                  className="relative p-2 text-slate-400 hover:text-slate-600 transition"
                >
                  <Bell className="w-5 h-5 text-blue-600" />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                </button>
              ) : (
                <div className="p-2 text-slate-400">
                  <Bell className="w-5 h-5" />
                </div>
              )}
            </div>
            <button 
              onClick={() => handleTabChange("stk-push")}
              className="bg-blue-700 text-white px-5 py-2 rounded-full font-black text-xs tracking-wider uppercase hover:bg-blue-800 transition-all shadow-lg shadow-blue-200"
            >
              Initiate STK Push
            </button>
          </div>
        </header>

        {/* 3. MOBILE OVERLAY SIDEBAR */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden animate-fade-in no-print">
            <div className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}></div>
            <nav className={`fixed inset-y-0 left-0 w-64 p-6 flex flex-col justify-between ${
              isDarkModeSimulated ? "bg-slate-900" : "bg-white"
            }`}>
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="font-black text-blue-600">{businessName}</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold tracking-tight transition ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                Logout Session
              </button>
            </nav>
          </div>
        )}

        {/* 4. DYNAMIC VIEW PORT STAGE */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8 max-w-7xl w-full mx-auto pb-20">
          {currentTab === "dashboard" && <Dashboard onTabChange={handleTabChange} currency={currency} />}
          {currentTab === "clients" && <Clients currency={currency} />}
          {currentTab === "packages" && <Packages currency={currency} />}
          {currentTab === "payments" && (
            <Payments
              currency={currency}
              businessName={businessName}
              phone={phone}
              mpesaNumber={mpesaNumber}
              onTabChange={handleTabChange}
            />
          )}
          {currentTab === "stk-push" && <MpesaPush currency={currency} mpesaNumber={mpesaNumber} />}
          {currentTab === "repairs" && <Repairs />}
          {currentTab === "router-shop" && <RouterShop currency={currency} />}
          {currentTab === "reports" && <Reports currency={currency} />}
          {currentTab === "settings" && (
            <Settings onSettingsUpdate={handleSettingsUpdate} currency={currency} />
          )}
        </main>
      </div>
    </div>
  );
}
