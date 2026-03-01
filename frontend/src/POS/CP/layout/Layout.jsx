import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import { Helmet, HelmetProvider } from "react-helmet-async";
import useIdleLogout from "../../../Hooks/useIdleLogout";

const Layout = () => {
  // Auto logout after 5 minutes (5 * 60 * 1000 ms)
  useIdleLogout(5 * 60 * 1000, "/cp-signin");

  return (
    <HelmetProvider>
      <Helmet>
        <title>Customer Portal - Zubi Electronics</title>
        <meta
          name="description"
          content="This is the Customer Services Portal of Zubi Electronics."
        />
      </Helmet>

      <div className="flex flex-col lg:flex-row h-screen text-white relative">
        {/* Sidebar */}
        <div className="order-2 lg:order-1">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 order-1 lg:order-2 mt-[75px] lg:mt-0 h-screen scrollbar-hide">
          <Outlet />
        </main>
      </div>
    </HelmetProvider>
  );
};

export default Layout;
