const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, index: true },
    productId: { type: String, index: true },
    name: { type: String },
    model: { type: String, index: true },
    category: { type: String },
    quantity: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    supplier: { type: String },
    supplierContact: { type: String },
    company: { type: String },
    paymentMethod: { type: String },
    type: { type: String },
    savedOn: { type: Date },
    meta: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", PurchaseSchema);
