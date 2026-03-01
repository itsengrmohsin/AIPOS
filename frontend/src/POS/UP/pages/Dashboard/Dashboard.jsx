import React, { useState, useEffect } from "react";
import StatCard from "../../components/Card/StatCard";
import SalesChart from "../../components/Chart/SalesChart";
import CategoryChart from "../../components/Chart/CategoryChart";
import DailySalesChart from "../../components/Chart/DailySalesChart";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { getStatsList } from "../../constants/statsConfig";
import api from "../../../../utils/api";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showSensitiveData, setShowSensitiveData] = useState(true);
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Admin" };
  const [statsData, setStatsData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/sales/dashboard/stats");
        setStatsData(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
        toast.error("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const toggleSensitiveData = () => {
    setShowSensitiveData(!showSensitiveData);
  };

  const statsList = getStatsList(statsData);

  if (loading) {
    return <div className="p-8 text-white">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8 mx-auto w-8xl">
      {/* Header with Toggle Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-white/90">Here's your business at a glance.</p>
        </div>
        
        {/* Global Eye Toggle Button */}
        <button
          onClick={toggleSensitiveData}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-900 border border-cyan-700 rounded-lg text-white hover:bg-cyan-800 transition-colors duration-200"
          title={showSensitiveData ? "Hide sensitive data" : "Show sensitive data"}
        >
          {showSensitiveData ? (
            <VisibilityOff className="w-5 h-5" />
          ) : (
            <Visibility className="w-5 h-5" />
          )}
          <span>{showSensitiveData ? "Hide" : "Show"}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-3">
        {["overview", "sales"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 rounded-md font-base ${
              activeTab === tab
                ? "bg-cyan-900 text-white border border-white/40"
                : "bg-cyan-800/80 text-white/80 hover:bg-cyan-900/90 transition-colors"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsList.map((stat, index) => (
              <StatCard 
                key={index} 
                {...stat} 
                showSensitiveData={showSensitiveData}
              />
            ))}
          </div>
        )}

        {activeTab === "sales" && (
          <>
            <DailySalesChart showSensitiveData={showSensitiveData} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SalesChart showSensitiveData={showSensitiveData} />
              <CategoryChart />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;