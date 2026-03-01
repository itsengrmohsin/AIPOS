// |===============================| Import React and Hooks |===============================|
import React from "react";
import AppRoutes from "./routes/AppRoutes";
import UnderDevelopment from "./pages/UnderDevelopment/UnderDevelopment";
import ServerDisabled from "./pages/ServerDisabled/ServerDisabled";
import bg_image from "./assets/common-images/background.png"; 

import "./CSS/App.css";

// |===============================| Main App Component |===============================|
const App = () => {
  return (
    <>
      <div
        className="min-h-screen relative select-none"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {/* |===============================| Background Image |===============================| */}
        <div className="fixed inset-0 -z-10">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bg_image})` }}
          ></div>
        </div>

        {/* |===============================| App Routes |===============================| */}
        <AppRoutes />

        {/* |===============================| Under Development Page (Optional) |===============================| */}
        {/* <UnderDevelopment /> */}

        {/* |===============================| Server Disabled Page (Optional) |===============================| */}
        {/* <ServerDisabled /> */}
      </div>
    </>
  );
};

export default App;
