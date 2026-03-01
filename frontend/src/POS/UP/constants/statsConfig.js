import {
  AttachMoney,
  People,
  Inventory,
  ShoppingCart,
  CreditCard,
  CalendarToday,
  BusinessCenter,
  Security,
  Group,
  Store,
  Payment,
  Assessment,
  Savings,
  TrendingUp,
  AccountBalance,
  MoneyOff,
  Warning,
} from "@mui/icons-material";

// Helper to format currency
export const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return "Rs 0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Configuration for stats cards
// We export a function that takes 'data' and returns the list
export const getStatsList = (data) => [
  {
    icon: TrendingUp,
    title: "Revenue",
    value: formatCurrency(data.revenue),
    change: `Total Sales Revenue`,
    color: "from-purple-500 to-indigo-500",
    sensitive: true,
  },
  {
    icon: MoneyOff,
    title: "Cost of Goods Sold",
    value: formatCurrency(data.costOfGoodsSold || 0), // Backend might return 0
    change: `Cost of Products Sold`,
    color: "from-red-500 to-pink-500",
    sensitive: true,
  },
  {
    icon: Savings,
    title: "Gross Profit",
    value: formatCurrency(data.grossProfit || data.revenue), // Fallback if 0
    change: `Margin: ${data.revenue > 0 ? ((data.grossProfit || 0) / data.revenue * 100).toFixed(1) : 0}%`,
    color: "from-green-500 to-emerald-500",
    sensitive: true,
  },
  {
    icon: AccountBalance,
    title: "Stock Cost",
    value: formatCurrency(data.stockCost),
    change: `Inventory Cost Value`,
    color: "from-orange-500 to-amber-500",
    sensitive: true,
  },
  {
    icon: ShoppingCart,
    title: "Today Sales",
    value: formatCurrency(data.todaySales),
    color: "from-purple-500 to-pink-500",
    change: `Today Total Sales`,
    sensitive: true,
  },
  {
    icon: CreditCard,
    title: "Cash Sales",
    value: formatCurrency(data.cashSales),
    color: "from-indigo-500 to-purple-500",
    change: `Total Cash Sales`,
    sensitive: true,
  },
  {
    icon: CalendarToday,
    title: "Installment Sales",
    value: formatCurrency(data.installmentSales),
    color: "from-yellow-500 to-orange-500",
    change: `Total Installment Sales`,
    sensitive: true,
  },
  {
    icon: Payment,
    title: "Pending Installments",
    value: (data.pendingInstallmentsCount || 0).toLocaleString(),
    change: `Amount: ${formatCurrency(data.pendingInstallmentsValue || 0)}`,
    color: "from-yellow-600 to-orange-600",
  },
  {
    icon: People,
    title: "Cash Customers",
    value: (data.cashInvoices || 0).toLocaleString(),
    color: "from-indigo-500 to-purple-500",
    change: `Total cash sales invoices`,
  },
  {
    icon: Group,
    title: "Installment Customers",
    value: (data.installmentCustomers || 0).toLocaleString(),
    color: "from-red-500 to-orange-500",
    change: `Total customers in system`,
  },
  {
    icon: Store,
    title: "Stocks in Inventory",
    value: (data.totalProducts || 0).toLocaleString(),
    color: "from-gray-600 to-gray-400",
  },
  {
    icon: Assessment,
    title: "Total Units in Inventory",
    value: (data.totalUnits || 0).toLocaleString(),
    color: "from-blue-600 to-blue-400",
  },
  {
    icon: BusinessCenter,
    title: "Suppliers",
    value: (data.totalSuppliers || 0).toLocaleString(),
    color: "from-green-500 to-teal-500",
  },
  {
    icon: Security,
    title: "Guarantors",
    value: (data.totalGuarantors || 0).toLocaleString(),
    color: "from-blue-700 to-blue-500",
  },
  {
    icon: Warning,
    title: "Stock Alerts",
    value: (data.lowStockCount || 0).toLocaleString(),
    change: `Low Stock Items`,
    color: "from-red-600 to-orange-600",
  },
];
