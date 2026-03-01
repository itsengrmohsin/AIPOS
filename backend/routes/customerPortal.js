const express = require("express");
const router = express.Router();
const { auth, customerOnly } = require("../middleware/auth");
const {
  getMyProfile,
  updateMyProfile,
  getMyPurchases,
  getMyInstallments,
  getPendingPayments,
  getDashboardStats,
  getInstallmentDetail,
  changePassword,
} = require("../controllers/customerPortalController");

// All routes require authentication and customer role
router.use(auth);
router.use(customerOnly);

// Profile routes
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);

// Purchase routes
router.get("/purchases", getMyPurchases);
router.get("/installments", getMyInstallments);
router.get("/installments/:saleId", getInstallmentDetail);

// Payment routes
router.get("/pending-payments", getPendingPayments);

// Stats route
router.get("/stats", getDashboardStats);

// Password management
router.put("/change-password", changePassword);

module.exports = router;
