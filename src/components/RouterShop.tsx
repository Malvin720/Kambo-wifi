import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Product, Sale } from "../types";
import {
  Package,
  Plus,
  ShoppingBag,
  Edit2,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  FileText,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight
} from "lucide-react";

interface RouterShopProps {
  currency: string;
}

export default function RouterShop({ currency }: RouterShopProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [subTab, setSubTab] = useState<"inventory" | "sales">("inventory");

  // Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodBrand, setProdBrand] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodBuyingPrice, setProdBuyingPrice] = useState("");
  const [prodSellingPrice, setProdSellingPrice] = useState("");

  // Sale Modal
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleProductId, setSaleProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleCustomerName, setSaleCustomerName] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);

  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchData = async () => {
    try {
      const prodList = await api.products.getAll();
      const salesList = await api.sales.getAll();
      setProducts(prodList);
      setSales(salesList);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch product inventory or router sales rows.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProductOpen = () => {
    setSelectedProduct(null);
    setProdName("");
    setProdBrand("");
    setProdStock("");
    setProdBuyingPrice("");
    setProdSellingPrice("");
    setSubmitError("");
    setIsProductModalOpen(true);
  };

  const handleEditProductOpen = (prod: Product) => {
    setSelectedProduct(prod);
    setProdName(prod.name);
    setProdBrand(prod.brand);
    setProdStock(prod.stock.toString());
    setProdBuyingPrice(prod.buying_price.toString());
    setProdSellingPrice(prod.selling_price.toString());
    setSubmitError("");
    setIsProductModalOpen(true);
  };

  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodBrand || prodStock === "" || !prodBuyingPrice || !prodSellingPrice) {
      setSubmitError("All product fields are required.");
      return;
    }

    setSaving(true);
    setSubmitError("");

    try {
      const prodData = {
        name: prodName,
        brand: prodBrand,
        stock: Number(prodStock),
        buying_price: Number(prodBuyingPrice),
        selling_price: Number(prodSellingPrice),
      };

      if (selectedProduct) {
        await api.products.update(selectedProduct.id, prodData);
      } else {
        await api.products.create(prodData);
      }
      setIsProductModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to save product listing.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await api.products.delete(id);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete product.");
    }
  };

  const handleCreateSaleOpen = () => {
    if (products.length === 0) {
      alert("No products available in inventory.");
      return;
    }
    // Find first product with stock
    const inStockProd = products.find(p => p.stock > 0);
    setSaleProductId(inStockProd ? inStockProd.id.toString() : products[0].id.toString());
    setSaleQuantity("1");
    setSaleCustomerName("");
    setSaleDate(new Date().toISOString().split("T")[0]);
    setSubmitError("");
    setIsSaleModalOpen(true);
  };

  const handleSaleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleProductId || !saleQuantity || !saleCustomerName || !saleDate) {
      setSubmitError("All sale fields are required.");
      return;
    }

    const qty = Number(saleQuantity);
    const prod = products.find(p => p.id.toString() === saleProductId);

    if (!prod) {
      setSubmitError("Selected product not found.");
      return;
    }

    if (prod.stock < qty) {
      setSubmitError(`Only ${prod.stock} units available in inventory. Cannot sell ${qty}.`);
      return;
    }

    setSaving(true);
    setSubmitError("");

    try {
      const totalPrice = prod.selling_price * qty;
      await api.sales.create({
        product_id: prod.id,
        quantity: qty,
        total_price: totalPrice,
        date: saleDate,
        customer_name: saleCustomerName,
      });
      setIsSaleModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to record sale log.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kambo Router Shop</h1>
          <p className="text-sm text-slate-500">
            Manage terminal device inventories (routers, extenders, cables) and record direct subscriber sales.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleCreateSaleOpen}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/10 transition text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            Record Device Sale
          </button>
          <button
            onClick={handleCreateProductOpen}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/10 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Shop Product
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-semibold rounded-r-xl">
          {error}
        </div>
      )}

      {/* Sub Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setSubTab("inventory")}
          className={`pb-3 text-sm font-bold tracking-tight transition border-b-2 ${
            subTab === "inventory"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Inventory Catalog ({products.length})
        </button>
        <button
          onClick={() => setSubTab("sales")}
          className={`pb-3 text-sm font-bold tracking-tight transition border-b-2 ${
            subTab === "sales"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Router Sales History ({sales.length})
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm">Counting stock cells...</p>
        </div>
      ) : subTab === "inventory" ? (
        /* INVENTORY TABLE */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No products loaded.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Item details</th>
                    <th className="px-6 py-4">Brand</th>
                    <th className="px-6 py-4">Stock level</th>
                    <th className="px-6 py-4">Buying Price</th>
                    <th className="px-6 py-4">Selling Price</th>
                    <th className="px-6 py-4">Expected Profit</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                  {products.map((prod) => {
                    const profit = prod.selling_price - prod.buying_price;
                    const lowStock = prod.stock < 3;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-slate-800 text-sm block">{prod.name}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-bold">{prod.brand}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              lowStock
                                ? "bg-red-50 text-red-700 border border-red-100 animate-pulse"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {prod.stock} units
                            {lowStock && " (Low Stock)"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {currency} {prod.buying_price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-slate-800">
                          {currency} {prod.selling_price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-emerald-600 font-extrabold">
                          +{currency} {profit.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditProductOpen(prod)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* SALES TABLE */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {sales.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-2" />
              <p className="text-sm font-medium">No sales recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Purchased Product</th>
                    <th className="px-6 py-4">Brand</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Purchase Date</th>
                    <th className="px-6 py-4">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-800 text-sm block">{sale.customer_name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-bold">{sale.product_name}</td>
                      <td className="px-6 py-4 text-slate-500">{sale.product_brand}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">{sale.quantity} items</td>
                      <td className="px-6 py-4 text-slate-500">{sale.date}</td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-emerald-600">
                          {currency} {sale.total_price.toLocaleString()}
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

      {/* SHOP PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">
                {selectedProduct ? "Edit Product Listing" : "Add Router Product"}
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductFormSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-r-lg">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Item / Router Name *
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Archer C6 AC1200"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Brand Manufacturer *
                </label>
                <input
                  type="text"
                  required
                  value={prodBrand}
                  onChange={(e) => setProdBrand(e.target.value)}
                  placeholder="e.g. TP-Link, MikroTik, Ubiquiti"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Buying Cost *
                  </label>
                  <input
                    type="number"
                    required
                    value={prodBuyingPrice}
                    onChange={(e) => setProdBuyingPrice(e.target.value)}
                    placeholder="Cost price"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    required
                    value={prodSellingPrice}
                    onChange={(e) => setProdSellingPrice(e.target.value)}
                    placeholder="Store price"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
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
                  {selectedProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD SALE MODAL */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">Record Device Sale Invoice</h2>
              <button onClick={() => setIsSaleModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaleFormSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-r-lg">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Product *
                </label>
                <select
                  value={saleProductId}
                  onChange={(e) => setSaleProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id} disabled={prod.stock === 0}>
                      {prod.name} ({prod.brand} - {prod.stock} left) - {currency} {prod.selling_price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Sold Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={saleQuantity}
                    onChange={(e) => setSaleQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Sale Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Customer / Subscriber Name *
                </label>
                <input
                  type="text"
                  required
                  value={saleCustomerName}
                  onChange={(e) => setSaleCustomerName(e.target.value)}
                  placeholder="e.g. Nairobi Academy, John Doe"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Record Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
