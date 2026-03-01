// |===============================| AddStock Component |===============================|
// Manages stock additions for existing products with pricing calculations and supplier tracking
import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import api from "../../../../utils/api";

// |===============================| Payment Methods List |===============================|
const PAYMENT_METHODS = [
  "Cash",
  "Credit",
  "Easypaisa",
  "JazzCash",
  "Allied Bank",
  "Askari Bank",
  "Bank AL Habib ",
  "Bank Alfalah",
  "Bank Islami",
  "Bank of Punjab",
  "Bank of Khyber",
  "Faysal Bank ",
  "First Women Bank",
  "HBL Bank",
  "JS Bank",
  "MCB Bank",
  "MCB Islamic Bank",
  "Meezan Bank",
  "NBP",
  "Samba Bank",
  "Silkbank ",
  "Sindh Bank ",
  "SME Bank ",
  "Soneri Bank ",
  "Summit Bank ",
  "UBL ",
];

// |===============================| Currency Formatting Utility |===============================|
// Formats amount to Pakistani Rupee currency format (PKR)
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "PKR 0";
  const numAmount = parseFloat(amount) || 0;
  return `PKR ${numAmount.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// |===============================| Load Products (from backend)
// Frontend will fetch purchases from backend API instead of using localStorage

// |===============================| Invoice ID Generator |===============================|
// Creates sequential invoice IDs (Inv-001, Inv-002, etc.) across products and purchase history
const generateInvoiceId = () => {
  const existingProducts = JSON.parse(localStorage.getItem("products") || "[]");
  const existingHistory = JSON.parse(
    localStorage.getItem("purchaseHistory") || "[]"
  );
  const allInvoices = [...existingProducts, ...existingHistory]
    .map((item) => item.invoiceId)
    .filter((id) => id && id.startsWith("Inv-"));

  if (allInvoices.length === 0) return "Inv-001";
  const lastSavedNum = allInvoices.reduce((max, id) => {
    const num = parseInt(id.replace("Inv-", ""), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  return `Inv-${String(lastSavedNum + 1).padStart(3, "0")}`;
};

// |===============================| Text Capitalization Utility |===============================|
// Capitalizes first letter of each word in text for consistent formatting
const capitalizeText = (text) => {
  if (!text || typeof text !== "string") return text;
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim();
};

// |===============================| Date/Time Formatting Utility |===============================|
// Converts date to standardized format string (DD/MM/YYYY HH:MM:SS)
const formatDateTime = (dateInput) => {
  if (!dateInput) return "—";
  try {
    let date;
    if (dateInput instanceof Date) date = dateInput;
    else if (typeof dateInput === "string") date = new Date(dateInput);
    else date = new Date(dateInput);

    if (isNaN(date.getTime())) return "—";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return "—";
  }
};

// |===============================| Average Price Per Unit Calculator |===============================|
// Calculates weighted average price per unit across previous and new stock
const calculatePricePerUnit = (
  previousValue,
  currentPurchaseValue,
  previousQuantity,
  additionalQuantity
) => {
  const totalValue =
    parseFloat(previousValue || 0) + parseFloat(currentPurchaseValue || 0);
  const totalQuantity =
    parseInt(previousQuantity || 0) + parseInt(additionalQuantity || 0);
  if (totalQuantity === 0) return "0.00";
  return (totalValue / totalQuantity).toFixed(2);
};

// |===============================| Main AddStock Component |===============================|
// Handles stock additions for existing products with dynamic pricing calculations
export default function AddStock() {
  // State for all products loaded from backend purchases collection
  const [products, setProducts] = useState([]);

  // State for selected product ID from dropdown
  const [selectedId, setSelectedId] = useState("");

  // State for currently selected product details
  const [product, setProduct] = useState(null);

  // State for additional quantity to add
  const [additionalQty, setAdditionalQty] = useState("");

  // State for new invoice ID for this stock addition
  const [newInvoiceId, setNewInvoiceId] = useState("");

  // State to control confirmation modal visibility
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // State for new purchase price (price per unit for new stock)
  const [newPurchasePrice, setNewPurchasePrice] = useState("");

  // State for new supplier name (raw input)
  const [newSupplier, setNewSupplier] = useState("");

  // State for new supplier name (display value)
  const [displayNewSupplier, setDisplayNewSupplier] = useState("");

  // State for new supplier contact number
  const [newSupplierContact, setNewSupplierContact] = useState("");

  // State for company name (raw input)
  const [company, setCompany] = useState("");

  // State for company name (display value)
  const [displayCompany, setDisplayCompany] = useState("");

  // State for payment method selection
  const [paymentMethod, setPaymentMethod] = useState("");

  // State for calculated average price per unit
  const [pricePerUnit, setPricePerUnit] = useState("0.00");

  // State to track if form is valid (all required fields filled and validated)
  const [isFormValid, setIsFormValid] = useState(false);

  // |===============================| Initialize Invoice ID on Mount + fetch products
  useEffect(() => {
    setNewInvoiceId(generateInvoiceId());

    const fetchPurchases = async () => {
      try {
        const res = await api.get("/purchases");
        setProducts(res.data || []);
      } catch (err) {
        console.error("fetchPurchases error", err);
        toast.error("Unable to load products from server", {
          position: "top-right",
          theme: "dark",
        });
      }
    };

    fetchPurchases();
  }, []);

  // |===============================| Handle Product Selection |===============================|
  // Updates form when a product is selected from dropdown
  useEffect(() => {
    if (!selectedId) return;
    const found = products.find(
      (p) => p._id === selectedId || p.productId === selectedId
    );
    if (found) {
      setProduct({
        ...found,
        value: found.value || "0.00",
      });
      setNewInvoiceId(found.invoiceId || generateInvoiceId());
      setNewPurchasePrice("");
      setAdditionalQty("");
      setNewSupplier("");
      setDisplayNewSupplier("");
      setNewSupplierContact("");
      setCompany("");
      setDisplayCompany("");
      setPaymentMethod("");
      setPricePerUnit("0.00");
    } else {
      toast.error("Product not found!", {
        position: "top-right",
        theme: "dark",
      });
    }
  }, [selectedId, products]);

  // |===============================| Auto-Calculate Pricing |===============================|
  // Recalculates pricing values whenever price, quantity, or product changes
  useEffect(() => {
    if (!product) return;
    const price = parseFloat(newPurchasePrice) || 0;
    const currentQty = parseInt(product.quantity) || 0;
    const addQty = parseInt(additionalQty) || 0;
    const purchaseValue = (price * addQty).toFixed(2);
    const previousValue = parseFloat(product.value) || 0;
    const totalInventoryValue = (
      previousValue + parseFloat(purchaseValue)
    ).toFixed(2);
    const calculatedPricePerUnit = calculatePricePerUnit(
      product.value,
      purchaseValue,
      product.quantity,
      additionalQty
    );
    setPricePerUnit(calculatedPricePerUnit);
    setProduct((prev) => ({
      ...prev,
      purchaseValue,
      totalInventoryValue,
      additionTotal: purchaseValue,
      pricePerUnit: calculatedPricePerUnit,
    }));
  }, [newPurchasePrice, additionalQty, product?.quantity, product?.value]);

  // |===============================| Real-time Form Validation |===============================|
  // Validates all required fields and formats to enable/disable Save and Confirm buttons
  useEffect(() => {
    const requiredFields = [
      product?.productId,
      newPurchasePrice,
      additionalQty,
      newSupplier.trim(),
      newSupplierContact,
      company.trim(),
      paymentMethod,
    ];

    const allFilled = requiredFields.every(
      (field) => field && String(field).trim() !== ""
    );

    // Validate phone number format (7-15 digits)
    const isValidContact = /^\d{7,15}$/.test(newSupplierContact);

    // Validate purchase price (must be positive number)
    const isPriceValid =
      newPurchasePrice &&
      !isNaN(newPurchasePrice) &&
      parseFloat(newPurchasePrice) > 0;

    // Validate additional quantity (must be positive integer)
    const isQtyValid =
      additionalQty && !isNaN(additionalQty) && parseInt(additionalQty) > 0;

    const isValid = allFilled && isValidContact && isPriceValid && isQtyValid;
    setIsFormValid(isValid);
  }, [
    product,
    newPurchasePrice,
    additionalQty,
    newSupplier,
    newSupplierContact,
    company,
    paymentMethod,
  ]);

  // |===============================| Input Change Handler |===============================|
  // Handles input changes with field-specific formatting and validation
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Purchase price: only allow digits and decimal point
    if (name === "newPurchasePrice")
      return setNewPurchasePrice(value.replace(/[^\d.]/g, ""));

    // Additional quantity: only allow digits
    if (name === "additionalQty")
      return setAdditionalQty(value.replace(/\D/g, ""));

    // Supplier contact: only allow digits (max 15 digits)
    if (name === "newSupplierContact") {
      let digits = value.replace(/\D/g, "");
      if (digits.length > 15) digits = digits.slice(0, 15);
      return setNewSupplierContact(digits);
    }

    // Supplier name: store both raw and display values
    if (name === "newSupplier") {
      setNewSupplier(value);
      setDisplayNewSupplier(value);
      return;
    }

    // Company name: store both raw and display values
    if (name === "company") {
      setCompany(value);
      setDisplayCompany(value);
      return;
    }

    // Payment method: store as-is
    if (name === "paymentMethod") return setPaymentMethod(value);
  };

  // |===============================| Clear Form Handler |===============================|
  // Resets form to initial state
  const handleClear = () => {
    setSelectedId("");
    setProduct(null);
    setNewPurchasePrice("");
    setAdditionalQty("");
    setNewSupplier("");
    setDisplayNewSupplier("");
    setNewSupplierContact("");
    setCompany("");
    setDisplayCompany("");
    setPaymentMethod("");
    setPricePerUnit("0.00");
    toast.info("Form cleared", {
      position: "top-right",
      theme: "dark",
      autoClose: 1500,
    });
  };

  // |===============================| Save Handler |===============================|
  // Opens confirmation modal when form is valid
  const handleSave = (e) => {
    e.preventDefault();
    if (!product) return;
    setShowConfirmModal(true);
  };

  // |===============================| Confirm Save Handler |===============================|
  // Saves stock update and purchase record to localStorage
  const confirmSave = async () => {
    if (!product) return;

    const capitalizedSupplier = capitalizeText(newSupplier);
    const capitalizedCompany = capitalizeText(company);
    const currentQty = parseInt(product.quantity) || 0;
    const addQty = parseInt(additionalQty) || 0;
    const purchasePrice = parseFloat(newPurchasePrice) || 0;
    const purchaseValue = purchasePrice * addQty;
    const previousValue = parseFloat(product.value) || 0;
    const totalInventoryValue = previousValue + purchaseValue;
    const finalPricePerUnit = calculatePricePerUnit(
      product.value,
      purchaseValue,
      product.quantity,
      additionalQty
    );
    const fullSupplierContact = "+" + newSupplierContact;

    // Prepare payload to update purchase document
    const payload = {
      price: purchasePrice,
      quantity: currentQty + addQty,
      value: totalInventoryValue.toFixed(2),
      pricePerUnit: finalPricePerUnit,
      supplier: capitalizedSupplier,
      supplierContact: fullSupplierContact,
      company: capitalizedCompany,
      paymentMethod,
      // optional meta
      meta: {
        lastStockAdditionOn: new Date().toISOString(),
        lastStockAdditionQty: addQty,
      },
    };

    try {
      const res = await api.put(`/purchases/${product._id}`, payload);
      const updated = res.data;

      // Update local in-memory list
      setProducts((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );

      setShowConfirmModal(false);
      toast.success(`Product stock updated (Invoice ${updated.invoiceId})`, {
        position: "top-right",
        theme: "dark",
        autoClose: 2000,
        onClose: () => (window.location.href = "/up"),
      });
    } catch (err) {
      console.error("confirmSave error", err);
      toast.error("Unable to update purchase — check server", {
        position: "top-right",
        theme: "dark",
      });
    }
  };

  // |===============================| Cancel Save Handler |===============================|
  // Closes confirmation modal without saving
  const cancelSave = () => setShowConfirmModal(false);

  // |===============================| Calculate Purchase Value |===============================|
  // Returns total value of new stock being added (price × additional quantity)
  const getPurchaseValue = () => {
    if (!product) return "0.00";
    const price = parseFloat(newPurchasePrice) || 0;
    const addQty = parseInt(additionalQty) || 0;
    return (price * addQty).toFixed(2);
  };

  // |===============================| Calculate Total Inventory Value |===============================|
  // Returns total inventory value after stock addition
  const getTotalInventoryValue = () => {
    if (!product) return "0.00";
    const previousValue = parseFloat(product.value) || 0;
    const purchaseValue = parseFloat(getPurchaseValue()) || 0;
    return (previousValue + purchaseValue).toFixed(2);
  };

  // |===============================| Get Previous Inventory Value |===============================|
  // Returns existing inventory value before stock addition
  const getPreviousInventoryValue = () =>
    product ? parseFloat(product.value || "0").toFixed(2) : "0.00";

  // |===============================| Component Render |===============================|
  return (
    // Main container with responsive padding
    <div className="px-4 py-2 min-h-screen ">
      {/* Toast notifications container */}
      <ToastContainer position="top-right" theme="dark" autoClose={2000} />

      {/* Content wrapper with max width constraint */}
      <div className="max-w-8xl mx-auto">
        {/* Page header section */}
        <div className="mb-4 ">
          <h1 className="text-3xl font-bold text-white">Add Stock</h1>
          <p className="text-white">
            Select a Product ID to update stock and pricing details.
          </p>
        </div>

        {/* Main form container with glassmorphism effect */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Card content area */}
          <div className="p-4 md:p-6 h-full overflow-y-auto">
            {/* Product selection dropdown */}
            <div className="mb-6">
              <label
                htmlFor="productId"
                className="block mb-2  font-medium text-white"
              >
                Select Product
              </label>
              <select
                id="productId"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
              >
                <option value="" className="bg-black/90">
                  Select Product
                </option>
                {/* Map through available products */}
                {products.map((p) => (
                  <option className="bg-black/90" key={p._id} value={p._id}>
                    {p.name} - {p.model}
                  </option>
                ))}
              </select>
            </div>

            {/* Conditional rendering based on product selection */}
            {!product ? (
              // Empty state when no product is selected
              <div className="text-center py-12 md:py-16 border-2 border-dashed border-white/20  rounded-md bg-white/5">
                <div className="text-white text-4xl md:text-6xl mb-4">📦</div>
                <p className="text-white italic text-base md:text-lg">
                  Select a Product ID to view details
                </p>
                <p className="text-white  md: mt-2">
                  Choose from the dropdown above to begin adding stock
                </p>
              </div>
            ) : (
              // Stock addition form when product is selected
              <form onSubmit={handleSave} className="space-y-4 md:space-y-6">
                {/* Product Information Section */}
                <div className="bg-cyan-800/70 backdrop-blur-md border border-cyan-800 rounded-md p-4 md:p-6 shadow-lg">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-white">📋</span>
                    Product Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white ">Invoice No:</span>
                        <span className="font-mono font-bold text-white  md:text-base">
                          {newInvoiceId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white ">Product ID:</span>
                        <span className="font-mono font-semibold text-white  md:text-base">
                          {product.productId}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white ">Name:</span>
                        <span className="font-semibold text-white  md:text-base">
                          {product.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white ">Model:</span>
                        <span className="font-semibold text-white  md:text-base">
                          {product.model}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white ">Category:</span>
                        <span className="font-semibold text-white  md:text-base">
                          {product.category}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white ">Stock:</span>
                        <span className="font-semibold text-white  md:text-base">
                          {product.quantity} pcs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supplier and Stock Management Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {/* Supplier Information Section */}
                  <div className="bg-cyan-800/70 backdrop-blur-md border border-cyan-800 rounded-md p-4 md:p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-cyan-900">💰</span>
                      Supplier Information (New Stock)
                    </h4>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Company input */}
                      <div>
                        <label className="block mb-2  font-medium text-white">
                          Company
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={displayCompany}
                          onChange={handleChange}
                          className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                          placeholder="Enter company name"
                        />
                      </div>
                      {/* Supplier Name input */}
                      <div>
                        <label className="block mb-2  font-medium text-white">
                          Supplier Name
                        </label>
                        <input
                          type="text"
                          name="newSupplier"
                          value={displayNewSupplier}
                          onChange={handleChange}
                          className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                          placeholder="Enter supplier name"
                        />
                      </div>

                      {/* Supplier Contact input with country code prefix */}
                      <div>
                        <label className="block mb-2  font-medium text-white">
                          Supplier Contact
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white select-none text-lg">
                            +
                          </span>
                          <input
                            type="text"
                            name="newSupplierContact"
                            value={newSupplierContact}
                            onChange={handleChange}
                            className="w-full pl-10 p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                            placeholder="923001234567"
                          />
                        </div>
                      </div>

                      {/* Payment Method dropdown */}
                      <div>
                        <label className="block mb-2  font-medium text-white">
                          Payment Method
                        </label>
                        <select
                          name="paymentMethod"
                          value={paymentMethod}
                          onChange={handleChange}
                          className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all scrollbar-hide"
                        >
                          <option value="" className="bg-black/90">
                            Select a payment method
                          </option>
                          {PAYMENT_METHODS.map((method) => (
                            <option
                              key={method}
                              value={method}
                              className="bg-black/90"
                            >
                              {method}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Stock Management Section */}
                  <div className="bg-cyan-800/70 backdrop-blur-md border border-cyan-800   rounded-md p-4 md:p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-yellow-300">📊</span>
                      Stock Management
                    </h4>

                    <div className="space-y-2">
                      {/* Current stock display */}
                      <div className="text-center p-2 bg-black/20 rounded-lg border border-cyan-900">
                        <label className="block mb-2  font-medium text-white">
                          Current Stock
                        </label>
                        <div className="text-2xl md:text-2xl font-bold text-yellow-300">
                          {product.quantity} pcs
                        </div>
                      </div>

                      {/* Additional quantity input */}
                      <div>
                        <label className="block mb-2  font-medium text-white">
                          Additional Quantity
                        </label>
                        <input
                          type="text"
                          name="additionalQty"
                          value={additionalQty}
                          onChange={handleChange}
                          placeholder="Enter quantity to add"
                          className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                        />
                      </div>

                      {/* New total stock display */}
                      <div className="text-center p-3 bg-black/20 rounded-lg border border-cyan-900">
                        <label className="block mb-1  font-medium text-white">
                          New Total Stock
                        </label>
                        <div className="text-lg font-bold text-yellow-300">
                          {parseInt(product.quantity) +
                            parseInt(additionalQty || 0)}{" "}
                          pcs
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Details Section */}
                <div className="bg-cyan-800/70 backdrop-blur-md border border-cyan-800   rounded-md p-4 md:p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-blue-300">🏢</span>
                    Pricing Details (New Stock)
                  </h4>

                  <div className="space-y-4">
                    {/* Purchase price input */}
                    <div>
                      <label className="block mb-2  font-medium text-white">
                        Purchase Price (for new stock)
                      </label>
                      <input
                        type="text"
                        name="newPurchasePrice"
                        value={newPurchasePrice}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                        placeholder="0.00"
                      />
                      <p className=" text-white mt-1">
                        Applies only to additional quantity
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Summary Section */}
                <div className="bg-cyan-800/70 backdrop-blur-md border border-cyan-800   rounded-md p-4 md:p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-cyan-300">📈</span>
                    Financial Summary
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left column - detailed financial breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-cyan-800/90 backdrop-blur-md border border-cyan-900 rounded-md">
                        <span className="text-white">
                          Current Purchase Value:
                        </span>
                        <span className="font-bold text-white">
                          {formatCurrency(getPurchaseValue())}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-cyan-800/90 backdrop-blur-md border border-cyan-900 rounded-md">
                        <span className="text-white">
                          Per Unit Cost (New Stock):
                        </span>
                        <span className="font-semibold text-white">
                          {formatCurrency(newPurchasePrice || "0")}
                        </span>
                      </div>
                      {/* Average price per unit display */}
                      <div className="flex justify-between items-center p-3  bg-cyan-800/90 backdrop-blur-md border border-cyan-900 rounded-md">
                        <span className="text-white">
                          Average Price Per Unit:
                        </span>
                        <span className="font-bold text-white">
                          {formatCurrency(pricePerUnit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-cyan-800/90 backdrop-blur-md border border-cyan-900 rounded-md">
                        <span className="text-white">
                          Previous Inventory Value:
                        </span>
                        <span className="font-semibold text-white">
                          {formatCurrency(getPreviousInventoryValue())}
                        </span>
                      </div>
                    </div>

                    {/* Right column - total inventory value highlight */}
                    <div className="flex flex-col justify-center p-4  bg-cyan-800/90 backdrop-blur-md border border-cyan-900 rounded-md">
                      <span className="text-white  md:text-base mb-2">
                        Total Inventory Value:
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-white">
                        {formatCurrency(getTotalInventoryValue())}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Save button - disabled until form is valid */}
                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className={`w-full py-3 md:py-4 rounded-md border border-white/30 transition-all duration-300 font-bold text-base md:text-lg flex justify-center items-center gap-3 shadow-lg ${
                      isFormValid
                        ? "bg-cyan-950/80 hover:bg-cyan-950 cursor-pointer hover:shadow-purple-500/25"
                        : "bg-black/30 cursor-not-allowed "
                    }`}
                  >
                    <AddIcon />
                    Save
                  </button>

                  {/* Clear form button */}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full py-3 md:py-4  rounded-md bg-red-700/80 hover:bg-red-800 border border-white/30  transition-all duration-300 cursor-pointer font-bold text-base md:text-lg flex justify-center items-center gap-3 shadow-lg hover:shadow-red-500/25"
                  >
                    <ClearIcon />
                    Clear
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50 p-4">
            <div className="bg-cyan-800/90 backdrop-blur-md border border-cyan-900 rounded-md p-6 w-full max-w-md text-white ">
              {/* Modal header */}
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-purple-300">⚠️</span>
                Confirm Stock Update
              </h3>

              {/* Confirmation details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-white">Product:</span>
                  <span className="font-semibold">{product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Invoice ID:</span>
                  <span className="font-mono font-bold text-white">
                    {newInvoiceId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Additional Quantity:</span>
                  <span className="font-semibold text-white">
                    {additionalQty} pcs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">New Total Stock:</span>
                  <span className="font-semibold text-white">
                    {parseInt(product.quantity) + parseInt(additionalQty || 0)}{" "}
                    pcs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Company:</span>
                  <span className="font-semibold text-white">
                    {displayCompany}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Supplier:</span>
                  <span className="font-semibold text-white">
                    {displayNewSupplier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Payment Method:</span>
                  <span className="font-semibold text-black rounded-full px-2 bg-white/70">
                    {paymentMethod}
                  </span>
                </div>
                {/* Average price per unit in confirmation */}
                <div className="flex justify-between">
                  <span className="text-white">Average Price Per Unit:</span>
                  <span className="font-bold text-white">
                    {formatCurrency(pricePerUnit)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/20 pt-2">
                  <span className="text-white">Purchase Value:</span>
                  <span className="font-bold text-white">
                    {formatCurrency(getPurchaseValue())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Total Inventory Value:</span>
                  <span className="font-bold text-white">
                    {formatCurrency(getTotalInventoryValue())}
                  </span>
                </div>
              </div>

              {/* Confirmation message */}
              <p className="text-white  mb-6">
                Are you sure you want to update the stock and create this
                purchase record?
              </p>

              {/* Modal action buttons */}
              <div className="flex gap-3">
                {/* Cancel button */}
                <button
                  onClick={cancelSave}
                  className="flex-1 py-3 border border-white/30  rounded-md bg-red-700 hover:bg-red-800 transition-all duration-300 cursor-pointer font-semibold"
                >
                  Cancel
                </button>

                {/* Confirm button - disabled until form is valid */}
                <button
                  onClick={confirmSave}
                  disabled={!isFormValid}
                  className={`flex-1 py-3 border border-white/30 rounded-md transition-all duration-300 font-semibold flex justify-center items-center gap-2 ${
                    isFormValid
                      ? "bg-cyan-950/70 hover:bg-cyan-950 cursor-pointer"
                      : "bg-black/30 cursor-not-allowed opacity-50"
                  }`}
                >
                  <AddIcon />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
