const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../middleware/auth");
const {
  createSale,
  listSales,
  getSaleById,
  getSalesByCustomer,
  recordPayment,
} = require("../controllers/saleController");

// POST /api/sales -> create a sale (admin only)
router.post("/", auth, adminOnly, createSale);

// GET /api/sales -> list sales (admin only)
router.get("/", auth, adminOnly, listSales);

const { getDashboardStats } = require("../controllers/dashboardController");

// ⚠️ IMPORTANT: Specific routes MUST come before generic :id route
// GET /api/sales/dashboard/stats -> get dashboard stats (admin only)
router.get("/dashboard/stats", auth, adminOnly, getDashboardStats);

// GET /api/sales/customer/:customerId -> get sales for a customer (admin only)
router.get("/customer/:customerId", auth, adminOnly, getSalesByCustomer);

// POST /api/sales/:id/pay -> record a payment for a sale timeline entry (admin only)
router.post("/:id/pay", auth, adminOnly, recordPayment);

// GET /api/sales/:id -> get a sale (admin only)
router.get("/:id", auth, adminOnly, getSaleById);

module.exports = router;
