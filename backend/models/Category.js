const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    categoryId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String }, // Icon name or URL
    image: { type: String }, // Category image URL
    
    // Hierarchical categories
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    
    // Display settings
    displayOrder: { type: Number, default: 0 },
    color: { type: String, default: "#06b6d4" }, // Cyan default
    
    // Status
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    productCount: { type: Number, default: 0 }, // Computed field
  },
  { timestamps: true }
);

// Index for better query performance
CategorySchema.index({ status: 1, displayOrder: 1 });

module.exports = mongoose.model("Category", CategorySchema);
