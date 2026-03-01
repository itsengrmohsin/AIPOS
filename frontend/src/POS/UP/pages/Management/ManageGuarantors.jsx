// |===============================| ManageGuarantors Component |===============================|
// Import necessary React hooks and external libraries
import React, { useState, useMemo, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { X, Download, Printer } from "lucide-react";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FilterListIcon from "@mui/icons-material/FilterList";
import api from "../../../../utils/api";
import usePrint from "../../hooks/usePrint";
import PrintableDocument from "../../components/Print/PrintableDocument";

// Date formatting utility function - converts various date formats to standardized string
const formatDateTime = (dateInput) => {
  // Return dash for empty/null dates
  if (!dateInput) return "—";

  try {
    let date;

    // Handle different date input types and formats
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === "string") {
      // Parse custom date format (DD/MM/YYYY HH:MM:SS)
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
              seconds || 0
            );
          } else {
            date = new Date(year, month - 1, day);
          }
        }
      } else {
        // Parse ISO string or other standard formats
        date = new Date(dateInput);
      }
    } else {
      // Handle numeric timestamps or other date types
      date = new Date(dateInput);
    }

    // Validate the parsed date
    if (isNaN(date.getTime())) {
      return "—";
    }

    // Format date components with leading zeros
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    // Return formatted date string (DD/MM/YYYY HH:MM:SS)
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Date formatting error:", error);
    return "—";
  }
};

