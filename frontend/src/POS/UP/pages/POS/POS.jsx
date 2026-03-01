// |===============================| Import Components |===============================|
import React, { useState } from "react";
import Cash from "../../components/Cash/Cash";
import Installment from "../../components/Installment/Installment";

// |===============================| Dashboard Page |===============================|
const POS = () => {
  const [activeTab, setActiveTab] = useState("cash");

  return (
    <div className="space-y-5 mx-auto w-8xl ">
      {/* |===============================| Header |===============================| */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          POINT OF SALE 
        </h1>
        <p className="text-white/90">
          Sell products according to customer type.
        </p>
      </div>

      {/* |===============================| Tabs |===============================| */}
      <div className="flex space-x-3">
        {["cash", "installments"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2 py-2 rounded-md font-base hover:cursor-pointer ${
              activeTab === tab
                ? "bg-cyan-900 text-white border border-white/40"
                : "bg-cyan-800/80 text-white/80 hover:bg-cyan-900/90 transition-colors"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* |===============================| Tab Content |===============================| */}
      <div className="space-y-6">
        {/* Cash Tab */}
        {activeTab === "cash" && <Cash  />}

        {/* Installments Tab */}
        {activeTab === "installments" && <Installment/>}
      </div>
    </div>
  );
};

// |===============================| Export |===============================|
export default POS;
