// |===============================| Import Dependencies |===============================|
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Dashboard,
  Logout,
  ExpandMore,
  ChevronRight,
} from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../../css/ScrollBar.css";
import logo from "../../../../assets/common-images/logo.webp";
import { menuItems } from "../../constants/sidebar";

// |===============================| Sidebar Component |===============================|
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [expandedItem, setExpandedItem] = useState("Dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState({ name: "", role: "" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.role === 'customer') {
        setUser({ name: userData.name, role: 'Customer' });
      }
    }
  }, []);

  // ✅ Logout Function
  const logout = () => {
    toast.dark("Logged out successfully!", {
      position: "top-right",
      autoClose: 1200,
      hideProgressBar: false,
      pauseOnHover: false,
      draggable: false,
      theme: "dark",
    });

    // Clear all authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role"); // For cleanup
    localStorage.removeItem("username"); // For cleanup
    localStorage.removeItem("adminName"); // For cleanup
    localStorage.removeItem("adminCNIC"); // For cleanup

    setTimeout(() => {
      navigate("/cp-signin");
    }, 2000);
  };

  // |===============================| Helpers |===============================|
  const toggleExpanded = (label) => setExpandedItem(label);
  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path);
  const isParentActive = (children) =>
    children?.some((child) => child.path && isActive(child.path));

  // |===============================| Sidebar UI |===============================|
  return (
    <div>
      <ToastContainer />

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white"
      >
        <Dashboard className="w-6 h-6" />
      </button>

      {/* Sidebar Panel */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-80 h-screen bg-white/5 backdrop-blur-md border-r border-white/10 
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <Link
                to="/cp/dashboard"
                className="flex items-center space-x-2 hover:rotate-180 transition-transform duration-300"
              >
                <div className="p-2 rounded-4xl backdrop-blur-md bg-white/10 shadow-md transition hover:bg-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                  <img
                    src={logo}
                    alt="logo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
              </Link>
              <div>
                <h1 className="text-white font-bold text-xl">Customer Panel</h1>
              </div>
            </div>
          </div>

          {/* ✅ Logged-in User Info */}
          <div className="p-2 border-b border-white/10">
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-white font-base">{user.name || "Customer"}</p>
              <p className="text-white/90 text-sm capitalize">{user.role}</p>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-hide">
            {menuItems.map((item) => {
              const isExpanded = expandedItem === item.label;
              const hasActiveChild =
                item.children && isParentActive(item.children);
              const Icon = item.icon;

              return (
                <div key={item.label}>
                  {item.children ? (
                    <button
                      onClick={() => setExpandedItem(item.label)}
                      className={`w-full text-[14px] flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                        hasActiveChild || isExpanded
                          ? "bg-[#159FA8]/80 border border-[#159FA8]/40 text-white cursor-pointer"
                          : "text-white/90 hover:text-white hover:bg-[#159FA8]/60"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {Icon && <Icon className="w-5 h-5" />}
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {isExpanded ? (
                        <ExpandMore className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive(item.path)
                          ? "bg-[#159FA8]/80 border border-[#159FA8]/40 text-white"
                          : "text-white/90 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {Icon && <Icon className="w-5 h-5" />}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )}

                  {/* Submenu */}
                  {item.children && isExpanded && (
                    <div className="ml-4 mt-2 space-y-1 border-l border-[#159FA8]/60 pl-4">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                              isActive(child.path)
                                ? "bg-[#159FA8]/80 text-white"
                                : "text-white/80 hover:text-white hover:bg-[#159FA8]/60 bg-[#159FA8]/30"
                            }`}
                          >
                            {ChildIcon && <ChildIcon className="w-4 h-4" />}
                            <span className="font-medium">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* ✅ Logout Button */}
          <div className="py-2 px-4 border-t border-white/10">
            <button
              onClick={logout}
              className="flex cursor-pointer items-center hover:cursor-pointer space-x-3 px-4 py-3 rounded-lg text-white/90 transition-all duration-200 w-full bg-cyan-950/70 hover:bg-cyan-950 hover:text-white"
            >
              <Logout className="w-5 h-5" />
              <span className="font-medium text-[13px]">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// |===============================| Export Component |===============================|
export default Sidebar;
