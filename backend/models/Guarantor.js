const mongoose = require("mongoose");

const GuarantorSchema = new mongoose.Schema(
  {
    guarantorId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    contact: { type: String, required: true },
    cnic: { type: String, required: true, unique: true },
    city: { type: String },
    address: { type: String },
    dateAdded: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Guarantor", GuarantorSchema);
