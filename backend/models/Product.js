const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    model: { type: String, required: true, index: true },
    category: { type: String, default: "Uncategorized" },
    categoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    brand: { type: String },
    description: { type: String },
    
    // Pricing
    unitPrice: { type: Number, required: true, default: 0 },
    costPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }, // Percentage
    
    // Inventory
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },

    // Supplier & Company Info (User Requested)
    supplier: { type: String },
    supplierContact: { type: String },
    company: { type: String },
    
    // Payment Info (User Requested)
    paymentMethod: { type: String },
    
    // Additional Info (Keeping simplified)
    barcode: { type: String, unique: true, sparse: true },
    sku: { type: String, unique: true, sparse: true },
    
    // We can keep these as they might be useful internally, 
    // but we won't show them in the UI if user asked to remove "extra"
    images: [{ type: String }], 
    specifications: { type: Object },
    
    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
    },

    // Invoice ID (Latest) - to satisfy user requirement of showing it
    lastInvoiceId: { type: String },

    // Metadata
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

// Indexes for better query performance
ProductSchema.index({ name: "text", model: "text", brand: "text" });
ProductSchema.index({ stock: 1, lowStockThreshold: 1 });
ProductSchema.index({ category: 1, status: 1 });

// Virtual for checking if product is low stock
ProductSchema.virtual("isLowStock").get(function () {
  return this.stock <= this.lowStockThreshold;
});

// Method to update stock
ProductSchema.methods.updateStock = function (quantity, operation = "add") {
  if (operation === "add") {
    this.stock += quantity;
  } else if (operation === "subtract") {
    this.stock = Math.max(0, this.stock - quantity);
  }
  return this.save();
};

module.exports = mongoose.model("Product", ProductSchema);
