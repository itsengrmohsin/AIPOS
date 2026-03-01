import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import ReactDOMServer from "react-dom/server";
import { Calendar, TrendingUp, User } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import api from "../../../../utils/api";
import usePrint from "../../hooks/usePrint";
import PrintableDocument from "../../components/Print/PrintableDocument";

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

const ManageInstallments = () => {
  const [installmentSales, setInstallmentSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({});
  const [guarantorDetails, setGuarantorDetails] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [recentPayments, setRecentPayments] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // New state for payment modal
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  const generateClientId = () =>
    `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

  useEffect(() => {
    const loadData = async () => {
      await loadCustomerAndGuarantorDetails();
      await loadInstallmentSales();
    };
    loadData();
  }, []);

  const loadInstallmentSales = async () => {
    try {
      const res = await api.get("/sales");
      const data = res.data;
      const installmentSales = (Array.isArray(data) ? data : [])
        .filter((sale) => sale.saleType === "installment")
        .map((sale) => ({
          ...sale,
          id: sale._id,
          productName: sale.products?.[0]?.name || "",
          productModel: sale.products?.[0]?.model || "",
          productCategory: sale.products?.[0]?.category || "",
          quantity: sale.products?.[0]?.quantity || 1,
          unitPrice: sale.products?.[0]?.unitPrice || 0,
          discount: sale.products?.[0]?.discount || 0,
          totalPaid: (sale.finalTotal || 0) - (sale.remainingAmount || 0),
          serverId: sale._id,
        }));
      setInstallmentSales(installmentSales);
    } catch (error) {
      console.error("Could not fetch sales from server", error);
      setInstallmentSales([]);
    }
  };

  const generatePaymentReceiptId = () => {
    const installmentHistory =
      JSON.parse(localStorage.getItem("installmentHistory")) || [];
    const nextReceiptNumber = installmentHistory.length + 1;
    return String(nextReceiptNumber).padStart(6, "0");
  };

  const loadCustomerAndGuarantorDetails = async () => {
    try {
      // Fetch customers
      const customersRes = await api.get("/customers");
      const customersData = customersRes.data || [];
      const customerMap = {};
      customersData.forEach((customer) => {
        customerMap[customer.customerId] = {
          firstName: customer.firstName,
          lastName: customer.lastName,
          contact: customer.contact,
          cnic: customer.cnic,
          city: customer.city,
          address: customer.address,
        };
      });
      setCustomerDetails(customerMap);
    } catch (error) {
      console.error("Could not fetch customers from server", error);
      setCustomerDetails({});
    }

    try {
      // Fetch guarantors
      const guarantorsRes = await api.get("/guarantors");
      const guarantorsData = guarantorsRes.data || [];
      const guarantorMap = {};
      guarantorsData.forEach((guarantor) => {
        guarantorMap[guarantor.guarantorId] = {
          firstName: guarantor.firstName,
          lastName: guarantor.lastName,
          contact: guarantor.contact,
          cnic: guarantor.cnic,
          city: guarantor.city,
          address: guarantor.address,
        };
      });
      setGuarantorDetails(guarantorMap);
    } catch (error) {
      console.error("Could not fetch guarantors from server", error);
      setGuarantorDetails({});
    }
  };

  const filteredSales = useMemo(() => {
    return installmentSales.filter((sale) => {
      const customer = customerDetails[sale.customerId];
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        (sale.customer &&
          sale.customer.toLowerCase().includes(searchTermLower)) ||
        (sale.productName &&
          sale.productName.toLowerCase().includes(searchTermLower)) ||
        (sale.invoiceId &&
          sale.invoiceId.toLowerCase().includes(searchTermLower)) ||
        (customer &&
          ((customer.firstName &&
            customer.firstName.toLowerCase().includes(searchTermLower)) ||
            (customer.lastName &&
              customer.lastName.toLowerCase().includes(searchTermLower)) ||
            (customer.cnic && customer.cnic.includes(searchTerm)) ||
            (customer.contact && customer.contact.includes(searchTerm))));

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && sale.remainingAmount > 0) ||
        (filterStatus === "completed" && sale.remainingAmount <= 0);

      return matchesSearch && matchesStatus;
    });
  }, [installmentSales, searchTerm, filterStatus, customerDetails]);

  const getPaymentStatus = (sale) => {
    if (sale.remainingAmount <= 0) return "COMPLETED";
    return "ACTIVE";
  };

  // NEW LOGIC: Get next due installment strictly following the plan
  const getNextDueInstallment = (sale) => {
    if (!sale.timeline || sale.timeline.length === 0) {
      return null;
    }

    // Find the first unpaid installment in chronological order
    return sale.timeline.find((payment) => !payment.paid) || null;
  };

  const getNextDueInfo = (sale) => {
    const nextPayment = getNextDueInstallment(sale);
    if (!nextPayment) return { dueDate: "—", amount: 0, isOverdue: false };

    const today = new Date();
    const dueDate = new Date(nextPayment.dueDate);
    const isOverdue = dueDate < today;

    return {
      dueDate: formatShortDate(nextPayment.dueDate),
      amount: nextPayment.paymentAmount,
      isOverdue: isOverdue,
      installment: nextPayment,
    };
  };

  const initials = (customer) =>
    `${(customer?.firstName || "").charAt(0)}${(
      customer?.lastName || ""
    ).charAt(0)}`.toUpperCase();

  const hasOverduePayments = (sale) => {
    if (!sale.timeline || sale.remainingAmount <= 0) return false;

    const today = new Date();
    return sale.timeline.some(
      (payment) => !payment.paid && new Date(payment.dueDate) < today
    );
  };

  const getRemainingInstallments = (sale) => {
    if (!sale.timeline) return 0;
    return sale.timeline.filter((payment) => !payment.paid).length;
  };

  const getPaidInstallments = (sale) => {
    if (!sale.timeline) return 0;
    return sale.timeline.filter((payment) => payment.paid).length;
  };

  const getTotalInstallments = (sale) => {
    return sale.timeline ? sale.timeline.length : 0;
  };

  const getPaymentHistory = (sale) => {
    if (!sale.timeline) return [];

    const history = [];
    let runningBalance = sale.finalTotal;

    sale.timeline.forEach((payment, index) => {
      if (payment.paid) {
        const paidAmount = payment.actualAmount || payment.paymentAmount;
        runningBalance -= paidAmount;

        history.push({
          type: "paid",
          installmentNumber: index + 1,
          date: payment.paymentDate,
          amount: paidAmount,
          remaining: runningBalance,
          method: payment.paymentMethod || "Cash",
          status: "PAID",
        });
      } else {
        const today = new Date();
        const dueDate = new Date(payment.dueDate);
        const isOverdue = dueDate < today;

        history.push({
          type: "due",
          installmentNumber: index + 1,
          date: payment.dueDate,
          amount: payment.paymentAmount,
          remaining: runningBalance,
          method: "",
          status: isOverdue ? "OVERDUE" : "PENDING",
        });

        runningBalance -= payment.paymentAmount;
      }
    });

    return history;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "—";
    }
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "—";
    }
  };

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
                seconds || 0
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
  };

  // NEW LOGIC: Open payment modal for specific installment
  const openPaymentModal = (sale, installment = null) => {
    setSelectedSale(sale);

    // If no specific installment is provided, get the next due installment
    const installmentToPay = installment || getNextDueInstallment(sale);

    if (!installmentToPay) {
      toast.error("No due installments found!");
      return;
    }

    setSelectedInstallment(installmentToPay);
    setPaymentAmount(installmentToPay.paymentAmount.toString());
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("Cash");
    setIsPaymentModalOpen(true);
  };

  // NEW LOGIC: Handle payment submission for specific installment
  const handlePaymentSubmit = (e) => {
    e.preventDefault();

    if (!selectedSale || !selectedInstallment) {
      toast.error("Please select an installment to pay!");
      return;
    }

    if (selectedSale.remainingAmount <= 0) {
      toast.error("This installment is already completed!");
      return;
    }

    const payment = parseFloat(paymentAmount);
    if (!payment || payment <= 0) {
      toast.error("Please enter a valid payment amount!");
      return;
    }

    // STRICT LOGIC: Payment must match the installment amount exactly
    if (payment !== selectedInstallment.paymentAmount) {
      toast.error(
        `Payment must be exactly Rs: ${selectedInstallment.paymentAmount}/- for this installment`
      );
      return;
    }

    if (!paymentDate) {
      toast.error("Please select a payment date!");
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmPayment = () => {
    const payment = parseFloat(paymentAmount);
    const receiptId = generatePaymentReceiptId();

    // Update installment sales data with STRICT payment logic
    const updatedInstallmentSales = installmentSales.map((sale) => {
      if (sale.id === selectedSale.id) {
        const updatedTimeline = sale.timeline ? [...sale.timeline] : [];

        // Mark the specific installment as paid
        const installmentIndex = updatedTimeline.findIndex(
          (payment) =>
            payment.dueDate === selectedInstallment.dueDate &&
            payment.paymentAmount === selectedInstallment.paymentAmount
        );

        if (installmentIndex !== -1) {
          updatedTimeline[installmentIndex] = {
            ...updatedTimeline[installmentIndex],
            paid: true,
            paymentDate: paymentDate,
            actualAmount: payment,
            paymentMethod: paymentMethod,
          };
        }

        const newRemainingAmount = Math.max(0, sale.remainingAmount - payment);

        return {
          ...sale,
          remainingAmount: newRemainingAmount,
          lastPaymentDate: paymentDate,
          totalPaid: (sale.totalPaid || 0) + payment,
          timeline: updatedTimeline,
        };
      }
      return sale;
    });

    // Persist payment: update server if possible, otherwise update localStorage
    const allSalesHistory =
      JSON.parse(localStorage.getItem("salesHistory")) || [];
    let updatedSalesHistory = allSalesHistory;

    (async () => {
      try {
        if (selectedSale.serverId) {
          const res = await api.post(`/sales/${selectedSale.serverId}/pay`, {
            paymentNumber: selectedInstallment.paymentNumber,
            dueDate: selectedInstallment.dueDate,
            paymentAmount: payment,
            paymentDate: paymentDate,
            paymentMethod: paymentMethod,
          });

          const saved = res.data;

          // Map server-returned sale into our local salesHistory entry
          updatedSalesHistory = allSalesHistory.map((sale) => {
            if (sale.serverId === saved._id) {
              return {
                ...sale,
                timeline: saved.timeline || sale.timeline,
                remainingAmount: saved.remainingAmount,
                totalPaid: saved.totalPaid || (sale.totalPaid || 0) + payment,
                lastPaymentDate: paymentDate,
                status: saved.status || sale.status,
              };
            }
            return sale;
          });
        } else {
          // Local-only update
          updatedSalesHistory = allSalesHistory.map((sale) => {
            if (sale.id === selectedSale.id) {
              const updatedTimeline = sale.timeline ? [...sale.timeline] : [];

              const installmentIndex = updatedTimeline.findIndex(
                (p) =>
                  p.dueDate === selectedInstallment.dueDate &&
                  p.paymentAmount === selectedInstallment.paymentAmount
              );

              if (installmentIndex !== -1) {
                updatedTimeline[installmentIndex] = {
                  ...updatedTimeline[installmentIndex],
                  paid: true,
                  paymentDate: paymentDate,
                  actualAmount: payment,
                  paymentMethod: paymentMethod,
                };
              }

              const newRemainingAmount = Math.max(
                0,
                sale.remainingAmount - payment
              );

              return {
                ...sale,
                remainingAmount: newRemainingAmount,
                lastPaymentDate: paymentDate,
                totalPaid: (sale.totalPaid || 0) + payment,
                paymentTimeline: updatedTimeline,
              };
            }
            return sale;
          });
        }

        // Persist updated history and in-memory lists
        localStorage.setItem(
          "salesHistory",
          JSON.stringify(updatedSalesHistory)
        );
        const updatedInstallmentSales = updatedSalesHistory.filter(
          (s) => s.type === "installment-sale"
        );
        setInstallmentSales(updatedInstallmentSales);

        // update currentPayment to include serverSale if available
        const updatedEntry = updatedSalesHistory.find(
          (s) =>
            s.id === selectedSale.id || s.serverId === selectedSale.serverId
        );
        if (updatedEntry)
          setCurrentPayment({ ...paymentRecord, sale: updatedEntry });
      } catch (err) {
        console.error("Error recording payment to server", err);
        toast.error("Failed to record payment on server; saved locally.");
        // ensure local update persisted
        localStorage.setItem(
          "salesHistory",
          JSON.stringify(updatedSalesHistory)
        );
        const updatedInstallmentSales = updatedSalesHistory.filter(
          (s) => s.type === "installment-sale"
        );
        setInstallmentSales(updatedInstallmentSales);
      }
    })();

    // Create payment record
    const paymentRecord = {
      id: generateClientId(),
      saleId: selectedSale.id,
      invoiceId: selectedSale.invoiceId,
      receiptId: receiptId,
      timestamp: new Date().toISOString(),
      paymentDate: paymentDate,
      paymentAmount: payment,
      paymentMethod: paymentMethod,
      remainingAmount: selectedSale.remainingAmount - payment,
      customer: selectedSale.customer,
      productName: selectedSale.productName,
      installmentNumber: selectedInstallment.paymentNumber,
    };

    const installmentHistory =
      JSON.parse(localStorage.getItem("installmentHistory")) || [];
    installmentHistory.push(paymentRecord);
    localStorage.setItem(
      "installmentHistory",
      JSON.stringify(installmentHistory)
    );

    // Add to recent payments for display
    const newPayment = {
      receiptNumber: receiptId,
      amount: payment,
      date: paymentDate,
      method: paymentMethod,
      remainingAmount: selectedSale.remainingAmount - payment,
      installmentNumber: selectedInstallment.paymentNumber,
    };

    setRecentPayments((prev) => [newPayment, ...prev]);
    setInstallmentSales(updatedInstallmentSales);
    setCurrentPayment(paymentRecord);
    setIsReceiptModalOpen(true);
    setShowConfirmation(false);
    setIsPaymentModalOpen(false);

    setPaymentAmount("");
    setPaymentDate("");
    setPaymentMethod("Cash");
    setSelectedInstallment(null);

    toast.success("Payment recorded successfully!");
  };

  const handleCancelPayment = () => {
    setShowConfirmation(false);
    toast.info("Payment cancelled");
  };

  // Print Hook
  const { print } = usePrint();

  const handlePrint = () => {
    if (!currentPayment) {
      toast.error("No payment data available");
      return;
    }

    try {
      const invoiceHTML = ReactDOMServer.renderToStaticMarkup(
        <PrintableDocument
          type="receipt"
          title="Installment Payment Receipt"
          data={{
            invoiceId: currentPayment.receiptId,
            timestamp: currentPayment.timestamp,
            items: [
              {
                name: `${currentPayment.productName} - Installment #${currentPayment.installmentNumber}`,
                quantity: 1,
                price: currentPayment.paymentAmount,
                total: currentPayment.paymentAmount,
              },
            ],
            total: currentPayment.paymentAmount,
          }}
        />
      );
      print(invoiceHTML);
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to print receipt");
    }
  };

  const handleCloseModal = () => {
    setIsReceiptModalOpen(false);
    setCurrentPayment(null);
  };

  const getStatusBadgeClassTable = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-600 text-white";
      case "ACTIVE":
        return "bg-blue-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const handleRowClick = (sale) => {
    setSelectedSale(sale);
  };

  const getPaymentMethodDisplay = (method) => {
    return method || "Cash";
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-500 text-white";
      case "PENDING":
        return "bg-yellow-500 text-white";
      case "OVERDUE":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // NEW: Get all due installments for a sale
  const getDueInstallments = (sale) => {
    if (!sale.timeline) return [];
    return sale.timeline.filter((payment) => !payment.paid);
  };

  // NEW: Get installment schedule for view modal
  const getInstallmentSchedule = (sale) => {
    if (!sale.timeline) return [];
    return sale.timeline.map((payment, index) => ({
      ...payment,
      installmentNumber: index + 1,
      status: payment.paid
        ? "PAID"
        : new Date(payment.dueDate) < new Date()
        ? "OVERDUE"
        : "PENDING",
    }));
  };

  const renderPaymentForm = () => (
    <div className="bg-cyan-800/50 backdrop-blur-md border border-cyan-700 rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        INSTALLMENT MANAGEMENT
      </h3>

      {!selectedSale ? (
        <div className="text-center py-8 border-2 border-dashed border-white/20 rounded-md">
          <div className="text-white text-3xl mb-3">💳</div>
          <p className="text-white italic">
            Click on a row to select installment plan for payment
          </p>
        </div>
      ) : selectedSale.remainingAmount <= 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-green-500/30 rounded-md bg-green-500/50">
          <div className="text-white text-3xl mb-3">✅</div>
          <p className="font-semibold text-lg">INSTALLMENT COMPLETED</p>
          <p className="text-sm mt-2">
            All payments have been received for this installment plan
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-cyan-900/40 backdrop-blur-md border border-cyan-600 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              INSTALLMENT PLAN DETAILS
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/70">CUSTOMER:</span>
                  <span className="text-white font-semibold">
                    {customerDetails[selectedSale.customerId]
                      ? `${
                          customerDetails[selectedSale.customerId].firstName
                        } ${customerDetails[selectedSale.customerId].lastName}`
                      : selectedSale.customer}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">CNIC:</span>
                  <span className="text-white font-mono">
                    {customerDetails[selectedSale.customerId]?.cnic || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">CONTACT:</span>
                  <span className="text-white">
                    {customerDetails[selectedSale.customerId]?.contact || "—"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/70">PRODUCT:</span>
                  <span className="text-white font-semibold">
                    {selectedSale.productName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">TOTAL AMOUNT:</span>
                  <span className="text-white font-semibold">
                    Rs: {selectedSale.finalTotal}/-
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">REMAINING AMOUNT:</span>
                  <span className="text-white font-semibold">
                    Rs: {selectedSale.remainingAmount}/-
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">NEXT DUE AMOUNT:</span>
                  <span className="text-white font-bold">
                    Rs: {getNextDueInfo(selectedSale).amount || 0}/-
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">INSTALLMENTS:</span>
                  <span className="text-white">
                    {getPaidInstallments(selectedSale)}/
                    {getTotalInstallments(selectedSale)} PAID
                  </span>
                </div>
              </div>
            </div>

            {/* Installment Schedule */}
            {selectedSale.timeline && (
              <div className="mt-4">
                <h5 className="text-white font-semibold mb-2">
                  PAYMENT SCHEDULE:
                </h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getInstallmentSchedule(selectedSale).map((installment) => (
                    <div
                      key={installment.dueDate}
                      className="flex justify-between items-center text-sm bg-white/10 p-2 rounded"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-white/70">
                          #{installment.installmentNumber}
                        </span>
                        <span className="text-white">
                          {formatDate(installment.dueDate)}
                        </span>
                        <span className="text-white font-semibold">
                          Rs: {installment.paymentAmount}/-
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            installment.status === "PAID"
                              ? "bg-green-500"
                              : installment.status === "OVERDUE"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          } text-white`}
                        >
                          {installment.status}
                        </span>
                        {!installment.paid && (
                          <button
                            onClick={() =>
                              openPaymentModal(selectedSale, installment)
                            }
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setSelectedSale(null);
                setRecentPayments([]);
              }}
              className="px-6 py-3 border border-white/30 rounded-md bg-gray-600 hover:bg-gray-700 transition-all duration-300 cursor-pointer font-semibold text-white"
            >
              CANCEL
            </button>
            <button
              onClick={() => openPaymentModal(selectedSale)}
              className="flex-1 py-3 border border-white/30 rounded-md bg-cyan-950/70 hover:bg-cyan-950 transition-all duration-300 cursor-pointer font-semibold text-white flex justify-center items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              PAY NEXT INSTALLMENT
            </button>
          </div>
        </div>
      )}
    </div>
  );

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

      <div className="p-2 min-h-screen text-white">
        <div className="max-w-8xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <Calendar className="w-6 h-6 mr-2" />
                INSTALLMENT MANAGEMENT
              </h1>
              <p className="text-white/80">
                MANAGE AND TRACK INSTALLMENT PAYMENTS WITH STRICT PLAN FOLLOWING
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-md p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 md:col-span-2">
              <SearchIcon className="text-white" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="SEARCH BY CUSTOMER, PRODUCT, OR INVOICE"
                className="flex-1 outline-none bg-transparent text-white placeholder-white/60 uppercase"
              />
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all scrollbar-hide"
              >
                <option value="all" className="bg-black/90">
                  ALL
                </option>
                <option value="active" className="bg-black/90">
                  Active
                </option>
                <option value="completed" className="bg-black/90">
                  Completed
                </option>
              </select>
            </div>

            <div className="text-white/80 text-lg flex items-center">
              TOTAL RECORDS: {filteredSales.length}
            </div>
          </div>

          {renderPaymentForm()}

          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-md overflow-x-auto scrollbar-hide">
            <table className="w-full text-white/90 min-w-[1000px]">
              <thead className="bg-white/10 text-left text-sm">
                <tr>
                  <th className="p-3">S.NO</th>
                  <th className="p-3">CUSTOMER</th>
                  <th className="p-3">PAID</th>
                  <th className="p-3">REMAINING</th>
                  <th className="p-3">DUE AMOUNT</th>
                  <th className="p-3">NEXT DUE DATE</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">PROGRESS</th>
                  <th className="p-3">ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredSales.map((sale, index) => {
                  const status = getPaymentStatus(sale);
                  const paidInstallments = getPaidInstallments(sale);
                  const remainingInstallments = getRemainingInstallments(sale);
                  const totalInstallments = getTotalInstallments(sale);
                  const progressPercentage =
                    ((sale.finalTotal - sale.remainingAmount) /
                      sale.finalTotal) *
                    100;
                  const nextDueInfo = getNextDueInfo(sale);
                  const isOverdue = hasOverduePayments(sale);
                  const customer = customerDetails[sale.customerId];

                  return (
                    <tr
                      key={sale.id}
                      onClick={() => handleRowClick(sale)}
                      className={`border-t border-white/5 transition cursor-pointer ${
                        selectedSale?.id === sale.id
                          ? "bg-purple-600/50"
                          : isOverdue
                          ? "bg-red-600/50 hover:bg-red-600/70"
                          : "hover:bg-purple-600/30"
                      }`}
                    >
                      <td className="p-3 font-mono text-center">{index + 1}</td>

                      <td className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 border border-white/20 flex items-center justify-center">
                          <span className="font-medium text-white">
                            {initials(customer)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {customer
                              ? `${customer.firstName} ${customer.lastName}`
                              : sale.customer}
                          </div>
                          {isOverdue && (
                            <div className="text-xs text-red-300 font-semibold mt-1">
                              ⚠️ OVERDUE
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-white font-semibold">
                        RS:{" "}
                        {sale.totalPaid ||
                          sale.finalTotal - sale.remainingAmount}
                        /-
                      </td>
                      <td className="p-3 text-white font-semibold">
                        RS: {sale.remainingAmount}/-
                      </td>
                      <td className="p-3">
                        <div className="text-center">
                          <div
                            className={`text-sm font-semibold ${
                              nextDueInfo.isOverdue
                                ? "text-red-300"
                                : "text-white"
                            }`}
                          >
                            RS: {nextDueInfo.amount}/-
                          </div>
                          {nextDueInfo.isOverdue && (
                            <div className="text-xs text-red-300">PAST DUE</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-center">
                          <div
                            className={`text-sm font-semibold ${
                              nextDueInfo.isOverdue
                                ? "text-red-300"
                                : "text-white"
                            }`}
                          >
                            {nextDueInfo.dueDate}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-xs border rounded-full border-white/30 ${getStatusBadgeClassTable(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className="bg-cyan-950 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-center mt-1 text-white/70">
                          {Math.round(progressPercentage)}%
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          title="View Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSale(sale);
                            setIsViewOpen(true);
                          }}
                          className="p-2 rounded bg-cyan-900 text-white hover:bg-cyan-950 transition-colors cursor-pointer mr-2"
                        >
                          <VisibilityIcon fontSize="small" />
                        </button>
                        <button
                          title="Record Payment"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPaymentModal(sale);
                          }}
                          className="p-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan="9" className="p-4 text-center text-white/70">
                      NO INSTALLMENT RECORDS FOUND.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enhanced Payment Modal */}
      {isPaymentModalOpen && selectedSale && selectedInstallment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50 p-4">
          <div className="bg-cyan-800/90 backdrop-blur-md border border-cyan-900 rounded-md p-6 w-full max-w-md text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              PAY INSTALLMENT #{selectedInstallment.paymentNumber}
            </h3>

            <div className="space-y-4">
              <div className="bg-cyan-900/40 rounded-lg p-3">
                <div className="flex justify-between mb-2">
                  <span className="text-white/70">CUSTOMER:</span>
                  <span className="font-semibold">
                    {customerDetails[selectedSale.customerId]
                      ? `${
                          customerDetails[selectedSale.customerId].firstName
                        } ${customerDetails[selectedSale.customerId].lastName}`
                      : selectedSale.customer}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">PRODUCT:</span>
                  <span className="font-semibold">
                    {selectedSale.productName}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-white/70">INSTALLMENT DUE:</span>
                  <span className="font-bold text-white">
                    {formatDate(selectedInstallment.dueDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">AMOUNT DUE:</span>
                  <span className="font-bold text-white">
                    RS: {selectedInstallment.paymentAmount}/-
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">REMAINING BALANCE:</span>
                  <span className="font-bold text-white">
                    RS: {selectedSale.remainingAmount}/-
                  </span>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    PAYMENT AMOUNT (Fixed)
                  </label>
                  <input
                    type="text"
                    value={paymentAmount}
                    readOnly
                    className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none cursor-not-allowed"
                  />
                  <p className="text-xs text-white/70 mt-1">
                    Installment amount is fixed at Rs:{" "}
                    {selectedInstallment.paymentAmount}/-
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    PAYMENT DATE
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    PAYMENT METHOD
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all scrollbar-hide"
                  >
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

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaymentModalOpen(false);
                      setSelectedInstallment(null);
                    }}
                    className="flex-1 py-3 border border-white/30 rounded-md bg-gray-600 hover:bg-gray-700 transition-all duration-300 cursor-pointer font-semibold"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 border border-white/30 rounded-md bg-cyan-950/70 hover:bg-cyan-950 transition-all duration-300 cursor-pointer font-semibold flex justify-center items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    PAY INSTALLMENT
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the modals (confirmation, view, receipt) remain the same */}
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50 p-4">
          <div className="bg-cyan-800/90 backdrop-blur-md border border-cyan-900 rounded-md p-6 w-full max-w-md text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-purple-300">⚠️</span>
              CONFIRM INSTALLMENT PAYMENT
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-white">CUSTOMER:</span>
                <span className="font-semibold">
                  {customerDetails[selectedSale?.customerId]
                    ? `${customerDetails[selectedSale.customerId].firstName} ${
                        customerDetails[selectedSale.customerId].lastName
                      }`
                    : selectedSale?.customer}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">PRODUCT:</span>
                <span className="font-semibold">
                  {selectedSale?.productName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">INVOICE ID:</span>
                <span className="font-mono font-bold text-white">
                  {selectedSale?.invoiceId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">INSTALLMENT #:</span>
                <span className="font-semibold text-white">
                  {selectedInstallment?.paymentNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">DUE DATE:</span>
                <span className="font-semibold text-white">
                  {formatDate(selectedInstallment?.dueDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">PAYMENT AMOUNT:</span>
                <span className="font-semibold text-white">
                  RS: {paymentAmount}/-
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">PAYMENT DATE:</span>
                <span className="font-semibold text-white">{paymentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">PAYMENT METHOD:</span>
                <span className="font-semibold text-black rounded-full px-2 py-1 bg-white/70">
                  {getPaymentMethodDisplay(paymentMethod)}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-2">
                <span className="text-white font-bold bg-yellow-600 px-2 py-1 rounded">
                  REMAINING AFTER PAYMENT:
                </span>
                <span className="font-bold text-white bg-red-600 px-2 py-1 rounded">
                  RS:{" "}
                  {selectedSale
                    ? selectedSale.remainingAmount - parseFloat(paymentAmount)
                    : 0}
                  /-
                </span>
              </div>
            </div>

            <p className="text-white text-sm mb-6 text-center bg-red-600/30 p-3 rounded border border-red-500/50">
              ⚠️ THIS ACTION CANNOT BE UNDONE. PAYMENT RECORD WILL BE PERMANENT.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelPayment}
                className="flex-1 py-3 border border-white/30 rounded-md bg-red-700 hover:bg-red-800 transition-all duration-300 cursor-pointer font-semibold"
              >
                CANCEL
              </button>

              <button
                onClick={handleConfirmPayment}
                className="flex-1 py-3 border border-white/30 rounded-md bg-cyan-950/70 hover:bg-cyan-950 transition-all duration-300 cursor-pointer font-semibold flex justify-center items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                CONFIRM PAYMENT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced View Modal with Payment History */}
      {isViewOpen && selectedSale && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 p-2 md:p-4 backdrop-blur-md print:p-0">
          <div className="bg-white text-black rounded-lg w-full max-w-4xl mx-auto max-h-[95vh] overflow-y-auto scrollbar-hide relative font-sans text-sm border border-gray-300">
            <div className="p-4 space-y-4">
              <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
                <h2 className="text-xl font-bold tracking-wider text-gray-900">
                  ZUBI ELECTRONICS
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  INSTALLMENT PLAN DETAILS
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-semibold text-gray-700">
                    INVOICE: {selectedSale.invoiceId}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatDateTime(selectedSale.timestamp)}
                  </p>
                </div>
              </div>

              {/* Customer & Product Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">
                    CUSTOMER INFORMATION
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold">
                        {customerDetails[selectedSale.customerId]
                          ? `${
                              customerDetails[selectedSale.customerId].firstName
                            } ${
                              customerDetails[selectedSale.customerId].lastName
                            }`
                          : selectedSale.customer}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CNIC:</span>
                      <span className="font-mono">
                        {customerDetails[selectedSale.customerId]?.cnic || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact:</span>
                      <span>
                        {customerDetails[selectedSale.customerId]?.contact ||
                          "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">
                    PRODUCT INFORMATION
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product:</span>
                      <span className="font-semibold">
                        {selectedSale.productName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span>{selectedSale.productModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span>{selectedSale.productCategory}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border-t border-dashed border-gray-300 pt-3 mt-3 space-y-3">
                <h4 className="font-semibold text-gray-700">PAYMENT SUMMARY</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">
                      {selectedSale.finalTotal}
                    </div>
                    <div className="text-blue-700 text-sm">TOTAL AMOUNT</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">
                      {selectedSale.totalPaid ||
                        selectedSale.finalTotal - selectedSale.remainingAmount}
                    </div>
                    <div className="text-green-700 text-sm">PAID AMOUNT</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-900">
                      {selectedSale.remainingAmount}
                    </div>
                    <div className="text-orange-700 text-sm">REMAINING</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-900">
                      {getPaidInstallments(selectedSale)}/
                      {getTotalInstallments(selectedSale)}
                    </div>
                    <div className="text-purple-700 text-sm">INSTALLMENTS</div>
                  </div>
                </div>
              </div>

              {/* Installment Schedule */}
              <div className="border-t border-dashed border-gray-300 pt-3 mt-3">
                <h4 className="font-semibold text-gray-700 mb-3">
                  INSTALLMENT SCHEDULE
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getInstallmentSchedule(selectedSale).map((installment) => (
                    <div
                      key={installment.dueDate}
                      className={`flex justify-between items-center p-3 rounded-lg border ${
                        installment.paid
                          ? "bg-green-50 border-green-200"
                          : installment.status === "OVERDUE"
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">
                          #{installment.installmentNumber}
                        </span>
                        <span>{formatDate(installment.dueDate)}</span>
                        <span className="font-semibold">
                          Rs: {installment.paymentAmount}/-
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            installment.paid
                              ? "bg-green-500"
                              : installment.status === "OVERDUE"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          } text-white`}
                        >
                          {installment.paid ? "PAID" : installment.status}
                        </span>
                        {installment.paid && (
                          <span className="text-xs text-gray-600">
                            Paid on: {formatDate(installment.paymentDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Payments Section */}
              {recentPayments.length > 0 && (
                <div className="border-t border-dashed border-gray-300 pt-3 mt-3">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    RECENT PAYMENTS
                  </h4>
                  <div className="space-y-2">
                    {recentPayments.map((payment, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm bg-gray-100 p-3 rounded"
                      >
                        <div className="text-gray-700">
                          <span className="text-gray-500">Receipt #:</span>{" "}
                          {payment.receiptNumber}
                        </div>
                        <div className="text-gray-700">
                          <span className="text-gray-500">Installment #:</span>{" "}
                          {payment.installmentNumber}
                        </div>
                        <div className="text-gray-700">
                          <span className="text-gray-500">Amount:</span> Rs:{" "}
                          {payment.amount}/-
                        </div>
                        <div className="text-gray-700">
                          <span className="text-gray-500">Date:</span>{" "}
                          {formatDate(payment.date)}
                        </div>
                        <div className="text-gray-700">
                          <span className="text-gray-500">Method:</span>{" "}
                          {payment.method}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center border-t border-dashed border-gray-300 pt-4 text-xs text-gray-600">
                <p>
                  INSTALLMENT MANAGEMENT SYSTEM - STRICT PAYMENT PLAN FOLLOWING
                </p>
                <p>This is a computer-generated detail view.</p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-lg p-2 print:hidden">
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded hover:cursor-pointer bg-blue-600 text-white hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <span>🖨️</span>
                  <span>PRINT</span>
                </button>
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="px-4 py-2 rounded hover:cursor-pointer bg-gray-600 text-white hover:bg-gray-700 transition font-medium"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal remains the same */}
      {isReceiptModalOpen && currentPayment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 p-2 md:p-4 backdrop-blur-md print:p-0">
          <div className="bg-white text-black rounded-lg w-full max-w-md mx-auto max-h-[95vh] overflow-y-auto scrollbar-hide relative font-sans text-sm border border-gray-300">
            <div className="p-4 space-y-3">
              <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
                <h2 className="text-xl font-bold tracking-wider text-gray-900">
                  ZUBI ELECTRONICS
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  INSTALLMENT PAYMENT RECEIPT
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-semibold text-gray-700">
                    RECEIPT ID: {currentPayment.receiptId}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatDate(currentPayment.timestamp)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">
                    MAIN INVOICE:
                  </span>
                  <span className="text-gray-900 text-right font-mono">
                    {currentPayment.invoiceId}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">CUSTOMER:</span>
                  <span className="text-gray-900 text-right">
                    {currentPayment.customer}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">PRODUCT:</span>
                  <span className="text-gray-900 text-right">
                    {currentPayment.productName}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">
                    INSTALLMENT #:
                  </span>
                  <span className="text-gray-900 text-right">
                    {currentPayment.installmentNumber}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 pt-3 mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">
                    PAYMENT DATE:
                  </span>
                  <span className="text-gray-900 text-right">
                    {formatDate(currentPayment.paymentDate)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">
                    PAYMENT METHOD:
                  </span>
                  <span className="text-gray-900 text-right">
                    {getPaymentMethodDisplay(currentPayment.paymentMethod)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium text-gray-700">
                    AMOUNT PAID:
                  </span>
                  <span className="text-gray-900 text-right font-semibold">
                    RS: {currentPayment.paymentAmount}/-
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-700 bg-yellow-100 px-2 py-1 rounded font-bold">
                    REMAINING AMOUNT:
                  </span>
                  <span className="text-gray-900 text-right bg-red-100 px-2 py-1 rounded font-bold">
                    RS: {currentPayment.remainingAmount}/-
                  </span>
                </div>
              </div>

              <div className="text-center border-t border-dashed border-gray-300 pt-4 text-xs text-gray-600">
                <p>THANK YOU FOR YOUR PAYMENT!</p>
                <p>This is a computer-generated receipt.</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-lg p-2 print:hidden">
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded hover:cursor-pointer bg-blue-600 text-white hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <span>🖨️</span>
                  <span>PRINT</span>
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded hover:cursor-pointer bg-gray-600 text-white hover:bg-gray-700 transition font-medium"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageInstallments;
