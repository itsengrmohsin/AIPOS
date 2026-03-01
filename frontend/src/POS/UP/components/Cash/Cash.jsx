// |===============================| Cash Component |===============================|
import React, { useState, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { CreditCard } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../../../utils/api";
import usePrint from "../../hooks/usePrint";
import PrintableDocument from "../Print/PrintableDocument";

// Payment methods list
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

// PKR Currency Formatter
const formatPKR = (amount) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Safe client id generator (fallback when crypto.randomUUID is unavailable)
const generateClientId = () => {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
  } catch (e) {
    // ignore
  }
  return `id-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
};

// |===============================| Cash Component |===============================|
const Cash = () => {
  // Load products from localStorage
  const loadProducts = () => {
    try {
      const stored = localStorage.getItem("products");
      if (stored) {
        const productsData = JSON.parse(stored);
        // Convert all product string fields to lowercase when loading
        const formattedProducts = productsData.map((product) => ({
          ...product,
          name: product.name ? product.name : "",
          model: product.model ? product.model : "",
          category: product.category ? product.category : "",
          company: product.company ? product.company : "",
        }));
        return formattedProducts;
      }
      return [];
    } catch {
      console.error("Error loading products from localStorage.");
      return [];
    }
  };

  // Generate invoice number
  const generateInvoiceNumber = () => {
    try {
      const existingSales =
        JSON.parse(localStorage.getItem("salesHistory")) || [];
      const cashSales = existingSales.filter(
        (sale) => sale.type === "cash-sale",
      );

      if (cashSales.length === 0) {
        return "CASH-0001";
      }

      // Get the highest invoice number
      const lastInvoice = cashSales
        .map((sale) => sale.invoiceId)
        .filter((invoice) => invoice.startsWith("CASH-"))
        .sort((a, b) => {
          const numA = parseInt(a.split("-")[1]);
          const numB = parseInt(b.split("-")[1]);
          return numB - numA;
        })[0];

      if (!lastInvoice) {
        return "CASH-0001";
      }

      // Extract number and increment
      const lastNumber = parseInt(lastInvoice.split("-")[1]);
      const nextNumber = lastNumber + 1;

      // Format with leading zeros (8 digits)
      return `CASH-${nextNumber.toString().padStart(4, "0")}`;
    } catch (error) {
      console.error("Error generating invoice number:", error);
      return `CASH-${Date.now().toString().slice(-4)}`;
    }
  };

  // Load Data from localStorage
  const [products, setProducts] = useState(loadProducts());

  // Transaction State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [price, setPrice] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [newInvoiceId, setNewInvoiceId] = useState("");

  // Effects
  useEffect(() => {
    setNewInvoiceId(generateInvoiceNumber());
  }, []);

  // Load products from backend purchases API on mount, fallback to localStorage
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/purchases");
        const data = res.data;
        if (!mounted) return;
        // Map server Purchase model to expected client fields if needed
        const mapped = (Array.isArray(data) ? data : []).map((p) => ({
          productId: p.productId || p._id || "",
          name: p.name || "",
          model: p.model || "",
          category: p.category || "",
          quantity: (p.quantity || 0).toString(),
          company: p.company || "",
          pricePerUnit: p.pricePerUnit || p.price || 0,
          price: p.price || 0,
          value: p.total || 0,
        }));
        setProducts(mapped);
      } catch (err) {
        // fallback to localStorage loader already used by initial state
        console.warn(
          "Could not fetch purchases from server, using localStorage",
          err,
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProductId) {
      setSelectedProduct(null);
      setPrice("0");
      setDiscount("0");
      setQuantity("1");
      setPaymentMethod("");
      return;
    }

    // Find selected product in products list
    const found = products.find((p) => p.productId === selectedProductId);
    if (found) {
      // Get price per unit directly from stored data
      const pricePerUnit =
        parseFloat(found.pricePerUnit) || parseFloat(found.price) || 0;

      setSelectedProduct({
        productId: found.productId,
        name: found.name,
        model: found.model,
        category: found.category,
        quantity: found.quantity,
        company: found.company,
        pricePerUnit: pricePerUnit.toString(),
        value: found.value || "0.00",
      });

      // Set price to 0 by default instead of the product's price per unit
      setPrice("0");
      setDiscount("0");
      setQuantity("1");
      setPaymentMethod("");
    } else {
      setSelectedProduct(null);
      setPrice("0");
      setDiscount("0");
      setQuantity("1");
      setPaymentMethod("");
      toast.error("Product not found!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    }
  }, [selectedProductId, products]);

  // Calculate final total with discount and quantity
  const calculateFinalTotal = () => {
    const basePrice = parseFloat(price) || 0;
    const discountPercent = parseFloat(discount) || 0;
    const qty = parseInt(quantity) || 1;

    const subtotal = basePrice * qty;

    if (discountPercent > 0) {
      const discountAmount = (subtotal * discountPercent) / 100;
      return subtotal - discountAmount;
    }
    return subtotal;
  };

  // Enhanced validation function
  const validateFields = () => {
    if (!selectedProduct) {
      toast.error("Please select a product!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      return false;
    }

    // Validate quantity (REQUIRED)
    const qty = parseInt(quantity) || 0;
    if (!quantity || isNaN(qty) || qty <= 0) {
      toast.error("Quantity is required and must be at least 1!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      return false;
    }

    // Validate price (REQUIRED)
    const salePrice = parseFloat(price);
    if (!price || isNaN(salePrice) || salePrice < 0) {
      toast.error("Valid selling price is required!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      return false;
    }

    // Validate discount (REQUIRED but can be 0)
    const discountPercent = parseFloat(discount) || 0;
    if (
      discount === "" ||
      isNaN(discountPercent) ||
      discountPercent < 0 ||
      discountPercent > 100
    ) {
      toast.error("Discount is required and must be between 0% and 100%!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      return false;
    }

    // Validate payment method
    if (!paymentMethod) {
      toast.error("Please select a payment method!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      return false;
    }

    // Validate stock availability
    const currentStock = parseInt(selectedProduct.quantity) || 0;
    if (qty > currentStock) {
      toast.error(`Only ${currentStock} items available in stock!`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      return false;
    }

    if (currentStock <= 0) {
      toast.error("Product is out of stock!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      return false;
    }

    return true;
  };

  // Process the actual checkout
  const processCheckout = async () => {
    const salePrice = parseFloat(price);
    const discountPercent = parseFloat(discount) || 0;
    const qty = parseInt(quantity) || 1;
    const finalTotal = calculateFinalTotal();
    const invoiceNumber = newInvoiceId || generateInvoiceNumber();
    const transactionDetails = {
      invoiceId: invoiceNumber,
      saleType: "cash",
      products: [
        {
          productId: selectedProduct.productId,
          name: selectedProduct.name,
          model: selectedProduct.model,
          category: selectedProduct.category,
          unitPrice: salePrice,
          quantity: qty,
          discount: discountPercent,
          total: finalTotal,
        },
      ],
      paymentMethod: paymentMethod,
      subtotal: salePrice * qty,
      discountAmount:
        discountPercent > 0 ? (salePrice * qty * discountPercent) / 100 : 0,
      markupAmount: 0,
      finalTotal: finalTotal,
      advancePayment: finalTotal,
      status: "paid",
    };

    try {
      // Include userId if available (e.g., stored in localStorage after login)
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?._id) {
          transactionDetails.userId = parsedUser._id;
        }
      }

      // Use axios instance with auth token
      const res = await api.post("/sales", transactionDetails);
      const saved = res.data;

      // Update product stock in localStorage (mirror server change)
      const updatedProducts = products.map((p) => {
        if (p.productId === selectedProduct.productId) {
          const newQuantity = (parseInt(p.quantity) - qty).toString();
          const pricePerUnit =
            parseFloat(p.pricePerUnit) || parseFloat(p.price) || 0;
          const newValue = (parseFloat(newQuantity) * pricePerUnit).toFixed(2);

          return {
            ...p,
            quantity: newQuantity,
            value: newValue,
            updatedOn: new Date().toLocaleString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      localStorage.setItem("products", JSON.stringify(updatedProducts));
      setProducts(updatedProducts);

      // Add to sales history
      const existingSalesHistory =
        JSON.parse(localStorage.getItem("salesHistory")) || [];

      const newSaleEntry = {
        id: generateClientId(),
        invoiceId: saved.invoiceId || invoiceNumber,
        serverId: saved._id,
        type: "cash-sale",
        timestamp: new Date().toISOString(),
        productId: selectedProduct.productId,
        productName: selectedProduct.name,
        quantitySold: qty,
        salePrice: salePrice,
        discount: discountPercent,
        finalTotal: finalTotal,
        paymentMethod: paymentMethod,
      };

      const updatedSalesHistory = [...existingSalesHistory, newSaleEntry];
      localStorage.setItem("salesHistory", JSON.stringify(updatedSalesHistory));

      // Set current transaction for receipt (keep format compatible)
      setCurrentTransaction(newSaleEntry);

      toast.success("Purchase completed successfully!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });

      // Open receipt modal
      setIsReceiptModalOpen(true);
      setShowConfirmation(false);

      // Reset state for a new transaction (but keep modal open)
      setSelectedProductId("");
      setSelectedProduct(null);
      setPrice("0");
      setDiscount("0");
      setQuantity("1");
      setPaymentMethod("Cash");
    } catch (err) {
      console.error("Cash sale error", err);
      toast.error(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to create sale. Try again.",
        { position: "top-right", autoClose: 3000, theme: "dark" },
      );
      setShowConfirmation(false);
    }
  };

  // Handlers
  const handleCheckout = () => {
    if (!validateFields()) {
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleConfirmCheckout = () => {
    processCheckout();
  };

  const handleCancelCheckout = () => {
    setShowConfirmation(false);
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPrice(value);
    }
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setDiscount(value);
    }
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    // Allow only numbers
    if (value === "" || /^\d+$/.test(value)) {
      setQuantity(value);
    }
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  // Print Hook
  const { print } = usePrint();

  const handlePrint = () => {
    if (!currentTransaction) {
      toast.error("No transaction data available");
      return;
    }

    try {
      const invoiceHTML = ReactDOMServer.renderToStaticMarkup(
        <PrintableDocument
          type="receipt"
          title="Cash Sale Receipt"
          data={{
            invoiceId: currentTransaction.invoiceId,
            timestamp: currentTransaction.timestamp,
            items: [
              {
                name: currentTransaction.productName,
                quantity: currentTransaction.quantitySold,
                price: currentTransaction.salePrice,
                total: currentTransaction.finalTotal,
              },
            ],
            subtotal:
              currentTransaction.salePrice * currentTransaction.quantitySold,
            discount:
              currentTransaction.discount > 0
                ? (currentTransaction.salePrice *
                    currentTransaction.quantitySold *
                    currentTransaction.discount) /
                  100
                : 0,
            total: currentTransaction.finalTotal,
          }}
        />,
      );
      print(invoiceHTML);
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to print receipt");
    }
  };

  const handleCloseModal = () => {
    setIsReceiptModalOpen(false);
    window.location.href = "/up";
  };

  // Check if all required fields are filled
  const areAllFieldsFilled = () => {
    const basicFieldsFilled =
      selectedProduct &&
      price &&
      parseFloat(price) >= 0 &&
      quantity &&
      parseInt(quantity) > 0 &&
      discount !== "" &&
      !isNaN(parseFloat(discount)) &&
      parseFloat(discount) >= 0 &&
      parseFloat(discount) <= 100 &&
      paymentMethod;
    return basicFieldsFilled;
  };

  // Check if checkout should be enabled
  const isCheckoutEnabled =
    areAllFieldsFilled() &&
    parseInt(quantity) <= parseInt(selectedProduct?.quantity || 0) &&
    parseFloat(price) > 0;

  const finalTotal = calculateFinalTotal();
  const currentStock = selectedProduct ? parseInt(selectedProduct.quantity) : 0;
  const isQuantityExceedingStock = parseInt(quantity) > currentStock;

  // Format payment method for display (no change needed since we're using the actual names)
  const getPaymentMethodDisplay = (method) => {
    return method;
  };

  return (
    <>
      {/* Move ToastContainer to root level outside the blurred container */}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{
          zIndex: 9999,
        }}
      />

      <div
        className={`bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-md transition-all duration-300 ${
          isReceiptModalOpen || showConfirmation ? "backdrop-blur-md" : ""
        }`}
      >
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <CreditCard className="w-6 h-6 mr-2" />
          Cash Sales
        </h2>

        {/* Product Selection Dropdown */}
        <div className="mb-6">
          <label
            htmlFor="productId"
            className="block mb-2  font-medium text-white"
          >
            Select Product *
          </label>
          <select
            id="productId"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
          >
            <option value="" className="bg-black/90">
              Select any Product
            </option>
            {products.map((p) => (
              <option
                className="bg-black/90"
                key={p.productId}
                value={p.productId}
              >
                {p.name} - {p.model}
              </option>
            ))}
          </select>
        </div>

        {/* Conditional rendering based on product selection */}
        {!selectedProduct ? (
          // Empty state when no product is selected
          <div className="text-center py-12 border-2 border-dashed border-white/20 rounded-md bg-white/5 mb-6">
            <div className="text-white text-4xl mb-4">🛒</div>
            <p className="text-white italic text-base">
              Select a product to begin cash sale
            </p>
            <p className="text-white  mt-2">
              Choose from the dropdown above to process a cash transaction
            </p>
          </div>
        ) : (
          <>
            {/* Product Information Section */}
            <div className="bg-cyan-800/70 backdrop-blur-md border border-cyan-800 rounded-md p-4 md:p-6 shadow-lg mb-6">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-white">📋</span>
                Product Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white ">Product ID:</span>
                    <span className="font-mono font-semibold text-white  md:text-base">
                      {selectedProduct.productId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white ">Model:</span>
                    <span className="font-semibold text-white  md:text-base">
                      {selectedProduct.model}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white ">Product Name:</span>
                    <span className="font-semibold text-white  md:text-base">
                      {selectedProduct.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-white ">Category:</span>
                    <span className="font-semibold text-white  md:text-base">
                      {selectedProduct.category}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white ">Current Stock:</span>
                    <span
                      className={`font-semibold  md:text-base ${
                        parseInt(selectedProduct.quantity) > 0
                          ? "text-white"
                          : "text-white bg-red-600 px-2 py-1 rounded-full"
                      }`}
                    >
                      {selectedProduct.quantity}{" "}
                      <span className="font-normal">unit(s)</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white ">Avg Unit Price:</span>
                    <span className=" font-bold text-white  md:text-base">
                      {formatPKR(parseInt(selectedProduct.pricePerUnit))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Quantity Input */}
              <div className="mb-4">
                <label className="block  font-medium text-white mb-1">
                  Quantity *
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  placeholder="Enter quantity"
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <p className=" text-white/90">
                    Available: {currentStock} unit(s)
                  </p>
                  {isQuantityExceedingStock && (
                    <div className="flex items-center gap-1 bg-red-500/70 border border-red-600 rounded-full px-2 py-1">
                      <span className="text-white  font-semibold">
                        Out of stock!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Selling Price Input */}
              <div className="mb-4">
                <label className="block  font-medium text-white mb-1">
                  Selling Price *
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={handlePriceChange}
                  className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  placeholder="Enter selling price"
                  required
                />
                <p className=" text-white/90 mt-1">
                  Unit price:{" "}
                  {formatPKR(parseFloat(selectedProduct.pricePerUnit))}
                </p>
              </div>

              {/* Discount Input - Half Width */}
              <div className="mb-4 md:col-span-1">
                <label className="block  font-medium text-white mb-1">
                  Discount (%) *
                </label>
                <input
                  type="text"
                  value={discount}
                  onChange={handleDiscountChange}
                  className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  placeholder="Enter discount %"
                  max={100}
                  required
                />
                <p className=" text-white/90 mt-1">Required (0-100%)</p>
              </div>

              {/* Payment Method Dropdown */}
              <div className="mb-4">
                <label className="block  font-medium text-white mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={handlePaymentMethodChange}
                  className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all scrollbar-hide"
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
                <p className="block  text-white/90">Required payment method</p>
              </div>
            </div>

            {/* Financial Summary Section */}
            <div className="bg-cyan-800/70 backdrop-blur-md border border-cyan-800 rounded-md p-4 md:p-6 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-cyan-900">📈</span>
                Financial Summary
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left column - detailed financial breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-cyan-800/90 backdrop-blur-md border border-cyan-900 rounded-md">
                    <span className="text-white">Subtotal:</span>
                    <span className="font-bold text-white">
                      {formatPKR(parseFloat(price) * parseInt(quantity || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-cyan-800/90 backdrop-blur-md border border-cyan-900 rounded-md">
                    <span className="text-white">Discount:</span>
                    <span className="font-semibold text-white">
                      {discount}% (
                      {formatPKR(
                        (parseFloat(price) *
                          parseInt(quantity || 0) *
                          parseFloat(discount || 0)) /
                          100,
                      )}
                      )
                    </span>
                  </div>
                </div>

                {/* Right column - total amount highlight */}
                <div className="flex flex-col justify-center p-4 bg-cyan-800/90 backdrop-blur-md border border-cyan-900 rounded-md">
                  <span className="text-white  md:text-base mb-2">
                    Final Amount:
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-white">
                    {formatPKR(finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkout Section */}
            <div className="mt-6 pt-6 border-t border-white/30">
              <button
                onClick={handleCheckout}
                disabled={!isCheckoutEnabled}
                className={`w-full py-4 rounded-md text-lg transition-all duration-300 cursor-pointer font-bold flex justify-center items-center gap-3 shadow-lg ${
                  isCheckoutEnabled
                    ? "bg-cyan-950/80 hover:bg-cyan-950 border border-white/30 hover:shadow-cyan-500/25"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-600"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                {currentStock <= 0 ? "Out of Stock" : "Proceed to Checkout"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal - Same style as AddStock */}
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50 p-4">
          <div className="bg-cyan-800/90 backdrop-blur-md border border-cyan-900 rounded-md p-6 w-full max-w-md text-white">
            {/* Modal header */}
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-purple-900">⚠️</span>
              Confirm Sale Transaction
            </h3>

            {/* Confirmation details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-white">Product:</span>
                <span className="font-semibold">{selectedProduct?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Invoice ID:</span>
                <span className="font-mono font-bold text-white">
                  {newInvoiceId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Quantity:</span>
                <span className="font-semibold text-white">
                  {quantity} unit(s)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Unit Price:</span>
                <span className="font-semibold text-white">
                  {formatPKR(parseFloat(price))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Discount:</span>
                <span className="font-semibold text-white">
                  {discount}% (
                  {formatPKR(
                    (parseFloat(price) *
                      parseInt(quantity || 0) *
                      parseFloat(discount || 0)) /
                      100,
                  )}
                  )
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Payment Method:</span>
                <span className="font-semibold text-black bg-white/90 px-2 py-1 rounded-full ">
                  {getPaymentMethodDisplay(paymentMethod)}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-2">
                <span className="text-white">Final Amount:</span>
                <span className="font-bold text-white">
                  {formatPKR(finalTotal)}
                </span>
              </div>
            </div>

            {/* Confirmation message */}
            <p className="text-white  mb-6">
              Are you sure you want to process this sale transaction?
            </p>

            {/* Modal action buttons */}
            <div className="flex gap-3">
              {/* Cancel button */}
              <button
                onClick={handleCancelCheckout}
                className="flex-1 py-3 border border-white/30 rounded-md bg-red-700 hover:bg-red-800 transition-all duration-300 cursor-pointer font-semibold"
              >
                Cancel
              </button>

              {/* Confirm button */}
              <button
                onClick={handleConfirmCheckout}
                className="flex-1 py-3 border border-white/30 rounded-md bg-cyan-950/70 hover:bg-cyan-950 transition-all duration-300 cursor-pointer font-semibold flex justify-center items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptModalOpen && currentTransaction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 p-2 md:p-4 backdrop-blur-md print:p-0">
          <div className="bg-white text-black rounded-lg w-full max-w-md mx-auto max-h-[95vh] overflow-y-auto scrollbar-hide relative font-sans  border border-gray-300">
            {/* Modal body content */}
            <div className="p-4 space-y-3">
              {/* Header section with company info */}
              <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
                <h2 className="text-xl font-bold tracking-wider text-gray-900">
                  ZUBI ELECTRONICS
                </h2>
                <p className=" text-gray-600 mt-1">Sale Receipt</p>
                <div className="mt-1 space-y-1">
                  <p className=" font-semibold text-gray-700">
                    Invoice: {currentTransaction.invoiceId}
                  </p>
                  <p className=" text-gray-600">
                    {new Date(currentTransaction.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Product details section */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">Product ID:</span>
                  <span className="text-gray-900 text-right font-mono">
                    {currentTransaction.productId}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="text-gray-900 text-right">
                    {currentTransaction.productName}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">Model:</span>
                  <span className="text-gray-900 text-right">
                    {currentTransaction.productModel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="text-gray-900 text-right">
                    {currentTransaction.productCategory}
                  </span>
                </div>
              </div>

              {/* Sale details section */}
              <div className="border-t border-dashed border-gray-300 pt-3 mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">Quantity:</span>
                  <span className="text-gray-900 text-right">
                    {currentTransaction.quantitySold} unit(s)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">Unit Price:</span>
                  <span className="text-gray-900 text-right">
                    {formatPKR(currentTransaction.salePrice)}
                  </span>
                </div>
                {currentTransaction.discount >= 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium text-gray-700">
                        Discount:
                      </span>
                      <span className="text-gray-900 text-right">
                        {formatPKR(
                          (currentTransaction.salePrice *
                            currentTransaction.quantitySold *
                            currentTransaction.discount) /
                            100,
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Total value highlight section */}
              <div className="bg-green-200 border border-green-900 rounded-md p-2 mt-3">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-bold text-green-900">Total:</span>
                  <span className="font-bold text-green-900 text-right">
                    {formatPKR(currentTransaction.finalTotal)}
                  </span>
                </div>
              </div>

              {/* Payment information */}
              <div className="border-t border-dashed border-gray-300 pt-3 mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">
                    Payment Method:
                  </span>
                  <span className="text-gray-900 text-right">
                    {getPaymentMethodDisplay(currentTransaction.paymentMethod)}
                  </span>
                </div>
              </div>

              {/* Footer disclaimer */}
              <div className="text-center border-t border-dashed border-gray-300 pt-4  text-gray-600">
                <p>Thank you for your purchase!</p>
                <p>This is a computer-generated receipt.</p>
              </div>
            </div>

            {/* Modal action buttons (sticky footer) */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-lg p-2 print:hidden">
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                {/* Print button */}
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded hover:cursor-pointer bg-blue-600 text-white hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <span>🖨️</span>
                  <span>Print</span>
                </button>

                {/* Close modal button */}
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded hover:cursor-pointer bg-gray-600 text-white hover:bg-gray-700 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// |===============================| Export |===============================|
export default Cash;
