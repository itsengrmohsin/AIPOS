const Purchase = require("../models/Purchase");

// Create a new purchase
exports.createPurchase = async (req, res) => {
  try {
    const payload = req.body || {};

    // Basic validation — ensure productId or invoiceId and quantity exist
    if (!payload.productId && !payload.invoiceId) {
      return res
        .status(400)
        .json({ error: "productId or invoiceId is required" });
    }
    if (!payload.quantity || Number(payload.quantity) <= 0) {
      return res
        .status(400)
        .json({ error: "quantity must be a positive number" });
    }

    // Compute total if not provided
    const price = parseFloat(payload.price) || 0;
    const quantity = parseInt(payload.quantity) || 0;
    const total = payload.total ? parseFloat(payload.total) : price * quantity;

    // |===============================| Sync with Product Model |===============================|
    // Check if product exists, if so update stock. If not, create it.
    let product = await require("../models/Product").findOne({ productId: payload.productId });

    if (product) {
      // Update existing product stock
      product.stock += quantity;
      // Update other details to keep them in sync
      product.unitPrice = price; 
      if (payload.supplier) product.supplier = payload.supplier;
      await product.save();
    } else {
      // Create new product if it doesn't exist
      product = new require("../models/Product")({
        productId: payload.productId,
        name: payload.name || "Unknown Product",
        model: payload.model || "Unknown Model",
        category: payload.category || "Uncategorized",
        unitPrice: price,
        stock: quantity,
        supplier: payload.supplier,
        supplierId: payload.supplierId, // If available
        description: payload.description,
      });
      await product.save();
    }

    const purchase = new Purchase({
      invoiceId: payload.invoiceId,
      productId: payload.productId,
      name: payload.name,
      model: payload.model,
      category: payload.category,
      quantity,
      price,
      total,
      supplier: payload.supplier,
      supplierContact: payload.supplierContact,
      company: payload.company,
      paymentMethod: payload.paymentMethod,
      type: payload.type || "new-purchase", // Default type
      savedOn: payload.savedOn ? new Date(payload.savedOn) : new Date(),
      meta: payload.meta || {},
    });

    await purchase.save();
    return res.status(201).json(purchase);
  } catch (err) {
    console.error("createPurchase error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// List purchases
exports.listPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 });
    return res.json(purchases);
  } catch (err) {
    console.error("listPurchases error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get by id
exports.getPurchaseById = async (req, res) => {
  try {
    const id = req.params.id;
    const purchase = await Purchase.findById(id);
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });
    return res.json(purchase);
  } catch (err) {
    console.error("getPurchaseById error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update purchase
exports.updatePurchase = async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};
    const updated = await Purchase.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return res.status(404).json({ error: "Purchase not found" });
    return res.json(updated);
  } catch (err) {
    console.error("updatePurchase error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get next purchase ID
exports.getNextPurchaseId = async (req, res) => {
  try {
    const lastPurchase = await Purchase.findOne().sort({ createdAt: -1 });
    
    let nextInvoiceId = "Inv-001";
    let nextProductId = "P-001";

    if (lastPurchase) {
      if (lastPurchase.invoiceId) {
        const lastInvNum = parseInt(lastPurchase.invoiceId.replace("Inv-", ""), 10);
        if (!isNaN(lastInvNum)) {
           nextInvoiceId = `Inv-${String(lastInvNum + 1).padStart(3, "0")}`;
        }
      }
      
      if (lastPurchase.productId) {
        const lastProdNum = parseInt(lastPurchase.productId.replace("P-", ""), 10);
        if (!isNaN(lastProdNum)) {
           nextProductId = `P-${String(lastProdNum + 1).padStart(3, "0")}`;
        }
      }
    }

    res.json({ nextInvoiceId, nextProductId });
  } catch (err) {
    console.error("getNextPurchaseId error", err);
    res.status(500).json({ error: "Failed to get next purchase ID" });
  }
};
