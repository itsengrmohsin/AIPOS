const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Sale = require("../models/Sale");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { auth, customerOnly } = require("../middleware/auth");

// TEST ROUTE - No auth to verify route registration works
router.get("/test", (req, res) => {
  res.json({ message: "✅ Customer routes are working!" });
});

// @desc    Get logged-in customer's profile
// @route   GET /api/cp/profile
// @access  Private (Customer only)
router.get("/profile", auth, customerOnly, async (req, res) => {
  try {
    const userId = req.user.id;
    const customer = await Customer.findOne({ userId });

    if (!customer) {
      return res.status(404).json({ 
        error: "Customer profile not found. Please contact support." 
      });
    }

    const user = await User.findById(userId).select("name");
    const fullName = user ? user.name : `${customer.firstName} ${customer.lastName}`;

    res.json({
      customerId: customer.customerId,
      name: fullName,
      firstName: customer.firstName,
      lastName: customer.lastName,
      contact: customer.contact,
      cnic: customer.cnic,
      city: customer.city,
      address: customer.address,
      status: customer.status,
      dateAdded: customer.dateAdded,
    });
  } catch (err) {
    console.error("getMyProfile error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// @desc    Update logged-in customer's profile
// @route   PUT /api/cp/profile
// @access  Private (Customer only)
router.put("/profile", auth, customerOnly, async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, contact, city, address } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ 
        error: "First name and last name are required" 
      });
    }

    const existingCustomer = await Customer.findOne({ userId });
    
    if (!existingCustomer) {
      return res.status(404).json({ error: "Customer profile not found" });
    }

    const customer = await Customer.findOneAndUpdate(
      { userId },
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        contact: contact?.trim() || existingCustomer.contact,
        city: city?.trim() || existingCustomer.city,
        address: address?.trim() || existingCustomer.address,
        updatedAt: new Date(),
      },
      { new: true }
    );

    await User.findByIdAndUpdate(userId, {
      name: `${firstName.trim()} ${lastName.trim()}`
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      customer: {
        customerId: customer.customerId,
        name: `${customer.firstName} ${customer.lastName}`,
        firstName: customer.firstName,
        lastName: customer.lastName,
        contact: customer.contact,
        cnic: customer.cnic,
        city: customer.city,
        address: customer.address,
        status: customer.status,
      },
    });
  } catch (err) {
    console.error("updateMyProfile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// @desc    Get logged-in customer's purchases
// @route   GET /api/cp/purchases
// @access  Private (Customer only)
router.get("/purchases", auth, customerOnly, async (req, res) => {
  try {
    const userId = req.user.id;
    const customer = await Customer.findOne({ userId });

    if (!customer) {
      return res.status(404).json({ error: "Customer profile not found" });
    }

    const sales = await Sale.find({ customerId: customer.customerId })
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (err) {
    console.error("getMyPurchases error:", err);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

// @desc    Get logged-in customer's installments
// @route   GET /api/cp/installments
// @access  Private (Customer only)
router.get("/installments", auth, customerOnly, async (req, res) => {
  try {
    const userId = req.user.id;
    const customer = await Customer.findOne({ userId });

    if (!customer) {
      return res.status(404).json({ error: "Customer profile not found" });
    }

    const sales = await Sale.find({
      customerId: customer.customerId,
      saleType: "installment"
    }).sort({ createdAt: -1 });

    const installments = [];
    sales.forEach(sale => {
      if (sale.timeline && sale.timeline.length > 0) {
        sale.timeline.forEach(inst => {
          installments.push({
            saleId: sale._id,
            invoiceId: sale.invoiceId,
            paymentNumber: inst.paymentNumber,
            dueDate: inst.dueDate,
            paymentAmount: inst.paymentAmount,
            paid: inst.paid,
            paidOn: inst.paidOn,
            transactionId: inst.transactionId,
            products: sale.products,
          });
        });
      }
    });

    res.json(installments);
  } catch (err) {
    console.error("getMyInstallments error:", err);
    res.status(500).json({ error: "Failed to fetch installments" });
  }
});

// @desc    Get pending payments for logged-in customer
// @route   GET /api/cp/pending-payments
// @access  Private (Customer only)
router.get("/pending-payments", auth, customerOnly, async (req, res) => {
  try {
    const userId = req.user.id;
    const customer = await Customer.findOne({ userId });

    if (!customer) {
      return res.status(404).json({ error: "Customer profile not found" });
    }

    const sales = await Sale.find({
      customerId: customer.customerId,
      saleType: "installment",
      status: { $ne: "paid" }
    }).sort({ createdAt: -1 });

    const pendingPayments = [];
    sales.forEach(sale => {
      if (sale.timeline && sale.timeline.length > 0) {
        sale.timeline.forEach(inst => {
          if (!inst.paid) {
            pendingPayments.push({
              saleId: sale._id,
              invoiceId: sale.invoiceId,
              paymentNumber: inst.paymentNumber,
              dueDate: inst.dueDate,
              paymentAmount: inst.paymentAmount,
              isOverdue: new Date(inst.dueDate) < new Date(),
            });
          }
        });
      }
    });

    pendingPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json(pendingPayments);
  } catch (err) {
    console.error("getPendingPayments error:", err);
    res.status(500).json({ error: "Failed to fetch pending payments" });
  }
});

// @desc    Get dashboard statistics for logged-in customer
// @route   GET /api/cp/stats
// @access  Private (Customer only)
router.get("/stats", auth, customerOnly, async (req, res) => {
  try {
    const userId = req.user.id;
    const customer = await Customer.findOne({ userId });

    if (!customer) {
      return res.status(404).json({ error: "Customer profile not found" });
    }

    const allSales = await Sale.find({ customerId: customer.customerId });

    const stats = {
      totalPurchases: allSales.length,
      totalSpent: allSales.reduce((sum, sale) => sum + (sale.finalTotal || 0), 0),
      cashPurchases: allSales.filter(s => s.saleType === "cash").length,
      installmentPurchases: allSales.filter(s => s.saleType === "installment").length,
      totalPaid: allSales.reduce((sum, sale) => sum + (sale.finalTotal - sale.remainingAmount || 0), 0),
      totalRemaining: allSales.reduce((sum, sale) => sum + (sale.remainingAmount || 0), 0),
      activePlans: allSales.filter(s => s.saleType === "installment" && s.status !== "paid").length,
    };

    res.json(stats);
  } catch (err) {
    console.error("getDashboardStats error:", err);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// @desc    Get detailed installment information for a specific sale
// @route   GET /api/cp/installments/:saleId
// @access  Private (Customer only)
router.get("/installments/:saleId", auth, customerOnly, async (req, res) => {
  try {
    const userId = req.user.id;
    const { saleId } = req.params;

    const customer = await Customer.findOne({ userId });

    if (!customer) {
      return res.status(404).json({ error: "Customer profile not found" });
    }

    const sale = await Sale.findById(saleId);

    if (!sale) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    if (sale.customerId !== customer.customerId) {
      return res.status(403).json({ 
        error: "Access denied. This purchase does not belong to you." 
      });
    }

    res.json(sale);
  } catch (err) {
    console.error("getInstallmentDetail error:", err);
    res.status(500).json({ error: "Failed to fetch installment details" });
  }
});

// @desc    Change customer password
// @route   PUT /api/cp/change-password
// @access  Private (Customer only)
router.put("/change-password", auth, customerOnly, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: "Current password and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: "New password must be at least 6 characters long" 
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ 
        error: "New password must be different from current password" 
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

console.log("✅ Customer Portal (CP) routes module loaded successfully");

module.exports = router;
