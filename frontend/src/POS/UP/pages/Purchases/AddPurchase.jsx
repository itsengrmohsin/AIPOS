// |===============================| AddPurchase Component |===============================|
// Import necessary React hooks and external libraries
import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import api from "../../../../utils/api";

// |===============================| Empty Product Template |===============================|
const emptyProduct = {
  productId: "",
  invoiceId: "",
  name: "",
  model: "",
  category: "",
  company: "",
  price: "",
  quantity: "",
  supplier: "",
  supplierContact: "",
  total: "",
  value: "",
  paymentMethod: "",
};

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
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "PKR 0";
  const numAmount = parseFloat(amount) || 0;
  return `PKR ${numAmount.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// |===============================| Text Capitalization Utility |===============================|
const capitalizeText = (text) => {
  if (!text || typeof text !== "string") return text;
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim();
};

// |===============================| Main AddPurchase Component |===============================|
export default function AddPurchase() {
  const navigate = useNavigate();
  
  // State for current product being edited in form
  const [product, setProduct] = useState(emptyProduct);

  // State to track if form is valid (all required fields filled)
  const [isFormValid, setIsFormValid] = useState(false);
  
  // Loading state for fetching IDs
  const [loadingIds, setLoadingIds] = useState(true);

  // |===============================| Fetch IDs from API |===============================|
  const fetchNextIds = async () => {
    try {
      setLoadingIds(true);
      const res = await api.get("/purchases/next-id");
      if (res.data) {
        setProduct(prev => ({
          ...prev,
          invoiceId: res.data.nextInvoiceId || "Inv-001",
          productId: res.data.nextProductId || "P-001"
        }));
      }
    } catch (err) {
      console.error("Failed to fetch next IDs", err);
      toast.error("Failed to fetch IDs from server. Please check connection.");
    } finally {
      setLoadingIds(false);
    }
  };

  // Initialize IDs on Mount
  useEffect(() => {
    fetchNextIds();
  }, []);

  // |===============================| Auto-Calculate Total Value |===============================|
  useEffect(() => {
    const price = parseFloat(product.price) || 0;
    const qty = parseInt(product.quantity) || 0;
    const total = (price * qty).toFixed(2);
    setProduct((prev) => ({ ...prev, total, value: total }));
  }, [product.price, product.quantity]);

  // |===============================| Real-time Form Validation |===============================|
  useEffect(() => {
    const requiredFields = [
      product.name,
      product.model,
      product.category,
      product.company,
      product.price,
      product.quantity,
      product.supplier,
      product.supplierContact,
      product.paymentMethod,
      product.productId,
      product.invoiceId,
    ];
    const allFilled = requiredFields.every((f) => f && f.trim() !== "");
    setIsFormValid(allFilled);
  }, [product]);

  // |===============================| Input Change Handler |===============================|
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Price field: only allow digits and decimal point
    if (name === "price") {
      const cleanedValue = value.replace(/[^\d.]/g, "");
      setProduct((prev) => ({ ...prev, [name]: cleanedValue }));
      return;
    }

    // Quantity field: only allow digits
    if (name === "quantity") {
      const cleanedValue = value.replace(/\D/g, "");
      setProduct((prev) => ({ ...prev, [name]: cleanedValue }));
      return;
    }

    // Supplier Contact field: only allow digits (max 15 digits)
    if (name === "supplierContact") {
      let digits = value.replace(/\D/g, "").slice(0, 15);
      setProduct((prev) => ({ ...prev, [name]: digits }));
      return;
    }

    // All other fields: store as-is
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  // |===============================| Form Submit Handler |===============================|
  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastOptions = {
      position: "top-right",
      theme: "dark",
      autoClose: 2000,
    };

    // Capitalize all text fields for consistency
    const capitalizedProduct = {
      ...product,
      name: capitalizeText(product.name),
      model: capitalizeText(product.model),
      category: capitalizeText(product.category),
      company: capitalizeText(product.company),
      supplier: capitalizeText(product.supplier),
    };

    // Validate supplier contact format (must be valid phone number)
    const fullSupplierContact = "+" + capitalizedProduct.supplierContact;
    if (!/^\+\d{7,15}$/.test(fullSupplierContact))
      return toast.error(
        "Supplier Contact must be valid (+923001234567)",
        toastOptions,
      );

    // Prepare payload for backend
    const timestamp = new Date().toISOString();
    const payload = {
      invoiceId: capitalizedProduct.invoiceId,
      productId: capitalizedProduct.productId,
      name: capitalizedProduct.name,
      model: capitalizedProduct.model,
      category: capitalizedProduct.category,
      price: parseFloat(capitalizedProduct.price) || 0,
      quantity: parseInt(capitalizedProduct.quantity) || 0,
      total: parseFloat(capitalizedProduct.total) || 0,
      supplier: capitalizedProduct.supplier,
      supplierContact: fullSupplierContact,
      company: capitalizedProduct.company,
      paymentMethod: capitalizedProduct.paymentMethod,
      type: "new-purchase",
      savedOn: timestamp,
      meta: {},
    };

    try {
      // Direct API Submission
      const res = await api.post("/purchases", payload);
      const created = res.data;

      // Show success notification
      toast.success(`Purchase recorded! Invoice: ${created.invoiceId}`, {
        ...toastOptions,
      });

      // Navigate after success
      setTimeout(() => {
        navigate("/up/dashboard");
      }, 2000);

    } catch (error) {
      console.error("AddPurchase API error", error);
      const errorMsg = error.response?.data?.error || "Unable to save purchase";
      toast.error(errorMsg, toastOptions);
    }
  };

  // |===============================| Clear Form Handler |===============================|
  const handleClear = () => {
    // Clear form and re-fetch IDs
    setProduct(emptyProduct);
    fetchNextIds();
    toast.info("Form cleared", {
      position: "top-right",
      theme: "dark",
      autoClose: 1500,
    });
  };

  // |===============================| Component Render |===============================|
  return (
    <div className="px-4 py-2 min-h-[100%]">
      <ToastContainer position="top-right" theme="dark" autoClose={2000} />
      <div className="max-w-8xl mx-auto space-y-3">
        {/* Page header section */}
        <div>
          <h1 className="text-3xl font-bold text-white">Add Purchase</h1>
          <p className="text-white">
            Fill in the product details below to record a purchase.
          </p>
        </div>

        {/* Main form container */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 text-white shadow-lg mt-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form input fields grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Invoice Number - Read Only */}
              <div>
                <input
                  type="text"
                  name="invoiceId"
                  value={product.invoiceId}
                  readOnly
                  className="w-full p-3 rounded-md bg-black/40 border border-white/30 cursor-not-allowed opacity-80"
                />
              </div>

              {/* Product ID - Read Only */}
              <div>
                <input
                  type="text"
                  name="productId"
                  value={product.productId}
                  readOnly
                  className="w-full p-3 rounded-md bg-black/40 border border-white/30 cursor-not-allowed opacity-80"
                />
              </div>

              {/* Dynamic text input fields */}
              {[
                { id: "name", label: "Name" },
                { id: "model", label: "Model" },
                { id: "category", label: "Category" },
                { id: "quantity", label: "Quantity" },
                { id: "price", label: "Purchase Price" },
                { id: "supplier", label: "Supplier" },
                { id: "company", label: "Company" },
              ].map((f) => (
                <div key={f.id}>
               
                  <input
                    type="text"
                    id={f.id}
                    name={f.id}
                    value={product[f.id]}
                    onChange={handleChange}
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                    className="w-full p-3 rounded-md bg-black/30 border border-white/20 outline-none focus:border-white/50 transition-colors"
                  />
                </div>
              ))}

              {/* Supplier Contact with + prefix */}
              <div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 select-none">
                    +
                  </span>
                  <input
                    type="text"
                    id="supplierContact"
                    name="supplierContact"
                    placeholder="923001234567"
                    value={product.supplierContact}
                    onChange={handleChange}
                    className="w-full pl-6 p-3 rounded-md bg-black/30 border border-white/20 outline-none focus:border-white/50 transition-colors"
                  />
                </div>
              </div>

              {/* Payment Method Dropdown */}
              <div>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={product.paymentMethod}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md bg-black/30 border border-white/20 outline-none scrollbar-hide focus:border-white/50 transition-colors"
                >
                  <option value="" className="bg-black/90">
                    Select a payment method
                  </option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method} className="bg-black/90">
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Value - Read Only (auto-calculated) */}
              <div>
                <input
                  type="text"
                  name="value"
                  value={formatCurrency(product.value)}
                  readOnly
                  className="w-full p-3 rounded-md bg-black/40 border border-white/30 cursor-not-allowed opacity-80"
                />
              </div>
            </div>

            {/* Action Buttons - Save and Clear */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-4 border-t border-white/10">
              {/* Save Button - Disabled until all required fields are filled */}
              <button
                type="submit"
                disabled={!isFormValid || loadingIds}
                className={`flex-1 py-3 rounded-md font-bold text-lg flex justify-center items-center gap-2 transition ${
                  isFormValid && !loadingIds
                    ? "bg-cyan-800 hover:bg-cyan-900 shadow-lg shadow-cyan-900/20"
                    : "bg-gray-700/50 cursor-not-allowed opacity-50"
                }`}
              >
                <AddIcon />
                {loadingIds ? "Loading IDs..." : "Save"}
              </button>

              {/* Clear Button - Resets form to initial state */}
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 py-3 rounded-md bg-red-800/80 hover:bg-red-900 transition font-bold text-lg shadow-lg shadow-red-900/20"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
