import {
  Dashboard,
  People,
  BarChart,
  Person,
  PersonAdd,
  List,
  Settings,
  TrendingUp,
  ShoppingCart,
  Add,
  Inventory,
  ShoppingBag,
  AttachMoney,
  CreditCard,
  Info,
  Backup,
  AdminPanelSettings,
  Group,
  Lock,
} from "@mui/icons-material";

// Full Menu Items with Roles & Children
export const menuItems = [
  {
    icon: Dashboard,
    label: "Dashboard",
    path: "/up",
  },
  {
    icon: ShoppingCart,
    label: "POS",
    children: [
      {
        icon: CreditCard, // or CreditCard if POS unavailable
        label: "Point of Sale",
        path: "/up/pos",
      },
    ],
  },
  {
    icon: People,
    label: "Customers",
    children: [
      {
        icon: PersonAdd,
        label: "Add Customer",
        path: "/up/add-customer",
      },
    ],
  },
  {
    icon: AdminPanelSettings,
    label: "Guarantors",
    children: [
      {
        icon: PersonAdd,
        label: "Add Guarantor",
        path: "/up/add-guarantor",
      },
    ],
  },
  {
    icon: ShoppingBag,
    label: "Purchase",
    children: [
      {
        icon: Add,
        label: "Add Purchase",
        path: "/up/add-purchase",
      },
    ],
  },

  {
    icon: Inventory,
    label: "Stocks",
    children: [
      {
        icon: Add,
        label: "Add Stock",
        path: "/up/add-stock",
      },
    ],
  },
  {
    icon: CreditCard,
    label: "Installments",
    children: [
      {
        icon: List,
        label: "Manage Installments",
        path: "/up/manage-installments",
      },
    ],
  },

  {
    icon: BarChart,
    label: "Managements",
    children: [
      {
        icon: People,
        label: "Manage Customers ",
        path: "/up/manage-customers",
      },
      {
        icon: Group,
        label: "Manage Guarantors ",
        path: "/up/manage-guarantors",
      },
      {
        icon: Group,
        label: "Manage Supliers ",
        path: "/up/manage-suppliers",
      },
      {
        icon: Inventory,
        label: "Manage Inventory ",
        path: "/up/manage-inventory",
      },
      {
        icon: CreditCard,
        label: "Installments History",
        path: "/up/installments-history",
      },
      {
        icon: AttachMoney,
        label: "Purchase History",
        path: "/up/purchase-history",
      },
      {
        icon: TrendingUp,
        label: "Sales History",
        path: "/up/sales-history",
      },
    ],
  },
  {
    icon: Settings,
    label: "Settings",
    children: [
      {
        icon: Backup,
        label: "Backup",
        path: "/up/system-backup",
      },
      {
        icon: Person,
        label: "Profile",
        path: "/up/profile",
      },
      {
        icon: Lock,
        label: "Change Password",
        path: "/up/change-password",
      },
    ],
  },
];
