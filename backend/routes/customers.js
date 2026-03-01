const express = require("express");
const router = express.Router();
const {
  listCustomers,
  createCustomer,
  updateCustomer,
  nextCustomerId,
} = require("../controllers/customerController");
const { auth, adminOnly } = require("../middleware/auth");

// All customer management routes require admin access
router.get("/", auth, adminOnly, listCustomers);
router.get("/next-id", auth, adminOnly, nextCustomerId);
router.post("/", auth, adminOnly, createCustomer);
router.put("/:id", auth, adminOnly, updateCustomer);

module.exports = router;
