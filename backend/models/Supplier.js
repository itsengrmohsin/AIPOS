const mongoose = require("mongoose");

const SupplierSchema = new mongoose.Schema(
  {
    supplierId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    company: { type: String },
    
    // Contact Information
    contact: { type: String, required: true },
    alternateContact: { type: String },
    email: { type: String },
    
    // Address
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: "Pakistan" },
    postalCode: { type: String },
    
    // Business Details
    taxId: { type: String },
    businessRegNo: { type: String },
    
    // Supplied Products
    productsSupplied: [{ type: String }], // Array of product IDs or names
    productCategories: [{ type: String }], // Categories they supply
    
    // Financial
    totalPurchases: { type: Number, default: 0 },
    totalPurchaseValue: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    creditLimit: { type: Number, default: 0 },
    paymentTerms: { type: String, default: "Cash on Delivery" }, // e.g., "Net 30"
    
    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "blacklisted"],
      default: "active",
    },
    
    // Rating & Performance
    rating: { type: Number, min: 0, max: 5, default: 0 },
    
    // Metadata
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: { type: String },
    lastPurchaseDate: { type: Date },
  },
  { timestamps: true }
);

// Indexes for better query performance
SupplierSchema.index({ name: "text", company: "text" });
SupplierSchema.index({ status: 1 });

module.exports = mongoose.model("Supplier", SupplierSchema);
