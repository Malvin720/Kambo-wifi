import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Client, Package } from "../types";
import { Map, Marker } from "pigeon-maps";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  AlertTriangle,
  X,
  Loader2,
  Globe,
  Wifi,
  FileSpreadsheet,
  Check,
  AlertCircle
} from "lucide-react";

interface ClientsProps {
  currency: string;
}

export default function Clients({ currency }: ClientsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [packageFilter, setPackageFilter] = useState("");

  // Modal control
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [estate, setEstate] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [gpsLocation, setGpsLocation] = useState("");
  const [packageId, setPackageId] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [status, setStatus] = useState<"active" | "suspended" | "offline">("active");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Map View States
  const [viewMode, setViewMode] = useState<"table" | "map">("table");
  const [activeClientOnMap, setActiveClientOnMap] = useState<Client | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-1.19, 36.91]);
  const [mapZoom, setMapZoom] = useState<number>(12);

  const parseGps = (gpsStr: string | undefined): [number, number] | null => {
    if (!gpsStr) return null;
    const parts = gpsStr.split(",");
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (isNaN(lat) || isNaN(lng)) return null;
    return [lat, lng];
  };

  const fetchClientsAndPackages = async () => {
    try {
      const clientList = await api.clients.getAll({
        search: search,
        status: statusFilter,
        package_id: packageFilter,
      });
      const packageList = await api.packages.getAll();
      setClients(clientList);
      setPackages(packageList);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch clients or package data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsAndPackages();
  }, [search, statusFilter, packageFilter]);

  // Handle opening form modal for create
  const handleCreateOpen = () => {
    setSelectedClient(null);
    setName("");
    setPhone("");
    setNationalId("");
    setEstate("");
    setHouseNumber("");
    setGpsLocation("");
    setPackageId(packages[0]?.id.toString() || "");
    setMonthlyPrice(packages[0]?.price.toString() || "0");
    setInstallationDate(new Date().toISOString().split("T")[0]);
    setStatus("active");
    setNotes("");
    setSubmitError("");
    setIsFormOpen(true);
  };

  // Handle opening form modal for edit
  const handleEditOpen = (client: Client) => {
    setSelectedClient(client);
    setName(client.name);
    setPhone(client.phone);
    setNationalId(client.national_id);
    setEstate(client.estate);
    setHouseNumber(client.house_number);
    setGpsLocation(client.gps_location || "");
    setPackageId(client.package_id?.toString() || "");
    setMonthlyPrice(client.monthly_price.toString());
    setInstallationDate(client.installation_date);
    setStatus(client.status);
    setNotes(client.notes || "");
    setSubmitError("");
    setIsFormOpen(true);
  };

  // When package selection changes, pre-fill monthly price
  const handlePackageChange = (idStr: string) => {
    setPackageId(idStr);
    const selectedPkg = packages.find(p => p.id.toString() === idStr);
    if (selectedPkg) {
      setMonthlyPrice(selectedPkg.price.toString());
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !nationalId || !estate || !houseNumber || !monthlyPrice || !installationDate) {
      setSubmitError("All fields except GPS Location and Notes are strictly required.");
      return;
    }

    setSaving(true);
    setSubmitError("");

    const clientData = {
      name,
      phone,
      national_id: nationalId,
      estate,
      house_number: houseNumber,
      gps_location: gpsLocation,
      package_id: packageId ? Number(packageId) : null,
      monthly_price: Number(monthlyPrice),
      installation_date: installationDate,
      status,
      notes,
    };

    try {
      if (selectedClient) {
        await api.clients.update(selectedClient.id, clientData);
      } else {
        await api.clients.create(clientData);
      }
      setIsFormOpen(false);
      await fetchClientsAndPackages();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to save client details.");
    } finally {
      setSaving(false);
    }
  };

  // Delete control
  const handleDeleteOpen = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;
    setSaving(true);
    try {
      await api.clients.delete(selectedClient.id);
      setIsDeleteOpen(false);
      setSelectedClient(null);
      await fetchClientsAndPackages();
    } catch (err: any) {
      console.error(err);
      setError("Failed to delete client record.");
    } finally {
      setSaving(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(clients.length / itemsPerPage);
  const currentClients = clients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: "active" | "suspended" | "offline") => {
    switch (status) {
      case "active":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">● Active</span>;
      case "suspended":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">● Suspended</span>;
      case "offline":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">● Offline</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">WiFi Clients</h1>
          <p className="text-sm text-slate-500 font-medium">Add, edit, update and search subscriber profiles.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle Segmented Control */}
          <div className="bg-slate-100 p-1 rounded-full flex items-center border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
                viewMode === "table"
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("map");
                // Center map on the first client that has GPS coordinates
                const firstWithGps = clients.find((c) => c.gps_location);
                if (firstWithGps && firstWithGps.gps_location) {
                  const loc = parseGps(firstWithGps.gps_location);
                  if (loc) {
                    setMapCenter(loc);
                    setActiveClientOnMap(firstWithGps);
                    setMapZoom(13);
                  }
                }
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
                viewMode === "map"
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Map View
            </button>
          </div>

          <button
            type="button"
            onClick={handleCreateOpen}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-full font-black text-xs tracking-wider uppercase shadow-lg shadow-blue-200 transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
            Add Subscriber
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold uppercase tracking-wide rounded-r-xl">
          {error}
        </div>
      )}

      {/* Filter and Search Bar Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Name, Phone, ID or Estate..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-800 font-medium transition"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700 font-bold transition"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        {/* WiFi Package Filter */}
        <div className="w-full md:w-48">
          <select
            value={packageFilter}
            onChange={(e) => {
              setPackageFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700 font-bold transition"
          >
            <option value="">All Packages</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} ({pkg.speed_mbps} Mbps)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Panel */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-slate-500 text-sm">Searching subscriber indexes...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-20">
              <Wifi className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-base font-medium">No clients found matching criteria.</p>
              <p className="text-slate-400 text-xs mt-1">Try resetting search string or filtering criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-6 py-4">Client Detail</th>
                    <th className="px-6 py-4">National ID</th>
                    <th className="px-6 py-4">Address & Location</th>
                    <th className="px-6 py-4">Package</th>
                    <th className="px-6 py-4">Cost/Bill</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                  {currentClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-extrabold text-slate-800 text-base block">{client.name}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {client.phone}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                        {client.national_id}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-slate-700 text-sm block">
                            {client.estate}, {client.house_number}
                          </span>
                          {client.gps_location && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${client.gps_location}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-2xs font-bold text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              GPS: {client.gps_location}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-extrabold text-slate-700 block">
                            {client.package_name || "Custom/None"}
                          </span>
                          {client.package_speed && (
                            <span className="text-xs text-slate-400 block mt-0.5">
                              Speed: {client.package_speed} Mbps
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-800">
                          {currency} {client.monthly_price.toLocaleString()}
                        </span>
                        <span className="text-3xs block text-slate-400 font-normal uppercase mt-0.5">
                          Instal: {client.installation_date}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(client.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2.5">
                          <button
                            onClick={() => handleEditOpen(client)}
                            title="Edit Subscriber Profile"
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOpen(client)}
                            title="Delete Subscriber"
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Simple Pagination Footer */}
          {!loading && totalPages > 1 && (
            <div className="bg-slate-50/70 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Showing <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                <span className="font-bold text-slate-700">
                  {Math.min(currentPage * itemsPerPage, clients.length)}
                </span>{" "}
                of <span className="font-bold text-slate-700">{clients.length}</span> subscribers
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:bg-slate-100 rounded-lg transition"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:bg-slate-100 rounded-lg transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row h-[600px]">
          {/* Side Panel for Subscriber Listing */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col h-1/2 lg:h-full bg-slate-50/30">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                Subscribers ({clients.filter((c) => c.gps_location).length})
              </span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                GPS Map View
              </span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {clients.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">No subscribers match</p>
                </div>
              ) : (
                clients.map((client) => {
                  const loc = parseGps(client.gps_location);
                  const hasGps = !!loc;
                  const isActive = activeClientOnMap?.id === client.id;
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        if (loc) {
                          setMapCenter(loc);
                          setMapZoom(14);
                          setActiveClientOnMap(client);
                        }
                      }}
                      disabled={!hasGps}
                      className={`w-full text-left p-4 transition flex flex-col gap-1 text-slate-700 font-medium focus:outline-none ${
                        isActive
                          ? "bg-blue-50/80 border-l-4 border-blue-700"
                          : "hover:bg-slate-50/60 bg-white"
                      } ${!hasGps ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="font-extrabold text-slate-900 text-sm leading-tight block">
                          {client.name}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                          client.status === "active" ? "bg-emerald-500" : client.status === "suspended" ? "bg-amber-500" : "bg-rose-500"
                        }`} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                        <span>{client.estate}</span>
                        {hasGps ? (
                          <span className="text-blue-700 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" /> Locate
                          </span>
                        ) : (
                          <span className="text-slate-400">No GPS</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Interactive OSM Map Panel */}
          <div className="flex-1 relative h-1/2 lg:h-full bg-slate-100">
            <Map
              height={600}
              center={mapCenter}
              zoom={mapZoom}
              onBoundsChanged={({ center, zoom }) => {
                setMapCenter(center);
                setMapZoom(zoom);
              }}
            >
              {clients
                .filter((c) => c.gps_location)
                .map((client) => {
                  const loc = parseGps(client.gps_location);
                  if (!loc) return null;
                  return (
                    <Marker
                      {...({
                        key: client.id,
                        anchor: loc,
                        color:
                          client.status === "active"
                            ? "#10b981"
                            : client.status === "suspended"
                            ? "#f59e0b"
                            : "#f43f5e",
                        onClick: () => {
                          setActiveClientOnMap(client);
                          setMapCenter(loc);
                        }
                      } as any)}
                    />
                  );
                })}
            </Map>

            {/* Map Overlay Info Card */}
            {activeClientOnMap && (
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-200 z-10 animate-fade-in flex flex-col gap-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                      {activeClientOnMap.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {activeClientOnMap.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveClientOnMap(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-xs text-slate-700 font-medium">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                      Location
                    </span>
                    <span className="font-bold text-slate-700 block truncate">
                      {activeClientOnMap.estate}, {activeClientOnMap.house_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                      WiFi Package
                    </span>
                    <span className="font-bold text-slate-700 block truncate">
                      {activeClientOnMap.package_name || "Custom Plan"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                      Billing/Month
                    </span>
                    <span className="font-extrabold text-slate-900 block">
                      {currency} {activeClientOnMap.monthly_price?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                      Status Mode
                    </span>
                    <span className="block mt-0.5">{getStatusBadge(activeClientOnMap.status)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditOpen(activeClientOnMap)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider text-center transition"
                  >
                    Edit Profile
                  </button>
                  {activeClientOnMap.gps_location && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${activeClientOnMap.gps_location}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider text-center transition flex items-center justify-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Directions
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORM DIALOG (ADD & EDIT CLIENT MODAL) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-blue-600 px-6 py-5 text-white flex justify-between items-center shrink-0">
              <h2 className="text-lg font-black tracking-tight">
                {selectedClient ? `Edit Subscriber: ${selectedClient.name}` : "Add New WiFi Subscriber"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {submitError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-r-lg">
                  {submitError}
                </div>
              )}

              {/* 2-column details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Peter Kambo"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0795 099525"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    National ID / Passport *
                  </label>
                  <input
                    type="text"
                    required
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="e.g. 33445566"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Estate / Neighborhood *
                  </label>
                  <input
                    type="text"
                    required
                    value={estate}
                    onChange={(e) => setEstate(e.target.value)}
                    placeholder="e.g. Kahawa Sukari"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    House Number / Villa *
                  </label>
                  <input
                    type="text"
                    required
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="e.g. Block C4, Apt 12"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex justify-between">
                    <span>GPS Coordinates</span>
                    <span className="text-3xs text-slate-400 lowercase italic">lat,lng</span>
                  </label>
                  <input
                    type="text"
                    value={gpsLocation}
                    onChange={(e) => setGpsLocation(e.target.value)}
                    placeholder="e.g. -1.1834,36.9312"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    WiFi Package Plan *
                  </label>
                  <select
                    value={packageId}
                    onChange={(e) => handlePackageChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({pkg.speed_mbps} Mbps - {currency} {pkg.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Monthly Price (override or default) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                      {currency}
                    </span>
                    <input
                      type="number"
                      required
                      value={monthlyPrice}
                      onChange={(e) => setMonthlyPrice(e.target.value)}
                      placeholder="Price per month"
                      className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Installation Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Status Mode *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                  >
                    <option value="active">Active Subscriber</option>
                    <option value="suspended">Suspended (Blocked Access)</option>
                    <option value="offline">Offline (Signal Failure)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  General Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Router in living room, client pays via M-Pesa business..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
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
                  {selectedClient ? "Update Subscriber" : "Save Subscriber"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {isDeleteOpen && selectedClient && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Delete Subscriber</h2>
              <p className="text-slate-500 text-sm mt-2">
                Are you absolutely sure you want to delete <span className="font-bold text-slate-800">{selectedClient.name}</span>?
                This action is permanent and will remove all their payment histories, invoices, and active connection tokens.
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteOpen(false);
                  setSelectedClient(null);
                }}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-500 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={saving}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Yes, Delete Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
