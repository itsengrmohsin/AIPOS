const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    contact: { type: String, required: true },
    cnic: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    status: { type: String, default: "Active" },
    address: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dateAdded: { type: Date, default: Date.now },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Customer", CustomerSchema);
