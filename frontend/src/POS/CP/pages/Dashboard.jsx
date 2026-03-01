import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../../utils/api";
import InstallmentDetail from "../components/InstallmentDetail";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const Dashboard = () => {
  const [purchases, setPurchases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showCashPurchases, setShowCashPurchases] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch purchases using NEW customer portal endpoint
      const purchasesRes = await api.get("/cp/purchases");
      setPurchases(purchasesRes.data || []);

      // Fetch dashboard statistics
      const statsRes = await api.get("/cp/stats");
      setStats(statsRes.data || null);
    } catch (err) {
      console.error("[CP Dashboard] Error fetching data:", err);
      toast.error(
        err.response?.data?.error || "Failed to load dashboard data",
        { autoClose: 2000 },
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchInstallmentDetail = async (saleId) => {
    try {
      setLoadingDetail(true);
      const res = await api.get(`/cp/installments/${saleId}`);
      setSelectedSale(res.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("[CP Dashboard] Error fetching installment detail:", err);
      toast.error(
        err.response?.data?.error || "Failed to load installment details",
        { autoClose: 2000 },
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  // Separate installment and cash purchases
  const installmentPurchases = purchases
    .filter((p) => p.saleType === "installment")
    .sort((a, b) => {
      // Sort by status (active first) then by date
      if (a.status !== "paid" && b.status === "paid") return -1;
      if (a.status === "paid" && b.status !== "paid") return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const cashPurchases = purchases
    .filter((p) => p.saleType === "cash")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Calculate installment-specific stats
  const installmentStats = {
    totalInstallmentPurchases: installmentPurchases.length,
    totalInstallmentAmount: installmentPurchases.reduce(
      (sum, p) => sum + (p.finalTotal || 0),
      0,
    ),
    totalPaidAmount: installmentPurchases.reduce(
      (sum, p) => sum + (p.finalTotal - p.remainingAmount || 0),
      0,
    ),
    totalRemainingAmount: installmentPurchases.reduce(
      (sum, p) => sum + (p.remainingAmount || 0),
      0,
    ),
    activeInstallments: installmentPurchases.filter(
      (p) => p.status === "active" || p.status === "partial",
    ).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Sticky Page Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-[#159FA8]/95 to-[#0d7a82]/95 backdrop-blur-md border-b border-[#159FA8]/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-white">
            📊 Installment Tracking Dashboard
          </h1>
          <p className="text-gray-200 text-sm mt-1">
            Track your installment purchases and payment schedules
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* 🎯 INSTALLMENT OVERVIEW CARDS (TOP PRIORITY) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            📊 Installment Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Purchases Card */}
            <div className="bg-gradient-to-br from-[#159FA8]/30 to-[#0d7a82]/30 backdrop-blur-md border-2 border-[#159FA8]/50 rounded-xl p-5 shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-200 text-sm font-semibold uppercase tracking-wide">
                  Total Purchases
                </p>
                <div className="w-12 h-12 bg-[#159FA8]/40 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🛒</span>
                </div>
              </div>
              <p className="text-4xl font-bold text-white">
                {installmentStats.totalInstallmentPurchases}
              </p>
            </div>

            {/* Total Amount Card */}
            <div className="bg-gradient-to-br from-blue-600/30 to-blue-700/30 backdrop-blur-md border-2 border-blue-500/50 rounded-xl p-5 shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-200 text-sm font-semibold uppercase tracking-wide">
                  Total Amount
                </p>
                <div className="w-12 h-12 bg-blue-500/40 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">
                Rs. {installmentStats.totalInstallmentAmount.toLocaleString()}
              </p>
            </div>

            {/* Paid Amount Card */}
            <div className="bg-gradient-to-br from-green-600/30 to-green-700/30 backdrop-blur-md border-2 border-green-500/50 rounded-xl p-5 shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-200 text-sm font-semibold uppercase tracking-wide">
                  Paid Amount
                </p>
                <div className="w-12 h-12 bg-green-500/40 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">
                Rs. {installmentStats.totalPaidAmount.toLocaleString()}
              </p>
            </div>

            {/* Remaining Balance Card */}
            <div className="bg-gradient-to-br from-orange-600/30 to-orange-700/30 backdrop-blur-md border-2 border-orange-500/50 rounded-xl p-5 shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-200 text-sm font-semibold uppercase tracking-wide">
                  Remaining
                </p>
                <div className="w-12 h-12 bg-orange-500/40 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">
                Rs. {installmentStats.totalRemainingAmount.toLocaleString()}
              </p>
            </div>

            {/* Active Installments Card */}
            <div className="bg-gradient-to-br from-purple-600/30 to-purple-700/30 backdrop-blur-md border-2 border-purple-500/50 rounded-xl p-5 shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-200 text-sm font-semibold uppercase tracking-wide">
                  Active Plans
                </p>
                <div className="w-12 h-12 bg-purple-500/40 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
              <p className="text-4xl font-bold text-white">
                {installmentStats.activeInstallments}
              </p>
            </div>
          </div>
        </div>

        {/* 🎯 INSTALLMENT PURCHASES LIST (PRIMARY SECTION) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            📦 My Installment Purchases
            <span className="text-sm font-normal text-gray-400">
              ({installmentPurchases.length} total)
            </span>
          </h2>

          {installmentPurchases.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No Installment Purchases"
              message="You don't have any installment purchases yet. Your installment purchase history will appear here once you make a purchase."
            />
          ) : (
            <div className="space-y-4">
              {installmentPurchases.map((purchase) => {
                const totalPaid =
                  purchase.finalTotal - purchase.remainingAmount;
                const progress =
                  purchase.finalTotal > 0
                    ? ((totalPaid / purchase.finalTotal) * 100).toFixed(1)
                    : 0;

                // Find next due payment
                const nextDue = purchase.timeline
                  ?.filter((t) => !t.paid)
                  .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

                return (
                  <div
                    key={purchase._id}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg hover:shadow-2xl hover:border-cyan-500/50 transition-all cursor-pointer"
                    onClick={() => fetchInstallmentDetail(purchase._id)}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-white/10">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">
                          Invoice: {purchase.invoiceId}
                        </h3>
                        <p className="text-sm text-gray-300">
                          Date:{" "}
                          {new Date(purchase.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">
                          Rs. {purchase.finalTotal.toLocaleString()}
                        </p>
                        <span
                          className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                            purchase.status === "paid"
                              ? "bg-green-600/80 text-gray-10 border border-green-700"
                              : purchase.status === "active"
                                ? "bg-blue-600/80 text-gray-10 border border-blue-700"
                                : "bg-yellow-600/80 text-gray-10 border border-yellow-700"
                          }`}
                        >
                          {purchase.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-green-500/60 border border-green-500/30 rounded-lg p-3">
                        <p className="text-green-300 text-xs mb-1">
                          Paid Amount
                        </p>
                        <p className="text-lg font-bold text-white">
                          Rs. {totalPaid.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-yellow-500/50 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-yellow-300 text-xs mb-1">
                          Remaining Balance
                        </p>
                        <p className="text-lg font-bold text-white">
                          Rs. {purchase.remainingAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-purple-500/50 border border-purple-500/30 rounded-lg p-3">
                        <p className="text-purple-300 text-xs mb-1">
                          Monthly Payment
                        </p>
                        <p className="text-lg font-bold text-white">
                          Rs.{" "}
                          {purchase.monthlyPayment?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-900 mb-2">
                        <span>Payment Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-800 to-cyan-800 h-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Next Due Payment */}
                    {nextDue && (
                      <div className="bg-cyan-700/70 border border-cyan-500/30 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-cyan-300 text-xs mb-1">
                              Next Payment Due
                            </p>
                            <p className="text-white font-semibold">
                              Rs. {nextDue.paymentAmount.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-cyan-300 text-xs mb-1">
                              Due Date
                            </p>
                            <p className="text-white font-semibold">
                              {new Date(nextDue.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Click to view details hint */}
                    <div className="mt-4 text-center">
                      <p className="text-black text-sm">
                        Click to view full details
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 💰 CASH PURCHASES (SECONDARY SECTION - COLLAPSIBLE) */}
        {cashPurchases.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowCashPurchases(!showCashPurchases)}
              className="w-full flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-4 hover:bg-white/15 transition-colors"
            >
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                💵 Cash Purchases
                <span className="text-sm font-normal text-gray-400">
                  ({cashPurchases.length} completed)
                </span>
              </h2>
              <span className="text-white text-2xl">
                {showCashPurchases ? "▼" : "▶"}
              </span>
            </button>

            {showCashPurchases && (
              <div className="space-y-3">
                {cashPurchases.map((purchase) => (
                  <div
                    key={purchase._id}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-semibold">
                          Invoice: {purchase.invoiceId}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">
                          Rs. {purchase.finalTotal.toLocaleString()}
                        </p>
                        <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                          COMPLETED
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Installment Detail Modal */}
        {showDetailModal && selectedSale && (
          <InstallmentDetail
            sale={selectedSale}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedSale(null);
            }}
          />
        )}

        {/* Loading Overlay */}
        {loadingDetail && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <p className="text-white text-lg">Loading details...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
