// |===============================| Import Components |===============================|
import React, { useState, useEffect, useMemo, useCallback } from "react";
import ReactDOMServer from "react-dom/server";
import { TrendingUp } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../../../utils/api";
import usePrint from "../../hooks/usePrint";
import PrintableInvoice from "./PrintableInvoice";

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

// |===============================| PKR Currency Formatter |===============================|
const formatPKR = (amount) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// |===============================| Invoice Number Generator |===============================|
const generateInvoiceNumber = () => {
  try {
    const existingSales =
      JSON.parse(localStorage.getItem("salesHistory")) || [];
    const installmentSales = existingSales.filter(
      (sale) =>
        sale.type === "installment-sale" || sale.invoiceId?.startsWith("INST-"),
    );

    if (installmentSales.length === 0) {
      return "INST-0001";
    }

    // Extract all INST invoice numbers and find the highest
    const instInvoices = installmentSales
      .map((sale) => sale.invoiceId)
      .filter((invoice) => invoice && invoice.startsWith("INST-"))
      .map((invoice) => {
        const numPart = invoice.split("-")[1];
        return parseInt(numPart);
      })
      .filter((num) => !isNaN(num));

    if (instInvoices.length === 0) {
      return "INST-0001";
    }

    const highestNumber = Math.max(...instInvoices);
    const nextNumber = highestNumber + 1;
    return `INST-${nextNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    return `INST-${Date.now().toString().slice(-4)}`;
  }
};

// |===============================| Main Installment Component |===============================|
const Installment = () => {
  // |===============================| Utility Functions |===============================|
  const formatDateTime = useCallback((dateInput) => {
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
  }, []);

  // Safe client id generator (fallback when crypto.randomUUID is unavailable)
  const generateClientId = useCallback(() => {
    try {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        return crypto.randomUUID();
      }
    } catch {
      // ignore
    }
    return `id-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }, []);

  const formatNumber = useCallback((number) => {
    if (!number || isNaN(number)) return "0.00";
    return parseFloat(number).toFixed(2);
  }, []);

  const getNextMonthDate = useCallback((date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== new Date(date).getDate()) {
      d.setDate(0);
    }
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // |===============================| State Management |===============================|
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [guarantors, setGuarantors] = useState([]);

  // Transaction State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedGuarantorId, setSelectedGuarantorId] = useState("");
  const [planMonths, setPlanMonths] = useState(3);
  const [markupRate, setMarkupRate] = useState("0");
  const [advancePayment, setAdvancePayment] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [newInvoiceId, setNewInvoiceId] = useState("");
  const [showFullAdvanceWarning, setShowFullAdvanceWarning] = useState(false);

  // |===============================| Data Loading Effects |===============================|
  useEffect(() => {
    let mounted = true;

    const fetchPurchases = async () => {
      try {
        const res = await api.get("/purchases");
        const data = res.data;
        if (!mounted) return;
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
        return;
      } catch (err) {
        console.warn(
          "Could not fetch purchases from server, falling back to localStorage",
          err,
        );
      }

      try {
        const stored = localStorage.getItem("products");
        if (stored && mounted) {
          const productsData = JSON.parse(stored);
          setProducts(productsData);
        } else if (mounted) {
          setProducts([]);
        }
      } catch {
        console.error("Error loading products from localStorage.");
        if (mounted) setProducts([]);
      }
    };

    const fetchCustomers = async () => {
      try {
        // Fetch customers (server-side Customer documents) so we have customerId and userId
        const res = await api.get("/customers");
        const data = res.data;
        console.log("[INSTALLMENT] Raw customer data from API:", data);

        if (!mounted) return;

        if (!Array.isArray(data)) {
          console.warn("Customers API did not return an array:", data);
          setCustomers([]);
          return;
        }

        const formatted = data.map((c) => ({
          userId: c._id || String(c.userId || ""),
          customerId: c.customerId || "",
          name: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
          email: c.email || "",
          cnic: c.cnic || "",
          status: c.status || "Active",
        }));

        console.log("[INSTALLMENT] Formatted customers:", formatted);

        // Deduplicate customers by customerId (unique per customer)
        const seen = new Set();
        const unique = [];
        for (const c of formatted) {
          const key = c.customerId || c.userId || "";
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(c);
            console.log(
              "[INSTALLMENT] Added customer to unique list:",
              c.name,
              "key:",
              key,
            );
          } else {
            console.log(
              "[INSTALLMENT] Skipped duplicate customer:",
              c.name,
              "key:",
              key,
            );
          }
        }

        console.log("[INSTALLMENT] Final unique customers:", unique);
        setCustomers(unique);
      } catch (err) {
        console.error("Failed to fetch customers", err);
        setCustomers([]);
      }
    };

    const fetchGuarantors = async () => {
      try {
        const res = await api.get("/guarantors");
        const data = res.data;
        if (!mounted) return;
        const formatted = (Array.isArray(data) ? data : []).map((g) => ({
          id: g.guarantorId || g._id,
          name: `${g.firstName || ""} ${g.lastName || ""}`.trim(),
          contact: g.contact || "",
          cnic: g.cnic || "",
          city: g.city || "",
          address: g.address || "",
        }));
        setGuarantors(formatted);
        return;
      } catch (err) {
        console.warn(
          "Could not fetch guarantors from server, falling back to localStorage",
          err,
        );
      }

      try {
        const storedGuarantors = localStorage.getItem("all_guarantors_data");
        if (storedGuarantors && mounted) {
          const guarantorsData = JSON.parse(storedGuarantors);
          const formattedGuarantors = guarantorsData.map((guarantor) => ({
            id: guarantor.guarantorId,
            name: `${guarantor.firstName} ${guarantor.lastName}`,
            contact: guarantor.contact,
            cnic: guarantor.cnic,
            city: guarantor.city ? guarantor.city : "",
            address: guarantor.address ? guarantor.address : "",
          }));
          setGuarantors(formattedGuarantors);
        } else if (mounted) {
          setGuarantors([]);
        }
      } catch (error) {
        console.error("Error loading guarantors:", error);
        if (mounted) setGuarantors([]);
      }
    };

    // Run all fetches in parallel but tolerate failures per-endpoint
    Promise.all([fetchPurchases(), fetchCustomers(), fetchGuarantors()]).then(
      () => {
        console.log("[INSTALLMENT] All data fetched successfully");
      },
    );

    setNewInvoiceId(generateInvoiceNumber());

    return () => {
      mounted = false;
    };
  }, []);

  // |===============================| Computed Values & Memoized Calculations |===============================|
  const totalSellingPrice = useMemo(() => {
    const unitPrice = parseFloat(price) || 0;
    const qty = parseInt(quantity) || 1;
    return parseFloat(formatNumber(unitPrice * qty));
  }, [price, quantity, formatNumber]);

  const markupAmount = useMemo(() => {
    const salePrice = totalSellingPrice;
    const rate = parseFloat(markupRate) || 0;
    if (salePrice <= 0) return 0;
    const amount = salePrice * (rate / 100);
    return parseFloat(formatNumber(amount));
  }, [totalSellingPrice, markupRate, formatNumber]);

  const discountAmount = useMemo(() => {
    const salePrice = totalSellingPrice;
    const discountPercent = parseFloat(discount) || 0;
    if (salePrice <= 0 || discountPercent <= 0) return 0;
    const amount = salePrice * (discountPercent / 100);
    return parseFloat(formatNumber(amount));
  }, [totalSellingPrice, discount, formatNumber]);

  const subtotal = useMemo(() => {
    const salePrice = totalSellingPrice;
    const amount = salePrice - discountAmount;
    return parseFloat(formatNumber(amount));
  }, [totalSellingPrice, discountAmount, formatNumber]);

  const finalTotal = useMemo(() => {
    const amount = subtotal + markupAmount;
    return parseFloat(formatNumber(amount));
  }, [subtotal, markupAmount, formatNumber]);

  const downPaymentAmount = useMemo(() => {
    const advanceAmount = parseFloat(advancePayment) || 0;
    if (finalTotal <= 0 || advanceAmount <= 0) return 0;
    const amount = Math.min(advanceAmount, finalTotal);
    return parseFloat(formatNumber(amount));
  }, [finalTotal, advancePayment, formatNumber]);

  const remainingAmount = useMemo(() => {
    const amount = finalTotal - downPaymentAmount;
    return parseFloat(formatNumber(amount));
  }, [finalTotal, downPaymentAmount, formatNumber]);

  // Helper function to round amount to nearest 100 or 500
  const roundToNearestHundredOrFiveHundred = useCallback((amount) => {
    if (amount <= 0) return 0;

    // Round to nearest 100
    const roundedTo100 = Math.round(amount / 100) * 100;

    // Round to nearest 500
    const roundedTo500 = Math.round(amount / 500) * 500;

    // Choose whichever is closer
    const diff100 = Math.abs(amount - roundedTo100);
    const diff500 = Math.abs(amount - roundedTo500);

    return diff100 <= diff500 ? roundedTo100 : roundedTo500;
  }, []);

  const monthlyPayment = useMemo(() => {
    if (remainingAmount <= 0 || planMonths <= 0) return 0;
    const baseAmount = remainingAmount / planMonths;
    // Round to nearest 100 or 500
    const rounded = roundToNearestHundredOrFiveHundred(baseAmount);
    return parseFloat(formatNumber(rounded));
  }, [
    remainingAmount,
    planMonths,
    formatNumber,
    roundToNearestHundredOrFiveHundred,
  ]);

  const isFullAdvancePayment = useMemo(() => {
    return downPaymentAmount >= finalTotal && remainingAmount <= 0;
  }, [downPaymentAmount, finalTotal, remainingAmount]);

  const isQuantityAvailable = useMemo(() => {
    if (!selectedProduct) return true;
    const availableQty = parseInt(selectedProduct.quantity) || 0;
    const requestedQty = parseInt(quantity) || 1;
    return requestedQty <= availableQty;
  }, [selectedProduct, quantity]);

  const timeline = useMemo(() => {
    if (remainingAmount <= 0 || planMonths <= 0) return [];
    const today = new Date();
    const timelineData = [];

    // Calculate total of rounded monthly payments
    const totalRoundedPayments = monthlyPayment * planMonths;

    // Calculate remainder to add to last installment
    const remainder = remainingAmount - totalRoundedPayments;

    for (let i = 1; i <= planMonths; i++) {
      const isLastPayment = i === planMonths;
      const paymentAmount = isLastPayment
        ? monthlyPayment + remainder // Add remainder to last installment
        : monthlyPayment;

      timelineData.push({
        dueDate: getNextMonthDate(today, i),
        paymentAmount: parseFloat(formatNumber(paymentAmount)),
        paymentNumber: i,
      });
    }
    return timelineData;
  }, [
    remainingAmount,
    planMonths,
    monthlyPayment,
    getNextMonthDate,
    formatNumber,
  ]);

  const selectedCustomerStatus = useMemo(() => {
    if (!selectedUserId) return null;
    const customer = customers.find((c) => c.userId === selectedUserId);
    return customer ? customer.status : null;
  }, [selectedUserId, customers]);

  // |===============================| Product Selection Effect |===============================|
  useEffect(() => {
    if (selectedProductId) {
      const found = products.find((p) => p.productId === selectedProductId);
      if (found) {
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
        setQuantity("1");
        setPrice("0");
        setDiscount("0");
        setMarkupRate("0");
        setAdvancePayment("0");
        setPaymentMethod("Select Payment Method");
        setShowFullAdvanceWarning(false);
      } else {
        setSelectedProduct(null);
        setQuantity("1");
        setPrice("");
        setDiscount("0");
        setMarkupRate("0");
        setAdvancePayment("0");
        setPaymentMethod("");
        setShowFullAdvanceWarning(false);
      }
    } else {
      setSelectedProduct(null);
      setQuantity("1");
      setPrice("");
      setDiscount("0");
      setMarkupRate("0");
      setAdvancePayment("0");
      setPaymentMethod("");
      setShowFullAdvanceWarning(false);
    }
  }, [selectedProductId, products]);

  // |===============================| Helper Functions |===============================|
  const getPaymentMethodDisplay = useCallback((method) => {
    return method;
  }, []);

  const renderInputGroup = useCallback(
    ({ label, children }) => (
      <div className="mb-4">
        <label className="block  font-medium text-white mb-1">{label}</label>
        {children}
      </div>
    ),
    [],
  );

  const renderTimelineTable = useCallback(
    () => (
      <div className="mt-6">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
          <span className="text-white mr-2">📅</span>
          Payment Timeline ({planMonths} Payments)
        </h3>
        <div className="overflow-x-auto shadow-lg rounded-md border border-white/20 backdrop-blur-md">
          <table className="min-w-full divide-y divide-white/20">
            <thead className="bg-cyan-950/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                  Payment Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/5 divide-y divide-white/10">
              {timeline.map((item, index) => (
                <tr
                  key={index}
                  className={
                    index % 2 === 0 ? "bg-cyan-950/30" : "bg-cyan-950/30"
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap  font-medium text-white">
                    {item.paymentNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap  text-white">
                    {item.dueDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap  font-bold text-right text-white">
                    {formatPKR(item.paymentAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
    [planMonths, timeline],
  );

  // |===============================| Validation & Business Logic |===============================|
  const validateFields = useCallback(() => {
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

    const qty = parseInt(quantity) || 1;
    if (!quantity || isNaN(qty) || qty <= 0) {
      toast.error("Valid quantity is required!", {
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

    const availableQty = parseInt(selectedProduct.quantity) || 0;
    if (qty > availableQty) {
      toast.error(`Only ${availableQty} units available in stock!`, {
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

    const salePrice = parseFloat(price);
    if (!price || isNaN(salePrice) || salePrice <= 0) {
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

    const markupPercent = parseFloat(markupRate) || 0;
    if (
      markupRate === "" ||
      isNaN(markupPercent) ||
      markupPercent < 0 ||
      markupPercent > 100
    ) {
      toast.error("Markup rate is required and must be between 0% and 100%!", {
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

    const advanceAmount = parseFloat(advancePayment) || 0;
    if (
      advancePayment === "" ||
      isNaN(advanceAmount) ||
      advanceAmount < 0 ||
      advanceAmount > finalTotal
    ) {
      toast.error(
        `Down payment is required and must be between 0 and ${finalTotal}!`,
        {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        },
      );
      return false;
    }

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

    if (!selectedUserId) {
      toast.error("Please select a customer!", {
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

    const customer = customers.find((c) => c.userId === selectedUserId);
    if (customer) {
      if (customer.status === "Inactive") {
        toast.error(
          "Customer status is Inactive! Cannot process installment sale.",
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "dark",
          },
        );
        return false;
      } else if (customer.status === "Suspended") {
        toast.error(
          "Customer status is Suspended! Cannot process installment sale.",
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "dark",
          },
        );
        return false;
      }
    }

    if (!selectedGuarantorId) {
      toast.error("Please select a guarantor!", {
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
  }, [
    selectedProduct,
    quantity,
    price,
    discount,
    markupRate,
    advancePayment,
    finalTotal,
    paymentMethod,
    selectedUserId,
    selectedGuarantorId,
    customers,
  ]);

  // |===============================| Checkout Process |===============================|
  const processCheckout = useCallback(async () => {
    const invoiceNumber = newInvoiceId || generateInvoiceNumber();
    const selectedCustomer = customers.find((c) => c.userId === selectedUserId);
    const selectedGuarantor = guarantors.find(
      (g) => g.id === selectedGuarantorId,
    );

    const transactionDetails = {
      id: generateClientId(),
      invoiceId: invoiceNumber,
      timestamp: new Date().toISOString(),
      type: "installment-sale",
      productId: selectedProduct.productId,
      productName: selectedProduct.name,
      productModel: selectedProduct.model,
      productCategory: selectedProduct.category,
      quantity: parseInt(quantity),
      customerType: "installment",
      customer: selectedCustomer?.name,
      customerId: selectedCustomer?.userId,
      customerStatus: selectedCustomer?.status,
      guarantor: selectedGuarantor?.name,
      guarantorId: selectedGuarantor?.id,
      unitPrice: parseFloat(price),
      discount: parseFloat(discount),
      discountAmount: discountAmount,
      subtotal: subtotal,
      markupRate: `${markupRate}%`,
      markupAmount: markupAmount,
      advancePayment: downPaymentAmount,
      downPaymentAmount: downPaymentAmount,
      remainingAmount: remainingAmount,
      planMonths: planMonths,
      monthlyPayment: monthlyPayment,
      finalTotal: finalTotal,
      paymentTimeline: timeline,
      company: selectedProduct.company,
      pricePerUnit: selectedProduct.pricePerUnit,
      inventoryValue: selectedProduct.value,
      paymentMethod: paymentMethod,
      isFullAdvancePayment: isFullAdvancePayment,
    };
    try {
      const payload = {
        invoiceId: invoiceNumber,
        saleType: "installment",
        products: [
          {
            productId: selectedProduct.productId,
            name: selectedProduct.name,
            model: selectedProduct.model,
            category: selectedProduct.category,
            unitPrice: parseFloat(price),
            quantity: parseInt(quantity),
            discount: parseFloat(discount),
            total: finalTotal,
          },
        ],
        userId: selectedCustomer?.userId,
        customerId: selectedCustomer?.customerId,
        guarantorId: selectedGuarantor?.id,
        paymentMethod: paymentMethod,
        planMonths: planMonths,
        markupRate: parseFloat(markupRate) || 0,
        advancePayment: downPaymentAmount,
        monthlyPayment: monthlyPayment,
        timeline: timeline.map((t) => ({
          paymentNumber: t.paymentNumber,
          dueDate: t.dueDate,
          paymentAmount: t.paymentAmount,
        })),
        subtotal: subtotal,
        discountAmount: discountAmount,
        markupAmount: markupAmount,
        finalTotal: finalTotal,
        remainingAmount: remainingAmount,
      };

      console.log("[INSTALLMENT] Sending payload to /sales:", {
        invoiceId: payload.invoiceId,
        saleType: payload.saleType,
        userId: payload.userId,
        customerId: payload.customerId,
        guarantorId: payload.guarantorId,
        products: payload.products?.length,
      });

      const res = await api.post("/sales", payload);

      const saved = res.data;
      console.log("[INSTALLMENT] Sale created successfully:", saved._id);

      // Update product stock in localStorage (mirror server change)
      const updatedProducts = products.map((p) => {
        if (p.productId === selectedProduct.productId) {
          const currentQty = parseInt(p.quantity) || 0;
          const soldQty = parseInt(quantity) || 1;
          const newQty = Math.max(0, currentQty - soldQty);

          const originalPricePerUnit =
            parseFloat(p.pricePerUnit) || parseFloat(p.price) || 0;
          const newValue = (newQty * originalPricePerUnit).toFixed(2);
          const newPricePerUnit = originalPricePerUnit.toFixed(2);

          return {
            ...p,
            quantity: newQty.toString(),
            value: newValue,
            pricePerUnit: newPricePerUnit,
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

      const historyEntry = {
        ...transactionDetails,
        serverId: saved._id,
      };

      const updatedSalesHistory = [...existingSalesHistory, historyEntry];
      localStorage.setItem("salesHistory", JSON.stringify(updatedSalesHistory));

      // Set current transaction for receipt
      setCurrentTransaction(historyEntry);

      // Show success toast
      if (isFullAdvancePayment) {
        toast.success(
          "Installment sale completed with 100% down payment! Consider cash sales for full payments.",
          { position: "top-right", autoClose: 4000, theme: "dark" },
        );
      } else {
        toast.success("Installment sale completed successfully!", {
          position: "top-right",
          autoClose: 2000,
          theme: "dark",
        });
      }

      // Open receipt modal and reset state
      setIsReceiptModalOpen(true);
      setShowConfirmation(false);
      setShowFullAdvanceWarning(false);
      setSelectedProductId("");
      setSelectedProduct(null);
      setQuantity("1");
      setPrice("");
      setDiscount("0");
      setSelectedUserId("");
      setSelectedGuarantorId("");
      setMarkupRate("0");
      setAdvancePayment("0");
      setPaymentMethod("Cash");
      setPlanMonths(3);
      setNewInvoiceId(generateInvoiceNumber());
    } catch (err) {
      console.error("Installment sale error", err);
      toast.error(
        err?.response?.data?.error || "Failed to create installment sale.",
        { position: "top-right", autoClose: 3000, theme: "dark" },
      );
      setShowConfirmation(false);
    }
  }, [
    newInvoiceId,
    generateClientId,
    customers,
    selectedUserId,
    guarantors,
    selectedGuarantorId,
    selectedProduct,
    quantity,
    price,
    discount,
    discountAmount,
    subtotal,
    markupRate,
    markupAmount,
    downPaymentAmount,
    remainingAmount,
    planMonths,
    monthlyPayment,
    finalTotal,
    timeline,
    products,
    paymentMethod,
    isFullAdvancePayment,
  ]);

  // |===============================| Event Handlers |===============================|
  const handleCheckout = useCallback(() => {
    if (!validateFields()) {
      return;
    }

    if (isFullAdvancePayment) {
      setShowFullAdvanceWarning(true);
      toast.error(
        "Cannot process installment sale with 100% down payment. Please make a cash sale instead or reduce the down payment amount.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        },
      );
      return;
    }

    setShowConfirmation(true);
  }, [validateFields, isFullAdvancePayment]);

  const handleConfirmCheckout = useCallback(() => {
    processCheckout();
  }, [processCheckout]);

  const handleCancelCheckout = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  const handleQuantityChange = useCallback((e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      const qty = parseInt(value) || 1;
      if (qty >= 1) {
        setQuantity(value);
      }
    }
    setShowFullAdvanceWarning(false);
  }, []);

  const handlePriceChange = useCallback((e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPrice(value);
    }
    setShowFullAdvanceWarning(false);
  }, []);

  const handleDiscountChange = useCallback((e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setDiscount(value);
    }
    setShowFullAdvanceWarning(false);
  }, []);

  const handleMarkupChange = useCallback((e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setMarkupRate(value);
    }
    setShowFullAdvanceWarning(false);
  }, []);

  const handleAdvancePaymentChange = useCallback((e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAdvancePayment(value);
    }
    setShowFullAdvanceWarning(false);
  }, []);

  const handlePaymentMethodChange = useCallback((e) => {
    setPaymentMethod(e.target.value);
    setShowFullAdvanceWarning(false);
  }, []);

  // |===============================| Print Hook |===============================|
  const { print } = usePrint();

  const handlePrint = useCallback(() => {
    if (!currentTransaction) {
      toast.error("No transaction data available");
      return;
    }

    try {
      // Render PrintableInvoice component to HTML string
      const invoiceHTML = ReactDOMServer.renderToStaticMarkup(
        <PrintableInvoice data={currentTransaction} />,
      );

      // Print using iframe approach
      print(invoiceHTML);
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to print invoice");
    }
  }, [currentTransaction, print]);

  const handleCloseModal = useCallback(() => {
    window.location.href = "/up";
    setIsReceiptModalOpen(false);
  }, []);

  // |===============================| Checkout Enablement Logic |===============================|
  const isCheckoutEnabled =
    selectedProductId &&
    quantity &&
    parseInt(quantity) > 0 &&
    isQuantityAvailable &&
    price &&
    parseFloat(price) > 0 &&
    discount !== "" &&
    !isNaN(parseFloat(discount)) &&
    parseFloat(discount) >= 0 &&
    parseFloat(discount) <= 100 &&
    markupRate !== "" &&
    !isNaN(parseFloat(markupRate)) &&
    parseFloat(markupRate) >= 0 &&
    parseFloat(markupRate) <= 100 &&
    advancePayment !== "" &&
    !isNaN(parseFloat(advancePayment)) &&
    parseFloat(advancePayment) >= 0 &&
    parseFloat(advancePayment) <= finalTotal &&
    paymentMethod &&
    selectedUserId &&
    selectedGuarantorId;

  // |===============================| Component Render |===============================|
  return (
    <>
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
        style={{ zIndex: 9999 }}
      />

      <div
        className={`bg-white/10 p-6 rounded-lg border border-white/20 backdrop-blur-md transition-all duration-300 ${
          isReceiptModalOpen || showConfirmation ? "backdrop-blur-md" : ""
        }`}
      >
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2" />
          Installment Sales
        </h2>

        {/* Product Selection */}
        <div className="mb-6">
          <label className="block  font-medium text-white mb-1">
            Select Product *
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all scrollbar-hide"
          >
            <option value="" className="bg-black/90">
              Select any Product
            </option>
            {products.map((p) => (
              <option
                key={p.productId}
                value={p.productId}
                className="bg-black/90"
              >
                {p.name} - {p.model}
              </option>
            ))}
          </select>
        </div>

        {/* Conditional rendering based on product selection */}
        {!selectedProduct ? (
          <div className="text-center py-12 border-2 border-dashed border-white/20 rounded-md bg-white/5 mb-6">
            <div className="text-white text-4xl mb-4">🛒</div>
            <p className="text-white italic text-base">
              Select a product to begin installment sale
            </p>
            <p className="text-white  mt-2">
              Choose from the dropdown above to process an installment
              transaction
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
                    <span className="text-white ">Name:</span>
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
                          : "text-red-400"
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

            {/* Input Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {renderInputGroup({
                label: "Quantity *",
                children: (
                  <div>
                    <input
                      type="text"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                      placeholder="Enter quantity"
                      required
                    />
                    {!isQuantityAvailable && (
                      <div className=" bg-red-500/70 text-white py-1 px-2 w-max rounded-full font-medium mt-2">
                        Only {selectedProduct.quantity} Piece(s) in stock
                      </div>
                    )}
                    <p className=" text-white/80 mt-1">
                      Available: {selectedProduct.quantity} Piece(s)
                    </p>
                  </div>
                ),
              })}

              {renderInputGroup({
                label: "Selling Price *",
                children: (
                  <>
                    <input
                      type="text"
                      value={price}
                      onChange={handlePriceChange}
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                      placeholder="Enter selling price"
                      required
                    />
                    <p className=" text-white/80 mt-1">
                      Unit price:{" "}
                      {formatPKR(parseFloat(selectedProduct.pricePerUnit))}
                    </p>
                  </>
                ),
              })}

              {renderInputGroup({
                label: "Discount (%) *",
                children: (
                  <>
                    <input
                      type="text"
                      value={discount}
                      onChange={handleDiscountChange}
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                      placeholder="Enter discount %"
                      required
                    />
                    <p className=" text-white/80 mt-1">Required (0-100%)</p>
                  </>
                ),
              })}

              {renderInputGroup({
                label: "Markup Rate (%) *",
                children: (
                  <>
                    <input
                      type="text"
                      value={markupRate}
                      onChange={handleMarkupChange}
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                      placeholder="Enter markup rate"
                      required
                    />
                    <p className=" text-white/80 mt-1">
                      Markup Rate: {markupRate}%
                    </p>
                  </>
                ),
              })}

              {renderInputGroup({
                label: "Down Payment *",
                children: (
                  <>
                    <input
                      type="text"
                      value={advancePayment}
                      onChange={handleAdvancePaymentChange}
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                      placeholder="Enter down amount"
                      required
                    />
                    <p className=" text-white/80 mt-1">Required (PKR)</p>
                  </>
                ),
              })}
            </div>

            {/* Payment Method & Plan Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {renderInputGroup({
                label: "Payment Method *",
                children: (
                  <select
                    value={paymentMethod}
                    onChange={handlePaymentMethodChange}
                    className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all scrollbar-hide"
                  >
                    <option value="" className="bg-black/90">
                      Select Payment Method
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
                ),
              })}

              {renderInputGroup({
                label: "Payment Plan (Months) *",
                children: (
                  <select
                    value={planMonths}
                    onChange={(e) => setPlanMonths(Number(e.target.value))}
                    className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all scrollbar-hide"
                  >
                    {[...Array(24).keys()]
                      .map((i) => i + 1)
                      .map((m) => (
                        <option key={m} value={m} className="bg-black">
                          {m} {m === 1 ? "Month" : "Months"}
                        </option>
                      ))}
                  </select>
                ),
              })}
            </div>

            {/* Customer and Guarantor Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {renderInputGroup({
                label: "Select Customer *",
                children: (
                  <div>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white"
                    >
                      <option value="" className="bg-black">
                        Select Customer
                      </option>

                      {customers.map((u, idx) => {
                        console.log("[INSTALLMENT] Customer option:", {
                          userId: u.userId,
                          customerId: u.customerId,
                          name: u.name,
                        });
                        return (
                          <option
                            key={u.userId || u.customerId || u.email || idx}
                            value={u.userId}
                            className="bg-black"
                          >
                            {u.customerId
                              ? `${u.customerId} - ${u.name}`
                              : u.name}{" "}
                            ({u.cnic})
                          </option>
                        );
                      })}
                    </select>

                    {selectedCustomerStatus && (
                      <div
                        className={` font-medium py-1 px-2 w-max rounded-full ${
                          selectedCustomerStatus === "Active"
                            ? "bg-green-600 border border-white/80"
                            : selectedCustomerStatus === "Inactive"
                              ? "bg-red-600 border border-white/80"
                              : "bg-yellow-600 border border-white/80"
                        }`}
                      >
                        Status: {selectedCustomerStatus}
                      </div>
                    )}
                  </div>
                ),
              })}

              {renderInputGroup({
                label: "Select Guarantor *",
                children: (
                  <select
                    value={selectedGuarantorId}
                    onChange={(e) => setSelectedGuarantorId(e.target.value)}
                    className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all scrollbar-hide"
                  >
                    <option value="" className="bg-black">
                      Select Guarantor
                    </option>
                    {guarantors.map((g) => (
                      <option key={g.id} value={g.id} className="bg-black">
                        {g.name} - ({g.cnic})
                      </option>
                    ))}
                  </select>
                ),
              })}
            </div>

            {/* Price Breakdown Section */}
            <div className="bg-cyan-800/70 backdrop-blur-md border border-cyan-800 rounded-md p-4 mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">
                Price Breakdown
              </h4>
              <div className="space-y-2 ">
                <div className="flex justify-between">
                  <span className="text-white/80">Quantity:</span>
                  <span className="text-white font-medium">
                    {quantity} Piece(s)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Selling Price:</span>
                  <span className="text-white font-medium">
                    {formatPKR(parseFloat(price) || 0)}
                  </span>
                </div>

                {parseFloat(discount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/80">
                      Discount ({discount}%):
                    </span>
                    <span className="text-white font-medium">
                      - {formatPKR(discountAmount)}
                    </span>
                  </div>
                )}
                {downPaymentAmount > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-white/80">Down Payment:</span>
                      <span className="text-white font-medium">
                        - {formatPKR(downPaymentAmount)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-white/80">Subtotal:</span>
                  <span className="text-white font-medium">
                    {formatPKR(subtotal)}
                  </span>
                </div>
                {parseFloat(markupRate) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/80">
                      Markup ({markupRate}%):
                    </span>
                    <span className="text-white font-medium">
                      + {formatPKR(markupAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-white/80">Payment Method:</span>
                  <span className="text-white font-medium">
                    {getPaymentMethodDisplay(paymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white font-semibold">
                    Remaining Amount:
                  </span>
                  <span className="text-white font-bold">
                    {formatPKR(remainingAmount)}
                  </span>
                </div>

                <div className="flex justify-between text-white mb-2">
                  <span className="text-white/80">Monthly Payment:</span>
                  <span className="font-semibold">
                    {formatPKR(monthlyPayment)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-white">
                <span className="font-semibold">Final Total:</span>
                <span className="font-bold text-lg">
                  {formatPKR(finalTotal)}
                </span>
              </div>

              {/* Full Down Payment Warning */}
              {showFullAdvanceWarning && (
                <div className="mt-3 p-3 bg-red-500/20 border border-red-500/40 rounded-md">
                  <div className="flex items-center gap-2 text-red-300 ">
                    <span>⚠️</span>
                    <span className="font-semibold">
                      Full Down Payment Detected
                    </span>
                  </div>
                  <p className="text-red-200 text-xs mt-1">
                    You have paid 100% down payment with no remaining
                    installments. Installment sales require ongoing payments.
                    Please make a cash sale instead or reduce the down payment
                    amount.
                  </p>
                </div>
              )}
            </div>

            {/* Payment Timeline */}
            {timeline.length > 0 && renderTimelineTable()}

            {/* Checkout Button */}
            <div className="mt-6 pt-6 border-t border-white/30">
              <button
                onClick={handleCheckout}
                disabled={
                  !isCheckoutEnabled ||
                  (selectedCustomerStatus &&
                    selectedCustomerStatus !== "Active") ||
                  !isQuantityAvailable
                }
                className={`w-full py-4 rounded-md text-lg transition-all duration-300 cursor-pointer font-bold flex justify-center items-center gap-3 shadow-lg ${
                  isCheckoutEnabled &&
                  selectedCustomerStatus === "Active" &&
                  isQuantityAvailable
                    ? "bg-cyan-950/90 hover:bg-cyan-950 border border-white/30 hover:shadow-cyan-500/25 text-white"
                    : "bg-black/50 text-gray-400 cursor-not-allowed border border-gray-600"
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                Process Installment Sale
              </button>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50 p-4">
          <div className="bg-cyan-800/90 backdrop-blur-md border border-cyan-900 rounded-md p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto scrollbar-hide">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-purple-300">⚠️</span>
              Confirm Installment Sale
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-white">Invoice ID:</span>
                <span className="font-mono font-bold text-white">
                  {newInvoiceId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Product:</span>
                <span className="font-semibold">{selectedProduct?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Model:</span>
                <span className="font-semibold">{selectedProduct?.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Quantity:</span>
                <span className="font-semibold">{quantity} Piece(s)</span>
              </div>

              <div className="flex justify-between">
                <span className="text-white">Customer:</span>
                <span className="font-semibold text-white">
                  {customers.find((c) => c.userId === selectedUserId)?.name}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white">Guarantor:</span>
                <span className="font-semibold text-white">
                  {guarantors.find((g) => g.id === selectedGuarantorId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Selling Price:</span>
                <span className="font-semibold text-white">
                  {formatPKR(parseFloat(price))}
                </span>
              </div>

              {parseFloat(discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-white">Discount:</span>
                  <span className="font-semibold text-white">
                    {discount}% ({formatPKR(discountAmount)})
                  </span>
                </div>
              )}
              {downPaymentAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-white">Down Payment:</span>
                  <span className="font-semibold text-white">
                    {formatPKR(downPaymentAmount)}
                  </span>
                </div>
              )}
              {parseFloat(markupRate) > 0 && (
                <div className="flex justify-between">
                  <span className="text-white">Markup:</span>
                  <span className="font-semibold text-white">
                    {markupRate}% ({formatPKR(markupAmount)})
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-white">Payment Method:</span>
                <span className="font-semibold text-black rounded-full px-2 py-1 bg-white/80">
                  {getPaymentMethodDisplay(paymentMethod)}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-2">
                <span className="text-white">Final Amount:</span>
                <span className="font-bold text-white">
                  {formatPKR(finalTotal)}
                </span>
              </div>
              {downPaymentAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-white">Remaining Amount:</span>
                  <span className="font-semibold text-white">
                    {formatPKR(remainingAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white">Monthly Payment:</span>
                <span className="font-semibold text-white">
                  {formatPKR(monthlyPayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Payment Plan:</span>
                <span className="font-semibold text-white">
                  {planMonths} months
                </span>
              </div>
            </div>

            <p className="text-white  mb-6">
              Are you sure you want to process this installment sale
              transaction?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelCheckout}
                className="flex-1 py-3 border border-white/30 rounded-md bg-red-700 hover:bg-red-800 transition-all duration-300 cursor-pointer font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmCheckout}
                className="flex-1 py-3 border border-white/30 rounded-md bg-cyan-950/70 hover:bg-cyan-950 transition-all duration-300 cursor-pointer font-semibold flex justify-center items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptModalOpen && currentTransaction && (
        <div
          id="invoice-print-container"
          className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 p-2 md:p-4 backdrop-blur-md print:bg-white print:p-0 print:block"
        >
          <div className="bg-white text-black rounded-lg w-full max-w-md mx-auto max-h-[95vh] flex flex-col font-sans border border-gray-300 print:max-h-none print:border-none print:max-w-full">
            {/* Fixed Header */}
            <div className="flex-shrink-0 p-4 border-b border-dashed border-gray-300 print:border-solid">
              <div className="text-center">
                <h2 className="text-xl font-bold tracking-wider text-gray-900">
                  ZUBI ELECTRONICS
                </h2>
                <p className="text-gray-600 mt-1">Installment Sale Receipt</p>
                <div className="mt-1 space-y-1">
                  <p className="text-xs font-semibold text-gray-700">
                    Invoice: {currentTransaction.invoiceId}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatDateTime(currentTransaction.timestamp)}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div
              id="invoice-content-only"
              className="flex-1 overflow-y-auto p-4 space-y-3 print:overflow-visible scrollbar-hide"
            >
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
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">Quantity:</span>
                  <span className="text-gray-900 text-right">
                    {currentTransaction.quantity} Piece(s)
                  </span>
                </div>
              </div>

              {/* Customer and Guarantor Information */}
              <div className="border-t border-dashed border-gray-300 pt-3 mt-3 space-y-2 print:border-solid">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">Customer:</span>
                  <span className="text-gray-900 text-right">
                    {currentTransaction.customerId} -{" "}
                    {currentTransaction.customer}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">Guarantor:</span>
                  <span className="text-gray-900 text-right">
                    {currentTransaction.guarantorId} -{" "}
                    {currentTransaction.guarantor}
                  </span>
                </div>
              </div>

              {/* Sale details section */}
              <div className="border-t border-dashed border-gray-300 pt-3 mt-3 space-y-2 print:border-solid">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">
                    Selling Price:
                  </span>
                  <span className="text-gray-900 text-right">
                    {formatPKR(currentTransaction.unitPrice)}
                  </span>
                </div>

                {currentTransaction.discount > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium text-gray-700">Discount:</span>
                    <span className="text-gray-900 text-right">
                      {currentTransaction.discount}% (
                      {formatPKR(currentTransaction.discountAmount)})
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">Subtotal:</span>
                  <span className="text-gray-900 text-right">
                    {formatPKR(currentTransaction.subtotal)}
                  </span>
                </div>
                {currentTransaction.markupAmount > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium text-gray-700">Markup:</span>
                    <span className="text-gray-900 text-right">
                      {currentTransaction.markupRate} (
                      {formatPKR(currentTransaction.markupAmount)})
                    </span>
                  </div>
                )}
                {currentTransaction.downPaymentAmount > 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium text-gray-700">
                        Down Payment:
                      </span>
                      <span className="text-gray-900 text-right">
                        {formatPKR(currentTransaction.downPaymentAmount)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium text-gray-700">
                        Remaining Amount:
                      </span>
                      <span className="text-gray-900 text-right font-semibold">
                        {formatPKR(currentTransaction.remainingAmount)}
                      </span>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">
                    Payment Method:
                  </span>
                  <span className="text-gray-900 text-right">
                    {getPaymentMethodDisplay(currentTransaction.paymentMethod)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">
                    Payment Plan:
                  </span>
                  <span className="text-gray-900 text-right">
                    {currentTransaction.planMonths} months
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">
                    Monthly Payment:
                  </span>
                  <span className="text-gray-900 text-right font-semibold">
                    {formatPKR(currentTransaction.monthlyPayment)}
                  </span>
                </div>
              </div>

              {/* Total value highlight section */}
              <div className="bg-green-200 border border-green-900 rounded-md p-2 mt-3">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-bold text-green-900">
                    Total Amount:
                  </span>
                  <span className="font-bold text-green-900 text-right">
                    {formatPKR(currentTransaction.finalTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Timeline Summary */}
              <div className="border-t border-dashed border-gray-300 pt-3 mt-3 print:border-solid">
                <h4 className="font-medium text-gray-700 mb-2">
                  Payment Schedule:
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  {currentTransaction.paymentTimeline
                    .slice(0, 3)
                    .map((payment, index) => (
                      <div key={index} className="flex justify-between">
                        <span>Payment {payment.paymentNumber}:</span>
                        <span>
                          {payment.dueDate} - {formatPKR(payment.paymentAmount)}
                        </span>
                      </div>
                    ))}
                  {currentTransaction.paymentTimeline.length > 3 && (
                    <div className="text-center text-gray-500 italic">
                      ... and {currentTransaction.paymentTimeline.length - 3}{" "}
                      more payments
                    </div>
                  )}
                </div>
              </div>

              {/* Footer disclaimer */}
              <div className="text-center border-t border-dashed border-gray-300 pt-4 text-xs text-gray-600 print:border-solid">
                <p>Thank you for your purchase!</p>
                <p>This is a computer-generated installment receipt.</p>
              </div>
            </div>

            {/* Sticky Footer with Buttons */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 rounded-b-lg p-2 print:hidden">
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded hover:cursor-pointer bg-blue-600 text-white hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <span>🖨️</span>
                  <span>Print</span>
                </button>
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
export default Installment;
