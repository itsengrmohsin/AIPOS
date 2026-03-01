// |===============================| InventoryDetails Component |===============================|
// Import necessary React hooks and external libraries
import React, { useState, useMemo, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Download, Printer, X, Plus, RefreshCw, History, TrendingUp, TrendingDown } from "lucide-react";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList";
import api from "../../../../utils/api";
import usePrint from "../../hooks/usePrint";
import PrintableDocument from "../../components/Print/PrintableDocument";

// Date formatting utility function
const formatDateTime = (dateInput) => {
  if (!dateInput) return "—";

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "—";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Date formatting error:", error);
    return "—";
  }
};

// Short date formatter
const formatShortDate = (dateString) => {
  if (!dateString) return "—";
  try {
    const fullDate = formatDateTime(dateString);
    if (fullDate === "—") return "—";
    return fullDate.split(" ")[0];
  } catch (error) {
    return "—";
  }
};

// Currency formatter for PKR
const formatCurrencyPKR = (amount) => {
  const num = parseFloat(amount) || 0;
  return `Rs. ${num.toLocaleString("en-PK")}/-`;
};

// Determine stock level status
const getStockLevel = (quantity) => {
  const qty = parseInt(quantity || 0);

  if (qty === 0) {
    return {
      level: "out-of-stock",
      label: "OUT OF STOCK",
      class: "bg-red-600 border border-white/30",
    };
  } else if (qty <= 5) {
    return {
      level: "low",
      label: "LOW STOCK",
      class: "bg-orange-600 border border-white/30",
    };
  } else if (qty <= 15) {
    return {
      level: "medium",
      label: "MEDIUM STOCK",
      class: "bg-yellow-600 border border-white/30",
    };
  } else {
    return {
      level: "high",
      label: "IN STOCK",
      class: "bg-green-600 border border-white/30",
    };
  }
};

