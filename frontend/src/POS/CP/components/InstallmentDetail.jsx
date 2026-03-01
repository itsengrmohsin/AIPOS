import React from "react";
import { X } from "lucide-react";

const InstallmentDetail = ({ sale, onClose }) => {
  if (!sale) return null;

  // Calculate payment statistics
  const totalPaid = sale.finalTotal - sale.remainingAmount;
  const paymentProgress = sale.finalTotal > 0 
    ? ((totalPaid / sale.finalTotal) * 100).toFixed(1) 
    : 0;

  // Count paid and pending installments
  const paidCount = sale.timeline?.filter(t => t.paid).length || 0;
  const totalCount = sale.timeline?.length || 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900/98 to-gray-800/98 backdrop-blur-md border-2 border-[#159FA8]/40 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#159FA8]/95 to-[#0d7a82]/95 backdrop-blur-md p-6 flex justify-between items-center border-b border-[#159FA8]/40">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">
              💳 Installment Details
            </h2>
            <p className="text-gray-200 text-sm">
              Invoice: {sale.invoiceId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-red-500/80 bg-red-500/60 p-2 rounded-lg transition-all duration-200"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Purchase Summary */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              📋 Purchase Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Purchase Date</p>
                <p className="text-white font-medium">
                  {new Date(sale.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Payment Method</p>
                <p className="text-white font-medium">
                  {sale.paymentMethod || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Plan Duration</p>
                <p className="text-white font-medium">
                  {sale.planMonths} months
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Subtotal</p>
                <p className="text-white font-medium">
                  Rs. {sale.subtotal.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Markup ({sale.markupRate}%)</p>
                <p className="text-white font-medium">
                  Rs. {sale.markupAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Advance Payment</p>
                <p className="text-green-400 font-medium">
                  Rs. {sale.advancePayment.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Total and Remaining */}
            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-600/30 border-2 border-blue-500/50 rounded-lg p-4 shadow-lg">
                <p className="text-gray-200 text-xs font-semibold uppercase tracking-wide mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-white">
                  Rs. {sale.finalTotal.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-600/30 border-2 border-green-500/50 rounded-lg p-4 shadow-lg">
                <p className="text-gray-200 text-xs font-semibold uppercase tracking-wide mb-1">Paid Amount</p>
                <p className="text-2xl font-bold text-white">
                  Rs. {totalPaid.toLocaleString()}
                </p>
              </div>
              <div className="bg-orange-600/30 border-2 border-orange-500/50 rounded-lg p-4 shadow-lg">
                <p className="text-gray-200 text-xs font-semibold uppercase tracking-wide mb-1">Remaining</p>
                <p className="text-2xl font-bold text-white">
                  Rs. {sale.remainingAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Payment Progress</span>
                <span>{paymentProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-cyan-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${paymentProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              🛍️ Products Purchased
            </h3>
            <div className="space-y-3">
              {sale.products.map((product, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between items-center hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium text-lg">
                      {product.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Model: {product.model} | Category: {product.category}
                    </p>
                    <p className="text-gray-300 text-sm mt-1">
                      Qty: {product.quantity} × Rs. {product.unitPrice.toLocaleString()}
                      {product.discount > 0 && (
                        <span className="text-green-400 ml-2">
                          (Discount: Rs. {product.discount.toLocaleString()})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      Rs. {product.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Timeline */}
          {sale.timeline && sale.timeline.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                📅 Payment Schedule
                <span className="text-sm font-normal text-gray-400">
                  ({paidCount} of {totalCount} paid)
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sale.timeline.map((installment, idx) => {
                  const isOverdue = !installment.paid && new Date(installment.dueDate) < new Date();
                  const isPaid = installment.paid;
                  const isPending = !isPaid && !isOverdue;

                  return (
                    <div
                      key={idx}
                      className={`rounded-lg p-4 border-2 transition-all hover:scale-105 ${
                        isPaid
                          ? "bg-green-500/10 border-green-500/50"
                          : isOverdue
                          ? "bg-red-500/10 border-red-500/50 animate-pulse"
                          : "bg-yellow-500/10 border-yellow-500/50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-white font-semibold">
                          Payment #{installment.paymentNumber}
                        </span>
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            isPaid
                              ? "bg-green-500/30 text-green-200"
                              : isOverdue
                              ? "bg-red-500/30 text-red-200"
                              : "bg-yellow-500/30 text-yellow-200"
                          }`}
                        >
                          {isPaid ? "✓ PAID" : isOverdue ? "⚠ OVERDUE" : "⏳ PENDING"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-gray-400 text-xs">Amount</p>
                          <p className="text-white text-xl font-bold">
                            Rs. {installment.paymentAmount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Due Date</p>
                          <p className="text-white text-sm">
                            {new Date(installment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        {isPaid && installment.paidOn && (
                          <div>
                            <p className="text-gray-400 text-xs">Paid On</p>
                            <p className="text-green-300 text-sm">
                              {new Date(installment.paidOn).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {installment.transactionId && (
                          <div>
                            <p className="text-gray-400 text-xs">Transaction ID</p>
                            <p className="text-gray-300 text-xs font-mono">
                              {installment.transactionId}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex justify-center">
            <div
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold ${
                sale.status === "paid"
                  ? "bg-green-500/20 text-green-300 border border-green-500/50"
                  : sale.status === "active"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                  : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
              }`}
            >
              <span>
                {sale.status === "paid" ? "✓" : sale.status === "active" ? "⚡" : "⏳"}
              </span>
              <span>Status: {sale.status.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallmentDetail;
