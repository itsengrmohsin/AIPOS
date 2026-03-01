const express = require("express");
const router = express.Router();
const {
  createPurchase,
  listPurchases,
  getPurchaseById,
  getNextPurchaseId,
  updatePurchase,
} = require("../controllers/purchaseController");
const { auth } = require("../middleware/auth");

// GET /api/purchases/next-id -> get next purchase/invoice ID
router.get("/next-id", auth, getNextPurchaseId);

// POST /api/purchases -> create a purchase
router.post("/", auth, createPurchase);

// GET /api/purchases -> list purchases
router.get("/", auth, listPurchases);

// GET /api/purchases/:id -> get a purchase
router.get("/:id", auth, getPurchaseById);

// PUT /api/purchases/:id -> update a purchase
router.put("/:id", auth, updatePurchase);

module.exports = router;
