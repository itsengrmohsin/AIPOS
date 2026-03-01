// |===============================| SuppliersReports Component |===============================|
import React, { useState, useMemo, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Download, Printer } from "lucide-react";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import FilterListIcon from "@mui/icons-material/FilterList";
import api from "../../../../utils/api";
import usePrint from "../../hooks/usePrint";
import PrintableDocument from "../../components/Print/PrintableDocument";

// Date formatting utility function
const formatDateTime = (dateInput) => {
  if (!dateInput) return "—";

  try {
    let date;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === "string") {
      if (dateInput.includes("/")) {
        const parts = dateInput.split(" ");
        const datePart = parts[0];
        const timePart = parts[1];

        if (datePart.includes("/")) {
          const [day, month, year] = datePart.split("/");
          if (timePart) {
            const [hours, minutes, seconds] = timePart.split(":");
            date = new Date(
              year,
              month - 1,
              day,
              hours || 0,
              minutes || 0,
              seconds || 0,
            );
          } else {
            date = new Date(year, month - 1, day);
          }
        }
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) {
      return "—";
    }

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

// Date range calculation utilities
const getDateRange = (range) => {
  const now = new Date();
  const start = new Date();

  switch (range) {
    case "7days":
      start.setDate(now.getDate() - 7);
      break;
    case "15days":
      start.setDate(now.getDate() - 15);
      break;
    case "30days":
      start.setDate(now.getDate() - 30);
      break;
    case "90days":
      start.setDate(now.getDate() - 90);
      break;
    case "all":
    default:
      return { start: null, end: null };
  }

  return { start, end: now };
};

// Function to export data to Excel (CSV format)
const exportToExcel = (data, filename) => {
  if (!data || data.length === 0) {
    toast.error("No data to export");
    return;
  }

  try {
    // Define CSV headers
    const headers = [
      "Supplier Name",
      "Company",
      "Contact Number",
      "Date Added",
      "Last Updated",
    ];

    // Convert data to CSV rows
    const csvRows = data.map((supplier) => [
      supplier.name,
      supplier.company,
      supplier.contact,
      formatShortDate(supplier.dateAdded),
      supplier.updatedAt ? formatShortDate(supplier.updatedAt) : "",
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    toast.error("Failed to export data");
    return false;
  }
};

// Fetch suppliers by aggregating supplier info from purchases endpoint
const fetchSuppliersFromPurchases = async () => {
  try {
    const res = await api.get("/purchases");
    const purchases = res.data;

    const seenSuppliers = new Map();

    (purchases || []).forEach((item) => {
      if (item.supplier && item.supplierContact) {
        const supplierKey = `${item.supplier}-${item.supplierContact}`;
        const existing = seenSuppliers.get(supplierKey);

        const currentUpdatedAt = item.updatedAt
          ? new Date(item.updatedAt).getTime()
          : item.savedOn
            ? new Date(item.savedOn).getTime()
            : 0;
        const existingUpdatedAt = existing?.updatedAt
          ? new Date(existing.updatedAt).getTime()
          : 0;

        if (!existing) {
          seenSuppliers.set(supplierKey, {
            name: item.supplier,
            contact: item.supplierContact,
            company: item.company || "—",
            dateAdded:
              item.savedOn ||
              item.dateAdded ||
              item.createdAt ||
              new Date().toISOString(),
            id: supplierKey,
            updatedAt: item.updatedAt || item.savedOn || null,
          });
        } else if (currentUpdatedAt > existingUpdatedAt) {
          existing.updatedAt =
            item.updatedAt || item.savedOn || existing.updatedAt;
          existing.dateAdded =
            existing.dateAdded || item.savedOn || existing.dateAdded;
          seenSuppliers.set(supplierKey, existing);
        }
      }
    });

    return Array.from(seenSuppliers.values());
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
};

// Capitalize case utility function
const toCapitalizeCase = (str) => {
  if (!str || typeof str !== "string") return str;
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Main SuppliersDetails component function
export default function ManageSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [form, setForm] = useState({});
  const [originalSupplier, setOriginalSupplier] = useState(null);
  const [formChanges, setFormChanges] = useState({});
  const [password, setPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  // Load suppliers from backend purchases on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const list = await fetchSuppliersFromPurchases();
      if (mounted) setSuppliers(list);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Get unique companies for filter dropdown
  const uniqueCompanies = useMemo(() => {
    const companies = [...new Set(suppliers.map((s) => s.company))].filter(
      Boolean,
    );
    return companies.sort();
  }, [suppliers]);

  // Enhanced date parser for consistent sorting and filtering
  const parseDateForSorting = (dateInput) => {
    if (!dateInput) return new Date(0);

    try {
      if (dateInput instanceof Date) {
        return dateInput;
      }

      if (typeof dateInput === "string") {
        if (dateInput.includes("/")) {
          const parts = dateInput.split(" ");
          const datePart = parts[0];
          const timePart = parts[1] || "00:00:00";

          if (datePart.includes("/")) {
            const [day, month, year] = datePart.split("/");
            const [hours, minutes, seconds] = timePart.split(":");
            return new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day),
              parseInt(hours) || 0,
              parseInt(minutes) || 0,
              parseInt(seconds) || 0,
            );
          }
        }

        const parsed = new Date(dateInput);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }

      return new Date(dateInput);
    } catch (error) {
      console.error("Date parsing error for sorting:", error, dateInput);
      return new Date(0);
    }
  };

  // Memoized filtered suppliers based on search query and filters
  const filteredSuppliers = useMemo(() => {
    let arr = suppliers.filter((s) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;

      const combined = [s.name, s.contact, s.company]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      return combined.includes(q);
    });

    // Apply company filter if not "All"
    if (companyFilter !== "All") {
      arr = arr.filter(
        (s) =>
          s.company &&
          s.company.trim().toLowerCase() === companyFilter.trim().toLowerCase(),
      );
    }

    // Apply date range filter if not "all"
    if (dateRangeFilter !== "all") {
      const { start, end } = getDateRange(dateRangeFilter);
      if (start && end) {
        arr = arr.filter((s) => {
          const supplierDate = parseDateForSorting(s.dateAdded || s.updatedAt);
          return supplierDate >= start && supplierDate <= end;
        });
      }
    }

    return arr.sort((a, b) => {
      const dateA = parseDateForSorting(a.updatedAt || a.dateAdded).getTime();
      const dateB = parseDateForSorting(b.updatedAt || b.dateAdded).getTime();
      return dateB - dateA;
    });
  }, [suppliers, query, companyFilter, dateRangeFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = filteredSuppliers.length;
    const recentlyUpdated = filteredSuppliers.filter((s) => {
      if (!s.updatedAt) return false;
      const updateDate = parseDateForSorting(s.updatedAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return updateDate >= thirtyDaysAgo;
    }).length;

    return {
      total,
      recentlyUpdated,
    };
  }, [filteredSuppliers]);

  // Toast notification configuration
  const toastConfig = {
    position: "top-right",
    theme: "dark",
    autoClose: 2000,
  };
  const notifySuccess = (msg) => toast.success(msg, toastConfig);
  const notifyError = (msg) => toast.error(msg, toastConfig);

  // Generate supplier initials
  const initials = (s) => {
    const nameParts = s.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`;
    }
    return s.name.charAt(0);
  };

  // Handle WhatsApp click
  const handleWhatsApp = (phone) => {
    const cleanPhone = phone.replace("+", "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  // Print functionality handler
  const { print } = usePrint();
  
  const handlePrint = () => {
    if (!selectedSupplier) {
      toast.error("No supplier data available");
      return;
    }

    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        <PrintableDocument
          type="list"
          title="Supplier Details"
          data={{
            items: [{
              name: selectedSupplier.name,
              company: selectedSupplier.company,
              contact: selectedSupplier.contact,
            }],
          }}
        />
      );
      print(html);
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to print");
    }
  };

  // Generate and download Excel report
  const handleDownloadReport = () => {
    if (filteredSuppliers.length === 0) {
      notifyError("No data available to export");
      return;
    }

    const success = exportToExcel(
      filteredSuppliers,
      `suppliers-report-${new Date().toISOString().split("T")[0]}`,
    );
    if (success) {
      notifySuccess("Suppliers report exported successfully.");
    }
  };

  // Open report summary modal
  const handleOpenReport = () => {
    setIsReportOpen(true);
  };

  // Field name mapper for display purposes
  const getFieldDisplayName = (field) => {
    const fieldNames = {
      contact: "CONTACT",
      company: "COMPANY",
    };
    return fieldNames[field] || field;
  };

  // Open edit modal with supplier data
  const handleOpenEdit = (supplier) => {
    setForm(supplier);
    setOriginalSupplier(supplier);
    setFormChanges({});
    setEditing(true);
    setIsModalOpen(true);
  };

  // Form input change handler with formChanges tracking and contact formatting
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // --- Special handling for contact field ---
    if (name === "contact") {
      newValue = value.replace(/[^\d+]/g, ""); // keep only digits and '+'
      if (newValue && newValue[0] !== "+")
        newValue = "+" + newValue.replace(/\+/g, "");
    }

    // Update form state
    setForm((prev) => ({ ...prev, [name]: newValue }));

    // --- Track which fields have changed ---
    if (originalSupplier) {
      setFormChanges((prev) => {
        const isDifferent = newValue !== originalSupplier[name];
        const updated = { ...prev };

        if (isDifferent) {
          updated[name] = true; // mark this field as changed
        } else {
          delete updated[name]; // remove if reverted to original
        }

        return updated;
      });
    }
  };

  // Password change handler
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  // Verify password and save changes
  const verifyPasswordAndSave = () => {
    // Temporary POS password - will be fetched from DB later
    const posPassword = "0000";

    if (password !== posPassword) {
      notifyError("Invalid password. Changes not saved.");
      setPassword("");
      return;
    }

    // Password verified, proceed with save
    saveChanges();
    setShowPasswordPrompt(false);
    setPassword("");
  };

  // Save form changes handler
  const saveChanges = () => {
    // Validate required fields
    if (!form.contact?.trim()) {
      notifyError("Contact is required.");
      return;
    }
    if (!form.company?.trim()) {
      notifyError("Company is required.");
      return;
    }
    if (!form.name?.trim()) {
      notifyError("Supplier name is required.");
      return;
    }

    // Apply Capitalize case to text fields before saving
    const processedForm = {
      ...form,
      // Apply Capitalize case to name and company
      name: toCapitalizeCase(form.name || ""),
      company: toCapitalizeCase(form.company || ""),
      // Keep contact as-is (contact has special format)
      contact: form.contact,
      updatedAt: formatDateTime(new Date()),
    };

    // Generate update message based on changed fields
    const changedFields = Object.keys(formChanges);
    const updateMessage =
      changedFields.length > 0
        ? `UPDATED: ${changedFields
            .map((field) => getFieldDisplayName(field))
            .join(", ")}`
        : "RECORD UPDATED";

    // Update suppliers state with modified data
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === processedForm.id
          ? {
              ...processedForm,
              name: processedForm.name.trim(),
              contact: processedForm.contact.trim(),
              company: processedForm.company.trim(),
              updatedAt: formatDateTime(new Date()),
            }
          : s,
      ),
    );

    // Close modal and reset states
    setIsModalOpen(false);
    setOriginalSupplier(null);
    setFormChanges({});
    notifySuccess(`Supplier updated successfully.`);
  };

  // Handle save button click - show password prompt
  const handleSave = (e) => {
    e.preventDefault();

    // Validate required fields before showing password prompt
    if (!form.contact?.trim()) {
      notifyError("Contact is required.");
      return;
    }
    if (!form.company?.trim()) {
      notifyError("Company is required.");
      return;
    }
    if (!form.name?.trim()) {
      notifyError("Supplier name is required.");
      return;
    }

    setShowPasswordPrompt(true);
  };

  // Close modal handler
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOriginalSupplier(null);
    setFormChanges({});
    setPassword("");
    setShowPasswordPrompt(false);
  };

  // Close password prompt
  const handleClosePasswordPrompt = () => {
    setShowPasswordPrompt(false);
    setPassword("");
  };

  return (
    <div className="p-2 min-h-screen text-white">
      <ToastContainer position="top-right" theme="dark" autoClose={2000} />

      <div className="max-w-8xl mx-auto space-y-6">
        {/* Page header section */}
        <div>
          <h1 className="text-3xl font-bold mb-2">MANAGE SUPPLIERS</h1>
          <p className="text-white/80">
            ANALYZE AND EXPORT SUPPLIERS DATA WITH ADVANCED FILTERING AND
            REPORTING.
          </p>
        </div>

        {/* Search and Filter Panel */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-md p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search input with icon */}
          <div className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 md:col-span-2">
            <SearchIcon className="text-white" />
            <input
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
              }}
              placeholder="SEARCH SUPPLIERS..."
              className="flex-1 outline-none bg-transparent text-white placeholder-white/60"
            />
          </div>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="p-2 border border-white/10 rounded bg-white/10 text-white flex-1 scrollbar-hide"
          >
            <option value="All" className="bg-black/95 text-white">
              ALL
            </option>
            {uniqueCompanies.map((company) => (
              <option
                key={company}
                value={company}
                className="bg-black/95 text-white"
              >
                {toCapitalizeCase(company)}
              </option>
            ))}
          </select>

          {/* Date range filter dropdown */}
          <div className="flex items-center gap-2 justify-between">
            <label className="text-sm text-white/70">DATE</label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="p-2 border border-white/10 rounded bg-white/10 text-white flex-1 scrollbar-hide"
            >
              <option value="all" className="bg-black/95 text-white">
                ALL TIME
              </option>
              <option value="7days" className="bg-black/95 text-white">
                LAST 7 DAYS
              </option>
              <option value="15days" className="bg-black/95 text-white">
                LAST 15 DAYS
              </option>
              <option value="30days" className="bg-black/95 text-white">
                LAST 30 DAYS
              </option>
              <option value="90days" className="bg-black/95 text-white">
                LAST 90 DAYS
              </option>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-end">
          <button
            onClick={handleOpenReport}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md border border-purple-500/30 transition-colors flex items-center gap-2"
          >
            <FilterListIcon fontSize="small" />
            VIEW REPORT SUMMARY
          </button>
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md border border-green-500/30 transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            EXPORT TO EXCEL
          </button>
        </div>

        {/* Main data table container */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-md overflow-x-auto scrollbar-hide">
          <table className="w-full text-white/90 min-w-[800px]">
            <thead className="bg-white/10 text-left text-sm">
              <tr>
                <th className="p-3">S.No</th>
                <th className="p-3">SUPPLIER</th>
                <th className="p-3">CONTACT</th>
                <th className="p-3">COMPANY</th>
                <th className="p-3">WHATSAPP</th>
                <th className="p-3">DATE ADDED</th>
                <th className="p-3">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((s, index) => (
                  <tr
                    key={s.id || index}
                    className="border-t border-white/15 bg-blue-500/20 hover:bg-blue-500/50 transition"
                  >
                    {/* S.No Column */}
                    <td className="p-6 font-mono">{index + 1}</td>

                    <td className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="font-medium text-white">
                          {initials(s)}
                        </span>
                      </div>
                      <div className="font-medium text-white">
                        {toCapitalizeCase(s.name)}
                      </div>
                    </td>
                    <td className="p-3">{s.contact}</td>
                    <td className="p-3">{toCapitalizeCase(s.company)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleWhatsApp(s.contact)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer"
                        title="OPEN WHATSAPP"
                      >
                        <WhatsAppIcon fontSize="small" />
                        <span>CHAT</span>
                      </button>
                    </td>
                    <td className="p-3 text-sm">
                      {formatShortDate(s.dateAdded)}
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        title="VIEW SUPPLIER DETAILS"
                        onClick={() => {
                          setSelectedSupplier(s);
                          setIsViewOpen(true);
                        }}
                        className="p-2 rounded bg-cyan-900 text-white hover:bg-cyan-950 transition-colors cursor-pointer"
                      >
                        <VisibilityIcon fontSize="small" />
                      </button>
                      <button
                        title="EDIT SUPPLIER"
                        onClick={() => handleOpenEdit(s)}
                        className="p-2 rounded bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition-colors cursor-pointer"
                      >
                        <EditIcon fontSize="small" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-white/60">
                    {suppliers.length === 0
                      ? "NO SUPPLIERS FOUND IN PURCHASE DATA. ADD SOME PURCHASES FIRST."
                      : "NO SUPPLIERS MATCH YOUR SEARCH CRITERIA."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 backdrop-blur-md p-2">
          {/* Modal content container */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 w-full max-w-lg text-white">
            {/* Modal header with supplier info */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold">EDIT SUPPLIER</h2>
              <div className="text-sm text-white/80 mt-2 space-y-1">
                <p>
                  <strong>DATE ADDED:</strong> {formatDateTime(form.dateAdded)}
                </p>
              </div>
            </div>

            {/* Edit form */}
            <form onSubmit={handleSave} className="space-y-3">
              {/* Editable company field */}
              <input
                name="company"
                value={form.company || ""}
                onChange={handleChange}
                placeholder="COMPANY *"
                required
                className="w-full p-2 rounded bg-black/30 border border-white/20 outline-none cursor-not-allowed opacity-70"
                readOnly
              />
              {/* Editable name field */}
              <input
                name="name"
                value={form.name || ""}
                onChange={handleChange}
                placeholder="SUPPLIER NAME *"
                required
                className="w-full p-2 rounded bg-black/30 border border-white/20 outline-none"
              />

              {/* Editable contact field */}
              <input
                name="contact"
                value={form.contact || ""}
                onChange={handleChange}
                placeholder="CONTACT (+92...) *"
                required
                className="w-full p-2 rounded bg-black/30 border border-white/20 outline-none"
              />

              {/* Form action buttons */}
              <div className="flex justify-end gap-3 pt-4">
                {/* Save button */}
                <button
                  type="submit"
                  disabled={Object.keys(formChanges).length === 0}
                  className={`px-4 py-2 rounded border border-white/40 transition ${
                    Object.keys(formChanges).length === 0
                      ? "bg-gray-600/50 cursor-not-allowed opacity-50"
                      : "bg-cyan-800/80 hover:bg-cyan-900 cursor-pointer"
                  }`}
                >
                  SAVE CHANGES
                </button>

                {/* Cancel button */}
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded border border-white/40 bg-red-600 hover:bg-red-700 transition hover:cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Verification Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50 backdrop-blur-md">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 w-full max-w-md text-white">
            <h3 className="text-xl font-semibold mb-4 text-center">
              PASSWORD VERIFICATION REQUIRED
            </h3>

            <div className="space-y-4">
              <p className="text-white/80 text-center">
                PLEASE ENTER YOUR POS PASSWORD TO CONFIRM CHANGES
              </p>

              <div className="space-y-2">
                <label className="block text-sm text-white/70">
                  POS PASSWORD
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter POS password"
                  className="w-full p-3 rounded bg-black/20 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30"
                  autoFocus
                  autoComplete="new-password"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={handleClosePasswordPrompt}
                  className="px-4 py-2 rounded border border-white/40 bg-red-600 hover:bg-red-700 transition hover:cursor-pointer"
                >
                  CANCEL
                </button>

                <button
                  onClick={verifyPasswordAndSave}
                  disabled={
                    Object.keys(formChanges).length === 0 || !password.trim()
                  }
                  className={`px-4 py-2 rounded border border-white/40 transition ${
                    Object.keys(formChanges).length === 0 || !password.trim()
                      ? "bg-gray-600/50 cursor-not-allowed opacity-50"
                      : "bg-cyan-800/80 hover:bg-cyan-900 cursor-pointer"
                  }`}
                >
                  VERIFY & SAVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Supplier Details Modal */}
      {isViewOpen && selectedSupplier && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 p-2 md:p-4 backdrop-blur-md print:p-0">
          <div className="bg-white text-black rounded-lg w-full max-w-md mx-auto max-h-[95vh] overflow-y-auto scrollbar-hide relative font-sans text-sm border border-gray-300">
            <div className="p-4 space-y-3">
              <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
                <h2 className="text-xl font-bold tracking-wider text-gray-900">
                  ZUBI ELECTRONICS
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  SUPPLIER INFORMATION
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">COMPANY:</span>
                  <span className="text-gray-900 text-right">
                    {toCapitalizeCase(selectedSupplier.company)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">SUPPLIER:</span>
                  <span className="text-gray-900 text-right">
                    {toCapitalizeCase(selectedSupplier.name)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">CONTACT:</span>
                  <span className="text-gray-900 text-right">
                    {selectedSupplier.contact}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500 italic border-t border-dashed border-gray-300 pt-3 mt-3">
                <div className="grid grid-cols-2 gap-2">
                  <span>DATE ADDED:</span>
                  <span className="text-right">
                    {formatDateTime(selectedSupplier.dateAdded)}
                  </span>
                </div>
                {selectedSupplier.updatedAt && (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <span>LAST UPDATED:</span>
                    <span className="text-right">
                      {formatDateTime(selectedSupplier.updatedAt)}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-center border-t border-dashed border-gray-300 pt-4 text-xs text-gray-600">
                <p>THIS IS A COMPUTER-GENERATED SUPPLIER RECORD.</p>
                <p>CONTAINS BUSINESS AND CONTACT INFORMATION ONLY.</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-lg p-2 print:hidden">
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded bg-blue-600 cursor-pointer text-white hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <span>🖨️</span>
                  <span>PRINT</span>
                </button>

                <button
                  onClick={() => setIsViewOpen(false)}
                  className="px-4 py-2 rounded bg-gray-600 cursor-pointer text-white hover:bg-gray-700 transition font-medium"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Summary Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 p-2 md:p-4 backdrop-blur-md print:p-0">
          <div className="bg-white text-black rounded-lg w-full max-w-2xl mx-auto max-h-[95vh] overflow-y-auto scrollbar-hide relative font-sans text-sm border border-gray-300">
            <div className="p-6 space-y-6">
              {/* Report Header */}
              <div className="text-center border-b border-dashed border-gray-300 pb-4">
                <h2 className="text-2xl font-bold tracking-wider text-gray-900">
                  ZUBI ELECTRONICS
                </h2>
                <p className="text-lg text-gray-600 mt-1">
                  SUPPLIERS REPORT SUMMARY
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-semibold text-gray-700">
                    REPORT GENERATED: {formatDateTime(new Date())}
                  </p>
                  <p className="text-gray-600">
                    Total Suppliers: {filteredSuppliers.length} | Date Range:{" "}
                    {dateRangeFilter === "all"
                      ? "All Time"
                      : dateRangeFilter === "7days"
                        ? "Last 7 Days"
                        : dateRangeFilter === "15days"
                          ? "Last 15 Days"
                          : dateRangeFilter === "30days"
                            ? "Last 30 Days"
                            : "Last 90 Days"}
                  </p>
                </div>
              </div>

              {/* Statistics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {stats.total}
                  </div>
                  <div className="text-blue-700 text-sm">TOTAL SUPPLIERS</div>
                </div>

                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-900">
                    {stats.recentlyUpdated}
                  </div>
                  <div className="text-yellow-700 text-sm">
                    RECENTLY UPDATED
                  </div>
                </div>
              </div>

              {/* Company Distribution */}
              {uniqueCompanies.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3">
                    COMPANY DISTRIBUTION
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {uniqueCompanies.slice(0, 6).map((company) => {
                      const companyCount = filteredSuppliers.filter(
                        (s) => s.company === company,
                      ).length;
                      return (
                        <div
                          key={company}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-700">
                            {toCapitalizeCase(company)}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {companyCount}
                          </span>
                        </div>
                      );
                    })}
                    {uniqueCompanies.length > 6 && (
                      <div className="col-span-2 text-center text-gray-600 italic">
                        ... AND {uniqueCompanies.length - 6} MORE COMPANIES
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Information */}
              <div className="text-center border-t border-dashed border-gray-300 pt-4 text-xs text-gray-600">
                <p>THIS IS A COMPUTER-GENERATED SUPPLIERS REPORT.</p>
                <p>CONTAINS CONFIDENTIAL BUSINESS INFORMATION.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-lg p-4 print:hidden">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded bg-blue-600 cursor-pointer text-white hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  PRINT REPORT
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="px-4 py-2 rounded bg-green-600 cursor-pointer text-white hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  EXPORT TO EXCEL
                </button>
                <button
                  onClick={() => setIsReportOpen(false)}
                  className="px-4 py-2 rounded bg-gray-600 cursor-pointer text-white hover:bg-gray-700 transition font-medium"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
