const mongoose = require("mongoose");

const PaymentTimelineSchema = new mongoose.Schema(
  {
    paymentNumber: { type: Number },
    dueDate: { type: Date },
    paymentAmount: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    paidOn: { type: Date },
    transactionId: { type: String },
  },
  { _id: false }
);

const SaleProductSchema = new mongoose.Schema(
  {
    productId: { type: String },
    name: { type: String },
    model: { type: String },
    category: { type: String },
    unitPrice: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 }, // Purchase/cost price for COGS calculation
    quantity: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, required: true, unique: true },
    saleType: { type: String, enum: ["cash", "installment"], required: true },
    products: { type: [SaleProductSchema], default: [] },
    customerId: { type: String, default: null },
    guarantorId: { type: String, default: null },
    paymentMethod: { type: String, default: null },
    planMonths: { type: Number, default: 0 },
    markupRate: { type: Number, default: 0 },
    advancePayment: { type: Number, default: 0 },
    monthlyPayment: { type: Number, default: 0 },
    timeline: { type: [PaymentTimelineSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    markupAmount: { type: Number, default: 0 },
    finalTotal: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    totalCOGS: { type: Number, default: 0 }, // Cost of Goods Sold
    profit: { type: Number, default: 0 }, // Profit = finalTotal - totalCOGS
    status: {
      type: String,
      enum: ["pending", "active", "paid", "partial", "cancelled"],
      default: "pending",
    },
    createdBy: { type: String },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    meta: { type: Object, default: {} },
    savedOn: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", SaleSchema);
