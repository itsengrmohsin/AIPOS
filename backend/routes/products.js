const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { auth, adminOnly } = require("../middleware/auth");

// Public/Protected Routes (Adjust auth as strictly needed)
// For now, assuming standard auth for POS usage

router.get("/", productController.listProducts);
router.get("/:id", productController.getProductById);

// Update product details
router.put("/:id", productController.updateProduct);

// Add Stock (Specific route for stock management)
router.post("/:id/stock", productController.addStock);

// Sync Inventory (Recalculate Stock from Purchases/Sales)
router.post("/sync", productController.syncInventory);

// Get product history
router.get("/:id/history", productController.getProductHistory);

module.exports = router;