// Short date formatter - extracts only the date portion
const formatShortDate = (dateString) => {
  if (!dateString) return "—";

  try {
    const fullDate = formatDateTime(dateString);
    if (fullDate === "—") return "—";
    return fullDate.split(" ")[0]; // Return only date part (before space)
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
      "Guarantor ID",
      "First Name",
      "Last Name",
      "CNIC",
      "Contact",
      "City",
      "Address",
      "Date Added",
      "Last Updated",
    ];

    // Convert data to CSV rows
    const csvRows = data.map((guarantor) => [
      guarantor.guarantorId,
      guarantor.firstName,
      guarantor.lastName,
      guarantor.cnic,
      guarantor.contact,
      guarantor.city,
      guarantor.address || "",
      formatShortDate(guarantor.dateAdded),
      guarantor.updatedAt ? formatShortDate(guarantor.updatedAt) : "",
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

// Capitalize case utility function
const toCapitalizeCase = (str) => {
  if (!str || typeof str !== "string") return str;
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Main ManageGuarantors component function
export default function ManageGuarantors() {
  // State management for guarantors data
  const [guarantors, setGuarantors] = useState([]);

  // State for loading
  const [loading, setLoading] = useState(true);

  // Load guarantors from API
  const loadGuarantors = async () => {
    try {
      setLoading(true);
      const res = await api.get("/guarantors");
      setGuarantors(res.data);
    } catch (error) {
      console.error("Failed to load guarantors:", error);
      toast.error("Failed to load guarantors");
      setGuarantors([]);
    } finally {
      setLoading(false);
    }
  };

  // Load guarantors on component mount
  useEffect(() => {
    loadGuarantors();
  }, []);

  // State for search functionality
  const [query, setQuery] = useState("");

  // State for date range filtering
  const [dateRangeFilter, setDateRangeFilter] = useState("all");

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for view modal visibility
  const [isViewOpen, setIsViewOpen] = useState(false);

  // State for report modal visibility
  const [isReportOpen, setIsReportOpen] = useState(false);

  // State for edit mode
  const [editing, setEditing] = useState(false);

  // State for selected guarantor details
  const [selectedGuarantor, setSelectedGuarantor] = useState(null);

  // State for form data
  const [form, setForm] = useState({});

  // State for tracking original guarantor data before edits
  const [originalGuarantor, setOriginalGuarantor] = useState(null);

  // State for tracking form changes
  const [formChanges, setFormChanges] = useState({});

  // State for password verification
  const [password, setPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  // Memoized filtered guarantors based on search query and date range
  const filtered = useMemo(() => {
    let arr = guarantors.slice();

    // Apply search filter if query exists
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((g) =>
        // Search across multiple guarantor fields
        [
          g.guarantorId,
          g.firstName,
          g.lastName,
          g.contact,
          g.cnic,
          g.city,
          g.address,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    // Apply date range filter if not "all"
    if (dateRangeFilter !== "all") {
      const { start, end } = getDateRange(dateRangeFilter);
      if (start && end) {
        arr = arr.filter((g) => {
          const guarantorDate = new Date(
            g.dateAdded || g.createdAt || g.updatedAt
          );
          return guarantorDate >= start && guarantorDate <= end;
        });
      }
    }

    // Sort by guarantor ID
    arr.sort((a, b) => a.guarantorId.localeCompare(b.guarantorId));
    return arr;
  }, [guarantors, query, dateRangeFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = filtered.length;
    return { total };
  }, [filtered]);

  // Toast notification configuration
  const toastConfig = {
    position: "top-right",
    theme: "dark",
    autoClose: 2000,
  };
  const notifySuccess = (msg) => toast.success(msg, toastConfig);
  const notifyError = (msg) => toast.error(msg, toastConfig);

  // Generate guarantor initials from first and last name
  const initials = (g) =>
    `${(g.firstName || "").charAt(0)}${(g.lastName || "").charAt(
      0
    )}`.toUpperCase();

  // Field name mapper for display purposes
  const getFieldDisplayName = (field) => {
    const fieldNames = {
      contact: "CONTACT",
      city: "CITY",
      address: "ADDRESS",
    };
    return fieldNames[field] || field;
  };

  // Open edit modal with guarantor data
  const handleOpenEdit = (guarantor) => {
    setForm(guarantor);
    setOriginalGuarantor(guarantor);
    setFormChanges({});
    setEditing(true);
    setIsModalOpen(true);
  };

  // Form input change handler with change tracking
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Special handling for contact field - enforce + prefix
    if (name === "contact") {
      newValue = value.replace(/[^\d+]/g, "");
      if (newValue && newValue[0] !== "+")
        newValue = "+" + newValue.replace(/\+/g, "");
    }

    // Update form state
    setForm((prev) => ({ ...prev, [name]: newValue }));

    // Track changed fields compared to original guarantor
    if (originalGuarantor) {
      setFormChanges((prev) => {
        const isDifferent = newValue !== originalGuarantor[name];
        const updatedChanges = { ...prev };

        if (isDifferent) updatedChanges[name] = true;
        else delete updatedChanges[name];

        return updatedChanges;
      });
    }
  };

  // Password change handler
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  // Verify password and save changes
  const verifyPasswordAndSave = async () => {
    try {
      console.log("[Frontend] Verifying password...");
      
      // Verify password via API
      const verifyRes = await api.post('/users/verify-password', { 
        password 
      });

      console.log("[Frontend] Verification response:", verifyRes.data);

      if (!verifyRes.data.success) {
        console.log("[Frontend] Password verification failed");
        notifyError("Invalid password. Changes not saved.");
        setPassword("");
        return;
      }

      console.log("[Frontend] Password verified successfully");
      
      // Password verified, proceed with save
      saveChanges();
      setShowPasswordPrompt(false);
      setPassword("");
    } catch (err) {
      console.error("[Frontend] Password verification error:", err);
      console.error("[Frontend] Error response:", err.response?.data);
      notifyError("Password verification failed. Please try again.");
      setPassword("");
    }
  };

  // Save form changes handler
  const saveChanges = async () => {
    // Validate required fields
    if (!form.contact?.trim()) {
      notifyError("Contact number is required.");
      return;
    }

    // Apply Capitalize case to text fields before saving
    const processedForm = {
      // Apply Capitalize case to name fields
      firstName: toCapitalizeCase(form.firstName || ""),
      lastName: toCapitalizeCase(form.lastName || ""),
      // Apply Capitalize case to city and address
      city: toCapitalizeCase(form.city || ""),
      address: toCapitalizeCase(form.address || ""),
      // Keep contact as-is
      contact: form.contact,
    };

    try {
      // Update via API
      const res = await api.put(`/guarantors/${form._id}`, processedForm);
      const updatedGuarantor = res.data;

      // Update local state
      setGuarantors((prev) =>
        prev.map((g) => (g._id === form._id ? updatedGuarantor : g))
      );

      // Close modal and reset states
      setIsModalOpen(false);
      setOriginalGuarantor(null);
      setFormChanges({});
      notifySuccess(`${form.guarantorId} UPDATED SUCCESSFULLY.`);
    } catch (error) {
      console.error("Failed to update guarantor:", error);
      notifyError("Failed to update guarantor");
    }
  };
  // Handle save button click - show password prompt
  const handleSave = (e) => {
    e.preventDefault();

    setShowPasswordPrompt(true);
  };

  // Close modal handler
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOriginalGuarantor(null);
    setFormChanges({});
    setPassword("");
    setShowPasswordPrompt(false);
  };

  // Close password prompt
  const handleClosePasswordPrompt = () => {
    setShowPasswordPrompt(false);
    setPassword("");
  };

  // Print functionality handler
  const { print } = usePrint();
  
  const handlePrint = () => {
    if (!selectedGuarantor) {
      toast.error("No guarantor data available");
      return;
    }

    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        <PrintableDocument
          type="list"
          title="Guarantor Details"
          data={{
            items: [{
              guarantorId: selectedGuarantor.guarantorId,
              name: `${selectedGuarantor.firstName} ${selectedGuarantor.lastName}`,
              cnic: selectedGuarantor.cnic,
              contact: selectedGuarantor.contact,
              city: selectedGuarantor.city,
              address: selectedGuarantor.address,
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
    if (filtered.length === 0) {
      notifyError("No data available to export");
      return;
    }

    const success = exportToExcel(
      filtered,
      `guarantor-report-${new Date().toISOString().split("T")[0]}`
    );
    if (success) {
      notifySuccess("REPORT EXPORTED TO EXCEL SUCCESSFULLY");
    }
  };

  // Open report summary modal
  const handleOpenReport = () => {
    setIsReportOpen(true);
  };

  // Component render method
  return (
    // Main container with responsive padding and dark background
    <div className="p-2 min-h-screen text-white">
      {/* Toast notifications container */}
      <ToastContainer position="top-right" theme="dark" autoClose={2000} />

      {/* Content wrapper with max width constraint */}
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Page header section */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            MANAGE GUARANTORS
          </h1>
          <p className="text-white/80">
            VIEW, ANALYZE, AND EXPORT GUARANTOR DATA WITH ADVANCED FILTERING.
          </p>
        </div>

        {/* Search and filter panel */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-md p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search input with icon */}
          <div className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 md:col-span-2">
            <SearchIcon className="text-white" />
            <input
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                // Capitalize first letter of every word
                const formattedValue = value.replace(/\b\w/g, (char) =>
                  char.toUpperCase()
                );
                setQuery(formattedValue);
              }}
              placeholder="SEARCH GUARANTORS..."
              className="flex-1 outline-none bg-transparent text-white placeholder-white/60"
            />
          </div>

          {/* Date range filter dropdown */}
          <div className="flex items-center gap-2 justify-between col-span-2">
            <label className="text-sm text-white/70">DATE</label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="p-2 border border-white/10 rounded bg-white/10 text-white flex-1  scrollbar-hide"
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
          {/* Guarantors table */}
          <table className="w-full text-white/90 min-w-[900px]">
            {/* Table header with column labels */}
            <thead className="bg-white/10 text-left text-sm">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">NAME</th>
                <th className="p-3">CNIC</th>
                <th className="p-3">CONTACT</th>
                <th className="p-3">CITY</th>
                <th className="p-3">DATE ADDED</th>
                <th className="p-3">ACTIONS</th>
              </tr>
            </thead>

            {/* Table body with guarantor records */}
            <tbody>
              {/* Map through filtered guarantor records */}
              {filtered.length > 0 ? (
                filtered.map((g) => (
                  <tr
                    key={g.guarantorId}
                    className="border-t border-white/15 transition bg-green-700/30 hover:bg-green-700/50"
                  >
                    {/* Guarantor ID column */}
                    <td className="p-3">{g.guarantorId}</td>

                    {/* Guarantor name with avatar */}
                    <td className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 border border-white/20 flex items-center justify-center">
                        <span className="font-medium text-white">
                          {initials(g)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {g.firstName} {g.lastName}
                        </div>
                      </div>
                    </td>

                    {/* CNIC column */}
                    <td className="p-3">{g.cnic}</td>
                    
                    {/* Contact column */}
                    <td className="p-3">{g.contact}</td>

                    {/* City column */}
                    <td className="p-3">{g.city}</td>

                   {/* Date added column with short format */}
                   <td className="p-3 text-sm">
                      {formatShortDate(g.dateAdded || g.createdAt)}
                    </td>

                    {/* Actions column with view and edit buttons */}
                    <td className="p-3 flex gap-2">
                      {/* View button */}
                      <button
                        title="VIEW"
                        onClick={() => {
                          setSelectedGuarantor(g);
                          setIsViewOpen(true);
                        }}
                        className="p-2 rounded bg-cyan-900 text-white hover:bg-cyan-950 transition-colors cursor-pointer"
                      >
                        <VisibilityIcon fontSize="small" />
                      </button>

                      {/* Edit button */}
                      <button
                        title="EDIT"
                        onClick={() => handleOpenEdit(g)}
                        className="p-2 rounded bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition-colors cursor-pointer"
                      >
                        <EditIcon fontSize="small" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                // Empty state message
                <tr>
                  <td colSpan="7" className="text-center py-6 text-white/60">
                    {guarantors.length === 0
                      ? "NO GUARANTORS ADDED YET."
                      : "NO GUARANTORS MATCH YOUR SEARCH CRITERIA."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  GUARANTOR REPORT SUMMARY
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-semibold text-gray-700">
                    REPORT GENERATED: {formatDateTime(new Date())}
                  </p>
                  <p className="text-gray-600">
                    Total Records: {filtered.length} | Date Range:{" "}
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

              {/* Statistics Summary Only */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {stats.total}
                  </div>
                  <div className="text-blue-700 text-sm">TOTAL GUARANTORS</div>
                </div>
              </div>

              {/* Footer Information */}
              <div className="text-center border-t border-dashed border-gray-300 pt-4 text-xs text-gray-600">
                <p>THIS IS A COMPUTER-GENERATED GUARANTOR REPORT.</p>
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
      {/* View Modal */}
      {isViewOpen && selectedGuarantor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1a1c23] border border-[#2596be]/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn shadow-[#2596be]/10">
            <div className="flex justify-between items-center p-6 border-b border-[#2596be]/20 bg-[#2596be]/10">
              <h2 className="text-xl font-bold text-white tracking-wide">
                GUARANTOR DETAILS
              </h2>
              <button
                onClick={() => setIsViewOpen(false)}
                className="text-white/50 hover:text-white transition rounded-full p-1 hover:bg-[#2596be]/20"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-[#2596be]/30 transition-colors">
                  <p className="text-xs text-white/50 uppercase mb-1">Guarantor ID</p>
                  <p className="text-white font-medium">{selectedGuarantor.guarantorId}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-[#2596be]/30 transition-colors">
                   <p className="text-xs text-white/50 uppercase mb-1">CNIC</p>
                   <p className="text-white font-medium">{selectedGuarantor.cnic}</p>
                </div>
                <div className="col-span-2 bg-white/5 p-3 rounded-lg border border-white/5 hover:border-[#2596be]/30 transition-colors">
                   <p className="text-xs text-white/50 uppercase mb-1">Full Name</p>
                   <p className="text-white font-medium text-lg">{selectedGuarantor.firstName} {selectedGuarantor.lastName}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-[#2596be]/30 transition-colors">
                   <p className="text-xs text-white/50 uppercase mb-1">Contact</p>
                   <p className="text-white font-medium">{selectedGuarantor.contact}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-[#2596be]/30 transition-colors">
                   <p className="text-xs text-white/50 uppercase mb-1">City</p>
                   <p className="text-white font-medium">{selectedGuarantor.city}</p>
                </div>
                <div className="col-span-2 bg-white/5 p-3 rounded-lg border border-white/5 hover:border-[#2596be]/30 transition-colors">
                   <p className="text-xs text-white/50 uppercase mb-1">Address</p>
                   <p className="text-white font-medium">{selectedGuarantor.address || "N/A"}</p>
                </div>
                 <div className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-[#2596be]/30 transition-colors">
                   <p className="text-xs text-white/50 uppercase mb-1">Date Added</p>
                   <p className="text-white font-medium">{formatShortDate(selectedGuarantor.dateAdded || selectedGuarantor.createdAt)}</p>
                </div>
                 <div className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-[#2596be]/30 transition-colors">
                   <p className="text-xs text-white/50 uppercase mb-1">Last Updated</p>
                   <p className="text-white font-medium">{formatShortDate(selectedGuarantor.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#2596be]/20 bg-black/20 flex justify-end">
               <button
                  onClick={() => setIsViewOpen(false)}
                  className="px-6 py-2 rounded-lg bg-[#2596be] hover:bg-[#2596be]/80 text-white font-medium transition shadow-lg shadow-[#2596be]/20"
                >
                  Close
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1a1c23] border border-[#2596be]/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slideUp shadow-[#2596be]/10">
             <div className="flex justify-between items-center p-6 border-b border-[#2596be]/20 bg-[#2596be]/10">
              <h2 className="text-xl font-bold text-white tracking-wide">
                EDIT GUARANTOR
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-white/50 hover:text-white transition rounded-full p-1 hover:bg-[#2596be]/20"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 {/* ID - Read Only */}
                 <div className="space-y-1.5 opacity-60">
                    <label className="text-xs font-semibold text-white/60 uppercase ml-1">Guarantor ID</label>
                    <input 
                      value={form.guarantorId} 
                      readOnly 
                      className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white outline-none cursor-not-allowed"
                    />
                 </div>
                 
                  {/* CNIC - Read Only */}
                 <div className="space-y-1.5 opacity-60">
                    <label className="text-xs font-semibold text-white/60 uppercase ml-1">CNIC</label>
                    <input 
                      value={form.cnic} 
                      readOnly 
                      className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white outline-none cursor-not-allowed"
                    />
                 </div>

                 {/* First Name */}
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80 uppercase ml-1">First Name</label>
                    <input 
                      name="firstName"
                      value={form.firstName} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#2596be]/50 focus:ring-1 focus:ring-[#2596be]/50 outline-none transition"
                    />
                 </div>

                 {/* Last Name */}
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80 uppercase ml-1">Last Name</label>
                    <input 
                      name="lastName"
                      value={form.lastName} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#2596be]/50 focus:ring-1 focus:ring-[#2596be]/50 outline-none transition"
                    />
                 </div>

                  {/* Contact */}
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80 uppercase ml-1">Contact</label>
                     <input 
                      name="contact"
                      value={form.contact} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#2596be]/50 focus:ring-1 focus:ring-[#2596be]/50 outline-none transition"
                    />
                 </div>

                  {/* City */}
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80 uppercase ml-1">City</label>
                     <input 
                      name="city"
                      value={form.city} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#2596be]/50 focus:ring-1 focus:ring-[#2596be]/50 outline-none transition"
                    />
                 </div>

                  {/* Address */}
                 <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-white/80 uppercase ml-1">Address</label>
                     <input 
                      name="address"
                      value={form.address} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#2596be]/50 focus:ring-1 focus:ring-[#2596be]/50 outline-none transition"
                    />
                 </div>

              </div>

               <div className="flex justify-end gap-3 pt-4 border-t border-[#2596be]/20">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl bg-[#2596be] hover:bg-[#2596be]/80 text-white font-semibold shadow-lg shadow-[#2596be]/20 transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Verification Modal */}
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
              onChange={handlePasswordChange}
              autoFocus
              className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-white/30 mb-6 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 outline-none text-center tracking-widest"
            />

            <div className="flex gap-3">
               <button
                  onClick={handleClosePasswordPrompt}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyPasswordAndSave}
                  className="flex-1 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-500/20 transition"
                >
                  Confirm
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
