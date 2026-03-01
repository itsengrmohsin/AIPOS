import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Loader from "../components/Loader/Loader";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import NotFound from "../pages/404-not-found/NotFound";
import WhatsAppCTA from "../components/WhatsApp/WhatsAppCTA";
import ScrollTop from "../components/Scroll/ScrollTop";

import LandingPage from "../pages/LandingPage/LandingPage";
import Products from "../components/LandingPage/Products";
import Services from "../components/LandingPage/Services";
import WhyChooseUs from "../components/LandingPage/WhyChooseUs";
import Contact from "../components/LandingPage/Contact";

import HomeAppliances from "../pages/ProductsDetails/HomeAppliances";
import CoolingItems from "../pages/ProductsDetails/CoolingItems";
import BikesEscoters from "../pages/ProductsDetails/BikesEscoters";
import MobilesLaptops from "../pages/ProductsDetails/MobilesLaptops";
import PowerBatteries from "../pages/ProductsDetails/PowerBatteries";
import OthersAccessories from "../pages/ProductsDetails/OthersAccessories";

import CustomerServices from "../pages/Policies/CustomerServices.jsx";
import FAQ from "../pages/Policies/FAQ.jsx";
import InstallmentPlans from "../pages/Policies/InstallmentPlans.jsx";
import Privacy from "../pages/Policies/Privacy.jsx";
import ReturnPolicy from "../pages/Policies/ReturnPolicy.jsx";

import UPSignIn from "../POS/UP/auth/SignIn";
import CPSignIn from "../POS/CP/auth/SignIn";

import UPLayout from "../POS/UP/layout/Layout";
import UPDashboard from "../POS/UP/pages/Dashboard/Dashboard";
import UPAddCustomer from "../POS/UP/pages/Customers/AddCustomer";
import UPPos from "../POS/UP/pages/POS/POS";
import UPAddGuarantor from "../POS/UP/pages/Guarantors/AddGuarantor";
import UPAddPurchase from "../POS/UP/pages/Purchases/AddPurchase";
import UPAddStock from "../POS/UP/pages/Stocks/AddStock";
import UPManageInstallments from "../POS/UP/pages/Installments/ManageInstallments";
import UPManageCustomers from "../POS/UP/pages/Management/ManageCustomers";
import UPManageGuarantors from "../POS/UP/pages/Management/ManageGuarantors";
import UPManageSuppliers from "../POS/UP/pages/Management/ManageSuppliers";
import UPManageInventory from "../POS/UP/pages/Management/ManageInventory";
import UPInstallmentsHistory from "../POS/UP/pages/Management/InstallmentsHistory";
import UPPurchaseHistory from "../POS/UP/pages/Management/PurchaseHistory";
import UPSalesHistory from "../POS/UP/pages/Management/SalesHistory";
import UPSystemBackup from "../POS/UP/pages/Settings/SystemBackup/SystemBackup";
import UPProfile from "../POS/UP/pages/Settings/Profile/Profile";

import ProtectedRoutes from "./ProtectedRoutes";
import CPLayout from "../POS/CP/layout/Layout";
import CPDashboard from "../POS/CP/pages/Dashboard";
import CPProfile from "../POS/CP/pages/Profile";
import CPForgetPassword from "../POS/CP/pages/ForgetPassword";
import CPChangePassword from "../POS/CP/pages/ChangePassword";
import UPChangePassword from "../POS/UP/pages/Settings/ChangePassword/ChangePassword";
import CPForgotPassword from "../POS/CP/auth/ForgotPassword";

const Layout = ({ children }) => {
  const location = useLocation();
  const showHeaderFooter = [
    "/",
    "/products",
    "/services",
    "/about",
    "/contact",
  ].includes(location.pathname);
  return (
    <>
      {showHeaderFooter && <Header />}
      {children}
      {showHeaderFooter && <Footer />}
    </>
  );
};

