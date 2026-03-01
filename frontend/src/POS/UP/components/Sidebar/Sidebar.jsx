// |===============================| Import Dependencies |===============================|
import React, { useState, useEffect } from "react"; // 👈 Import useEffect
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Dashboard,
  Logout,
  ExpandMore,
  ChevronRight,
} from "@mui/icons-material";
import "../../../../css/Scrollbar.css";
import logo from "../../../../assets/common-images/logo.webp";
import { menuItems } from "../../constants/sidebar"; // Assuming menuItems structure is available
// Toastify
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


// |===============================| Helper to find active parent |===============================|
const findActiveParentLabel = (menuItems, pathname) => {
  for (const item of menuItems) {
    // If it's a single link and active
    if (!item.children && item.path === pathname) {
      return item.label; // Return its own label if it's the active single link (though not an accordion)
    }

    // If it has children (is an accordion)
    if (item.children) {
      if (item.children.some((child) => pathname.startsWith(child.path))) {
        return item.label; // Return the parent's label if an active child is found
      }
    }
  }
  return "Dashboard"; // Default to a known single-link item or an empty string
};

// |===============================| Sidebar Component |===============================|
const Sidebar = () => {
  const location = useLocation();
  // Initialize state with only the label of the active parent or "Dashboard"
  // We'll update this in useEffect to ensure the correct one is open on page load
  const [expandedItems, setExpandedItems] = useState([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate hook

  const [user, setUser] = useState({ name: "", role: "" });

  const loadUser = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      // Use stored admin name if available instead of hardcoding
      if (userData.role === "admin" || userData.role === "Admin") {
        const name =
          userData.name || userData.username || userData.fullName || "Admin";
        setUser({ name, role: "Admin" });
      }
    }
  };

  useEffect(() => {
    loadUser();

    const handleUserUpdate = () => loadUser();
    window.addEventListener("user-updated", handleUserUpdate);

    return () => {
      window.removeEventListener("user-updated", handleUserUpdate);
    };
  }, []);

  // |===============================| Logout Function |===============================|
const logout = () => {
  toast.info("Logged out successfully", {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  });

  setTimeout(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/up-signin");
  }, 3000);
};


  // |===============================| Remove role filtering (Use all menu items) |===============================|
  const filteredMenuItems = menuItems;

  // |===============================| Active Route Checkers |===============================|
  const isActive = (path) => {
    // Check for exact path match or path prefix match (e.g., /app/users vs /app/users/details)
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const isParentActive = (children) => {
    return children.some((child) => child.path && isActive(child.path));
  };

  // |===============================| Auto-Expand on Load/Path Change |===============================|
  useEffect(() => {
    const activeParentLabel = findActiveParentLabel(
      filteredMenuItems,
      location.pathname,
    );

    // Set only the active parent as expanded
    if (activeParentLabel && activeParentLabel !== "Dashboard") {
      setExpandedItems([activeParentLabel]);
    } else {
      // If no parent or "Dashboard" is active (Dashboard is a single link, not an accordion)
      setExpandedItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Re-run when the route changes

  // |===============================| Expand / Collapse Sidebar Items (Single Open Logic) |===============================|
  const toggleExpanded = (label) => {
    setExpandedItems((prev) => {
      // Check if the clicked item is already expanded
      const isCurrentlyExpanded = prev.includes(label);

      if (isCurrentlyExpanded) {
        // If it's already open, close it (set to empty array)
        return [];
      } else {
        // If it's not open, open only this one and close all others
        return [label];
      }
    });
  };

  // |===============================| Sidebar UI |===============================|
  return (
    <div>
      <ToastContainer />

      {/* |===============================| Mobile Sidebar Overlay |===============================| */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* |===============================| Mobile Toggle Button |===============================| */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white"
      >
        <Dashboard className="w-6 h-6" />
      </button>

      {/* |===============================| Sidebar Panel |===============================| */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-80 h-screen bg-white/5 backdrop-blur-lg border-r border-white/10 
          transform transition-transform duration-300 ease-in-out lg:transform-none 
          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="flex flex-col h-full">
          {/* |===============================| Logo Section |===============================| */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <a
                href="/up"
                className="flex items-center space-x-2 hover:rotate-180 transition-transform duration-300"
              >
                <div className="p-2 rounded-4xl backdrop-blur-md bg-white/10 shadow-md transition hover:bg-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                  <img
                    src={logo}
                    alt="logo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
              </a>
              <div>
                <h1 className="text-white font-bold text-xl">
                  Zubi Electronics
                </h1>
              </div>
            </div>
          </div>

          {/* |===============================| User Info |===============================| */}
          <div className="p-2 border-b border-white/10">
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-white font-base">{user.name}</p>
              <p className="text-white/90 text-sm capitalize">{user.role}</p>
            </div>
          </div>

          {/* |===============================| Sidebar Menu |===============================| */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-hide">
            {filteredMenuItems.map((item) => {
              // Now we check if the label is the ONLY item in the array
              const isExpanded = expandedItems.includes(item.label);

              const hasActiveChild =
                item.children && isParentActive(item.children);

              const Icon = item.icon;

              return (
                <div key={item.label}>
                  {item.children ? (
                    // |===============================| Parent Menu Item with Children |===============================|
                    <button
                      onClick={() => toggleExpanded(item.label)}
                      className={`w-full text-[14px] flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                        hasActiveChild || isExpanded
                          ? "bg-cyan-800/80 border border-cyan-400/20 text-white cursor-pointer"
                          : "text-white/90 hover:text-white hover:bg-cyan-800/80"
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
                    // |===============================| Single Menu Item |===============================|
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive(item.path)
                          ? "bg-cyan-800/80 border border-cyan-400/20 text-white"
                          : "text-white/90 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {Icon && <Icon className="w-5 h-5" />}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )}

                  {/* |===============================| Submenu (Children Items) |===============================| */}
                  {item.children && isExpanded && (
                    <div className="ml-4 mt-2 space-y-1 border-l border-cyan-800/80 pl-4">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                              isActive(child.path)
                                ? "bg-cyan-800/80 text-white"
                                : "text-white/80 hover:text-white hover:bg-cyan-800/60 bg-cyan-800/30"
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

          {/* |===============================| Logout Button |===============================| */}
          <div className="py-2 px-4 border-t border-white/10">
            <button
              onClick={logout}
              className="flex hover:cursor-pointer items-center space-x-3 px-4 py-3 rounded-lg text-white/90 transition-all duration-200 w-full bg-cyan-950/70 hover:bg-cyan-950 hover:text-white"
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