// Capitalize text utility
const capitalizeText = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Main InventoryDetails component
export default function ManageInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockLevelFilter, setStockLevelFilter] = useState("All");

  // Modal States
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  // Data States
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({});
  const [stockForm, setStockForm] = useState({ quantity: "", note: "" });
  const [password, setPassword] = useState("");
  const [pendingAction, setPendingAction] = useState(null); // 'edit' or 'addStock'
  const [syncing, setSyncing] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      setInventory(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter Logic
  const filtered = useMemo(() => {
    let arr = inventory.slice();

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      arr = arr.filter((p) => {
        const searchableFields = [
          p.productId,
          p.name,
          p.model,
          p.category,
        ]
          .filter(Boolean)
          .map((field) => field.toString().toLowerCase())
          .join(" ");
        return searchableFields.includes(q);
      });
    }

    if (categoryFilter !== "All") {
      arr = arr.filter((p) => p.category === categoryFilter);
    }

    if (stockLevelFilter !== "All") {
      arr = arr.filter((p) => {
        const stockLevel = getStockLevel(p.stock);
        return stockLevel.level === stockLevelFilter;
      });
    }

    return arr.sort((a, b) => a.productId.localeCompare(b.productId));
  }, [inventory, query, categoryFilter, stockLevelFilter]);

  const uniqueCategories = useMemo(() => {
    return [...new Set(inventory.map((p) => p.category))].filter(Boolean).sort();
  }, [inventory]);

  // Toast Config
  const toastConfig = { position: "top-right", theme: "dark", autoClose: 2000 };
  const notifySuccess = (msg) => toast.success(msg, toastConfig);
  const notifyError = (msg) => toast.error(msg, toastConfig);

  // Handlers
  const handleOpenEdit = (item) => {
    setForm(item);
    setIsEditOpen(true);
  };

  const handleOpenAddStock = (item) => {
    setSelectedItem(item);
    setStockForm({ quantity: "", note: "" });
    setIsAddStockOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStockChange = (e) => {
    const { name, value } = e.target;
    setStockForm((prev) => ({ ...prev, [name]: value }));
  };

  // Password Verification Logic
  const initiateAction = (actionType) => {
    setPendingAction(actionType);
    setShowPasswordPrompt(true);
  };

  const verifyPasswordAndExecute = async () => {
    try {
      const verifyRes = await api.post('/users/verify-password', { password });
      if (!verifyRes.data.success) {
        notifyError("Invalid password.");
        setPassword("");
        return;
      }

      setShowPasswordPrompt(false);
      setPassword("");

      if (pendingAction === "edit") {
        await saveEditChanges();
      } else if (pendingAction === "addStock") {
        await saveAddStock();
      }
    } catch (err) {
      console.error("Password verification error:", err);
      notifyError("Password verification failed.");
      setPassword("");
    }
  };

  const saveEditChanges = async () => {
    try {
      const processedForm = {
        ...form,
        name: capitalizeText(form.name),
        model: capitalizeText(form.model),
        category: capitalizeText(form.category),
      };

      const res = await api.put(`/products/${form.productId}`, processedForm);
      
      // Update local state
      setInventory(prev => prev.map(p => p.productId === form.productId ? res.data : p));
      
      setIsEditOpen(false);
      notifySuccess(`${form.name} updated successfully.`);
    } catch (err) {
      console.error("Update failed", err);
      notifyError("Failed to update product.");
    }
  };

  const saveAddStock = async () => {
    if (!stockForm.quantity || parseInt(stockForm.quantity) <= 0) {
      notifyError("Valid quantity required.");
      return;
    }

    try {
      const payload = {
        quantity: parseInt(stockForm.quantity),
        note: stockForm.note
      };

      const res = await api.post(`/products/${selectedItem.productId}/stock`, payload);
      
      // Update local state (res.data.product contains updated product)
      setInventory(prev => prev.map(p => p.productId === selectedItem.productId ? res.data.product : p));

      setIsAddStockOpen(false);
      notifySuccess(`Stock added to ${selectedItem.name} successfully.`);
    } catch (err) {
      console.error("Add stock failed", err);
      notifyError("Failed to add stock.");
    }
  };

  // Sync Inventory Handler
  const handleSyncInventory = async () => {
    try {
      setSyncing(true);
      const res = await api.post("/products/sync");
      notifySuccess(`Synced ${res.data.productsUpdated} items.`);
      await fetchProducts();
    } catch (err) {
      console.error("Sync error:", err);
      notifyError("Failed to sync inventory.");
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenHistory = async (item) => {
    setSelectedItem(item);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/products/${item.productId}/history`);
      setHistoryData(res.data);
    } catch (err) {
      console.error("History fetch error", err);
      notifyError("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Print Logic
  const { print } = usePrint();
  const handlePrint = () => {
    if (!selectedItem) return;
    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        <PrintableDocument
          type="list"
          title="Product Details"
          data={{
            items: [{
              productId: selectedItem.productId,
              name: selectedItem.name,
              model: selectedItem.model,
              category: selectedItem.category,
              quantity: selectedItem.stock,
              price: `Rs. ${selectedItem.unitPrice}/-`,
              stockLevel: getStockLevel(selectedItem.stock).label,
            }],
          }}
        />
      );
      print(html);
    } catch (error) {
      console.error("Print error:", error);
      notifyError("Failed to print");
    }
  };

  return (
    <div className="p-2 min-h-screen text-white">
      <ToastContainer position="top-right" theme="dark" autoClose={2000} />
      
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">MANAGE INVENTORY</h1>
          <p className="text-white/80">
            REAL-TIME STOCK MANAGEMENT, VALUATION, AND HISTORY.
          </p>
        </div>
        
        {/* Sync Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSyncInventory}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-md border border-blue-500/30 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className={syncing ? "animate-spin" : ""} size={18} />
            {syncing ? "SYNCING..." : "SYNC STOCK FROM HISTORY"}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-md p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 md:col-span-2">
            <SearchIcon className="text-white" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH PRODUCTS..."
              className="flex-1 outline-none bg-transparent text-white placeholder-white/60"
            />
          </div>

          <div className="flex items-center gap-2 justify-between">
            <label className="text-sm text-white/70">CATEGORY</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2 border border-white/10 rounded bg-white/10 text-white flex-1 scrollbar-hide"
            >
              <option value="All" className="bg-black/95">ALL</option>
              {uniqueCategories.map(c => (
                <option key={c} value={c} className="bg-black/95">{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 justify-between">
            <label className="text-sm text-white/70">STOCK LEVEL</label>
            <select
              value={stockLevelFilter}
              onChange={(e) => setStockLevelFilter(e.target.value)}
              className="p-2 border border-white/10 rounded bg-white/10 text-white flex-1 scrollbar-hide"
            >
              <option value="All" className="bg-black/95">ALL</option>
              <option value="out-of-stock" className="bg-black/95">Out Of Stock</option>
              <option value="low" className="bg-black/95">Low Stock</option>
              <option value="medium" className="bg-black/95">Medium Stock</option>
              <option value="high" className="bg-black/95">In Stock</option>
            </select>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-md overflow-x-auto scrollbar-hide">
          <table className="w-full text-white/90 min-w-[1000px]">
            <thead className="bg-white/10 text-left text-sm">
              <tr>
                <th className="p-3">PRODUCT ID</th>
                <th className="p-3">NAME</th>
                <th className="p-3">MODEL</th>
                <th className="p-3">CATEGORY</th>
                <th className="p-3">STOCK LEVEL</th>
                <th className="p-3">AVG PRICE</th>
                <th className="p-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan="7" className="p-4 text-center">Loading...</td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.productId} className="border-t border-white/5 hover:bg-white/5 transition">
                    <td className="p-3 font-mono">{item.productId}</td>
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3">{item.model}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getStockLevel(item.stock).class}`}>
                        {item.stock} - {getStockLevel(item.stock).label}
                      </span>
                    </td>
                    <td className="p-3">{formatCurrencyPKR(item.unitPrice)}</td>
                    <td className="p-3 flex gap-2">
                       <button
                        title="VIEW"
                        onClick={() => { setSelectedItem(item); setIsViewOpen(true); }}
                        className="p-2 rounded bg-cyan-900 text-white hover:bg-cyan-950 transition-colors"
                      >
                        <VisibilityIcon fontSize="small" />
                      </button>
                      <button
                        title="EDIT"
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 rounded bg-yellow-600 text-white hover:bg-yellow-700 transition-colors"
                      >
                        <EditIcon fontSize="small" />
                      </button>
                      <button
                        title="ADD STOCK"
                        onClick={() => handleOpenAddStock(item)}
                        className="p-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                      <button
                        title="HISTORY"
                        onClick={() => handleOpenHistory(item)}
                        className="p-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                      >
                        <History size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="p-4 text-center text-white/70">NO PRODUCTS FOUND.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {isViewOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1a1c23] border border-[#2596be]/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn shadow-[#2596be]/10">
            <div className="flex justify-between items-center p-6 border-b border-[#2596be]/20 bg-[#2596be]/10">
              <h2 className="text-xl font-bold text-white tracking-wide">PRODUCT DETAILS</h2>
              <button onClick={() => setIsViewOpen(false)} className="text-white/50 hover:text-white transition rounded-full p-1 hover:bg-[#2596be]/20">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-hide">
               {/* Main Details */}
               <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Read Only Identifiers */}
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase mb-1">Invoice ID</p>
                    <p className="text-white font-medium font-mono">{selectedItem.lastInvoiceId || "N/A"}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase mb-1">Product ID</p>
                    <p className="text-white font-medium font-mono">{selectedItem.productId}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase mb-1">Model</p>
                    <p className="text-white font-medium">{selectedItem.model}</p>
                  </div>

                  <div className="col-span-2 lg:col-span-3 bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase mb-1">Name</p>
                    <p className="text-white font-medium text-lg">{selectedItem.name}</p>
                  </div>
                  
                  {/* Category & Stock */}
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase mb-1">Category</p>
                    <p className="text-white font-medium">{selectedItem.category}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase mb-1">Quantity (Stock)</p>
                    <p className="text-white font-medium text-xl">{selectedItem.stock} <span className="text-sm text-white/50">Units</span></p>
                  </div>
                   <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase mb-1">Price</p>
                    <p className="text-white font-medium text-xl">{formatCurrencyPKR(selectedItem.unitPrice)}</p>
                  </div>

                  {/* Supplier Info */}
                   <div className="col-span-2 lg:col-span-3 bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase mb-1">Supplier</p>
                    <p className="text-white font-medium">{selectedItem.supplier || "—"}</p>
                  </div>
                   <div className="col-span-2 lg:col-span-3 bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase mb-1">Supplier Contact</p>
                    <p className="text-white font-medium">{selectedItem.supplierContact || "—"}</p>
                  </div>
                   <div className="col-span-2 lg:col-span-3 bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase mb-1">Company</p>
                    <p className="text-white font-medium">{selectedItem.company || "—"}</p>
                  </div>

                  {/* Payment & Misc */}
                   <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase mb-1">Payment Method</p>
                    <p className="text-white font-medium">{selectedItem.paymentMethod || "—"}</p>
                  </div>
                   <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase mb-1">Type</p>
                    <p className="text-white font-medium">{"Product"}</p>
                  </div>
                   <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-white/50 uppercase mb-1">Saved On</p>
                    <p className="text-white font-medium text-xs">{formatDateTime(selectedItem.updatedAt || selectedItem.createdAt)}</p>
                  </div>
               </div>
            </div>
            <div className="p-4 border-t border-[#2596be]/20 bg-black/20 flex justify-end gap-3">
               <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition flex items-center gap-2">
                 <Printer size={16} /> Print ID
               </button>
               <button onClick={() => setIsViewOpen(false)} className="px-6 py-2 rounded-lg bg-[#2596be] hover:bg-[#2596be]/80 text-white font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1a1c23] border border-[#2596be]/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slideUp shadow-[#2596be]/10">
             <div className="flex justify-between items-center p-6 border-b border-[#2596be]/20 bg-[#2596be]/10">
              <h2 className="text-xl font-bold text-white tracking-wide">EDIT PRODUCT</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-white/50 hover:text-white transition rounded-full p-1 hover:bg-[#2596be]/20">
                <X size={20} />
              </button>
            </div>
             <div className="p-6 space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 opacity-60">
                     <label className="text-xs font-semibold text-white/60 uppercase ml-1">Invoice ID (Latest)</label>
                     <input value={selectedItem.lastInvoiceId || "N/A"} readOnly className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white outline-none cursor-not-allowed" />
                  </div>
                  <div className="space-y-1.5 opacity-60">
                     <label className="text-xs font-semibold text-white/60 uppercase ml-1">Product ID</label>
                     <input value={form.productId} readOnly className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white outline-none cursor-not-allowed" />
                  </div>
                  
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-white/80 uppercase ml-1">Name</label>
                     <input name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#2596be]/50 focus:ring-1 focus:ring-[#2596be]/50 outline-none transition" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-white/80 uppercase ml-1">Model</label>
                     <input name="model" value={form.model} onChange={handleChange} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#2596be]/50 focus:ring-1 focus:ring-[#2596be]/50 outline-none transition" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-white/80 uppercase ml-1">Category</label>
                     <input name="category" value={form.category} onChange={handleChange} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#2596be]/50 focus:ring-1 focus:ring-[#2596be]/50 outline-none transition" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-white/80 uppercase ml-1">Unit Price</label>
                     <input name="unitPrice" type="number" value={form.unitPrice} onChange={handleChange} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#2596be]/50 focus:ring-1 focus:ring-[#2596be]/50 outline-none transition" />
                  </div>

                  {/* Supplier Info */}
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-white/80 uppercase ml-1">Supplier</label>
                     <input name="supplier" value={form.supplier} onChange={handleChange} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#2596be]/50 focus:ring-1 focus:ring-[#2596be]/50 outline-none transition" />
                  </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-white/80 uppercase ml-1">Supplier Contact</label>
                     <input name="supplierContact" value={form.supplierContact || ""} onChange={handleChange} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#2596be]/50 focus:ring-1 focus:ring-[#2596be]/50 outline-none transition" />
                  </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-white/80 uppercase ml-1">Company</label>
                     <input name="company" value={form.company || ""} onChange={handleChange} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#2596be]/50 focus:ring-1 focus:ring-[#2596be]/50 outline-none transition" />
                  </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-white/80 uppercase ml-1">Payment Method</label>
                     <input name="paymentMethod" value={form.paymentMethod || ""} onChange={handleChange} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#2596be]/50 focus:ring-1 focus:ring-[#2596be]/50 outline-none transition" />
                  </div>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t border-[#2596be]/20">
                <button onClick={() => setIsEditOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition font-medium">Cancel</button>
                <button onClick={() => initiateAction('edit')} className="px-8 py-2.5 rounded-xl bg-[#2596be] hover:bg-[#2596be]/80 text-white font-semibold shadow-lg shadow-[#2596be]/20 transition">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {isAddStockOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1a1c23] border border-[#22c55e]/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp shadow-[#22c55e]/10">
             <div className="flex justify-between items-center p-6 border-b border-[#22c55e]/20 bg-[#22c55e]/10">
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">ADD STOCK</h2>
                <p className="text-xs text-white/60 mt-1">ADDING TO: {selectedItem.name}</p>
              </div>
              <button onClick={() => setIsAddStockOpen(false)} className="text-white/50 hover:text-white transition rounded-full p-1 hover:bg-[#22c55e]/20">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80 uppercase ml-1">Quantity to Add</label>
                    <input name="quantity" type="number" value={stockForm.quantity} onChange={handleStockChange} placeholder="e.g. 10" className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/50 outline-none transition" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80 uppercase ml-1">Note / Reason (Optional)</label>
                    <textarea name="note" value={stockForm.note} onChange={handleStockChange} placeholder="e.g. New Shipment Arrived" rows="3" className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/50 outline-none transition resize-none" />
                 </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-[#22c55e]/20">
                <button onClick={() => setIsAddStockOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition font-medium">Cancel</button>
                <button onClick={() => initiateAction('addStock')} className="px-8 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#22c55e]/80 text-white font-semibold shadow-lg shadow-[#22c55e]/20 transition">Confirm Add Stock</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1a1c23] border border-purple-500/30 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-slideUp shadow-purple-500/10 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-purple-500/20 bg-purple-500/10">
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                  <History size={24} /> HISTORY LOG
                </h2>
                <p className="text-xs text-white/60 mt-1 uppercase">
                  {selectedItem.productId} - {selectedItem.name}
                </p>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-white/50 hover:text-white transition rounded-full p-1 hover:bg-purple-500/20"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-0 overflow-auto flex-1 scrollbar-hide">
              <table className="w-full text-left text-sm text-white/80">
                <thead className="bg-white/5 sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="p-4 font-semibold text-white/60">DATE</th>
                    <th className="p-4 font-semibold text-white/60">TYPE</th>
                    <th className="p-4 font-semibold text-white/60">DETAILS/CUSTOMER</th>
                    <th className="p-4 font-semibold text-white/60 text-right">QTY</th>
                    <th className="p-4 font-semibold text-white/60 text-right">UNIT PRICE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historyLoading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-white/50">Loading history...</td></tr>
                  ) : historyData.length > 0 ? (
                    historyData.map((record, index) => (
                      <tr key={index} className="hover:bg-white/5 transition">
                        <td className="p-4 whitespace-nowrap text-white/70 font-mono text-xs">
                          {formatDateTime(record.savedOn || record.createdAt)}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            record.type === 'purchase' || record.type === 'stock-addition' 
                              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}>
                            {record.type === 'purchase' || record.type === 'stock-addition' 
                              ? <TrendingUp size={14} /> 
                              : <TrendingDown size={14} />
                            }
                            {record.type === 'purchase' ? 'PURCHASE' : record.type === 'stock-addition' ? 'STOCK ADDED' : 'SALE'}
                          </span>
                        </td>
                        <td className="p-4">
                           {record.type === 'sale' ? (
                             <div className="flex flex-col">
                               <span className="text-white font-medium">Inv: {record.invoiceId}</span>
                               <span className="text-xs text-white/50">Plan: {record.saleType}</span>
                             </div>
                           ) : (
                             <div className="flex flex-col">
                               <span className="text-white font-medium">{record.meta?.note || record.supplier || "Manual Adjustment"}</span>
                               <span className="text-xs text-white/50">{record.invoiceId ? `Ref: ${record.invoiceId}` : 'No Reference'}</span>
                             </div>
                           )}
                        </td>
                        <td className={`p-4 text-right font-mono font-bold ${
                          record.type === 'sale' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {record.type === 'sale' ? '-' : '+'}{record.quantity}
                        </td>
                        <td className="p-4 text-right font-mono text-white/70">
                          {formatCurrencyPKR(record.price || record.unitPrice)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="p-8 text-center text-white/50">No history found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
             <div className="p-4 border-t border-purple-500/20 bg-black/20 flex justify-end">
                <button onClick={() => setIsHistoryOpen(false)} className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition">Close</button>
             </div>
          </div>
        </div>
      )}

      {/* Password Prompt */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#1a1c23] border border-white/20 rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center animate-scaleIn">
             <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
               <div className="w-6 h-6 border-2 border-yellow-500 rounded-lg flex items-center justify-center">
                 <div className="w-1 h-2 bg-yellow-500 rounded-full"></div>
               </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Security Check</h3>
            <p className="text-white/60 mb-6 text-sm">Please enter your admin password to confirm these changes.</p>
            
            <input 
              type="password"
              placeholder="Enter Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-white/30 mb-6 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 outline-none text-center tracking-widest"
            />

            <div className="flex gap-3">
               <button onClick={() => setShowPasswordPrompt(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition">Cancel</button>
               <button onClick={verifyPasswordAndExecute} className="flex-1 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-500/20 transition">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