const WhatsAppWrapper = () => {
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") {
      setShowWhatsApp(false);
      return;
    }
    const handleScroll = () => setShowWhatsApp(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {showWhatsApp && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <WhatsAppCTA />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AppRoutes = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);
  if (loading) return <Loader />;

  return (
    <BrowserRouter>
      <Layout>
        <ScrollTop />
        <Routes>
          {/* Landing Page Routes (public) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/products" element={<Products />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<WhyChooseUs />} />
          <Route path="/contact" element={<Contact />} />

          <Route
            path="/pages/products/home-appliances"
            element={<HomeAppliances />}
          />
          <Route
            path="/pages/products/cooling-&-air"
            element={<CoolingItems />}
          />
          <Route
            path="/pages/products/bikes-&-e-scooters"
            element={<BikesEscoters />}
          />
          <Route
            path="/pages/products/mobiles-&-laptops"
            element={<MobilesLaptops />}
          />
          <Route
            path="/pages/products/power-&-batteries"
            element={<PowerBatteries />}
          />
          <Route
            path="/pages/products/others-&-accessories"
            element={<OthersAccessories />}
          />

          <Route path="/pages/policies/faq" element={<FAQ />} />
          <Route
            path="/pages/policies/return-policy"
            element={<ReturnPolicy />}
          />
          <Route
            path="/pages/policies/customer-services"
            element={<CustomerServices />}
          />
          <Route
            path="/pages/policies/installment-plans"
            element={<InstallmentPlans />}
          />
          <Route path="/pages/policies/privacy-policy" element={<Privacy />} />

          {/* Auth Routes */}
          <Route path="/up-signin" element={<UPSignIn />} />
          <Route path="/cp-signin" element={<CPSignIn />} />
          <Route
            path="/customer-forgot-password"
            element={<CPForgotPassword />}
          />

          {/* ❌ Registration disabled - Admin adds customers only */}

          {/* 🔒 Protected UP Routes */}
          <Route
            path="/up"
            element={
              <ProtectedRoutes redirectTo="/up-signin" allowedRoles={["admin"]}>
                <UPLayout />
              </ProtectedRoutes>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<UPDashboard />} />
            <Route path="add-customer" element={<UPAddCustomer />} />
            <Route path="pos" element={<UPPos />} />
            <Route path="add-guarantor" element={<UPAddGuarantor />} />
            <Route path="add-purchase" element={<UPAddPurchase />} />
            <Route path="add-stock" element={<UPAddStock />} />
            <Route
              path="manage-installments"
              element={<UPManageInstallments />}
            />
            <Route path="manage-customers" element={<UPManageCustomers />} />
            <Route path="manage-guarantors" element={<UPManageGuarantors />} />
            <Route path="manage-suppliers" element={<UPManageSuppliers />} />
            <Route path="manage-inventory" element={<UPManageInventory />} />
            <Route
              path="installments-history"
              element={<UPInstallmentsHistory />}
            />
            <Route path="purchase-history" element={<UPPurchaseHistory />} />
            <Route path="sales-history" element={<UPSalesHistory />} />
            <Route path="system-backup" element={<UPSystemBackup />} />
            <Route path="profile" element={<UPProfile />} />
            <Route path="change-password" element={<UPChangePassword />} />
          </Route>

          {/* 🔒 CP Routes (customers) */}
          <Route
            path="/cp"
            element={
              <ProtectedRoutes
                redirectTo="/cp-signin"
                allowedRoles={["customer"]}
              >
                <CPLayout />
              </ProtectedRoutes>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CPDashboard />} />
            <Route path="profile" element={<CPProfile />} />
            <Route path="change-password" element={<CPChangePassword />} />
            <Route path="forget-password" element={<CPForgetPassword />} />
          </Route>

          {/* ❌ Catch-All 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <WhatsAppWrapper />
      </Layout>
    </BrowserRouter>
  );
};

export default AppRoutes;
