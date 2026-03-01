const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    receiptId: { type: String, required: true, unique: true },
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
    },
    customerId: { type: String },
    customerName: { type: String },
    productName: { type: String },
    installmentNumber: { type: Number },
    paymentAmount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    paymentDate: { type: Date, required: true },
    remainingAmount: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
