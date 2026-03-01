const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const Customer = require("../models/Customer");
const User = require("../models/User");
const Product = require("../models/Product");

// Create a new sale (cash or installment)
exports.createSale = async (req, res) => {
  try {
    const payload = req.body || {};

    if (!["cash", "installment"].includes(payload.saleType)) {
      return res.status(400).json({
        error: "saleType must be 'cash' or 'installment'",
      });
    }

    if (!Array.isArray(payload.products) || payload.products.length === 0) {
      return res.status(400).json({ error: "products array is required" });
    }

    // Determine userId for cash sales fallback
    if (payload.saleType !== "installment") {
      // cash sale: allow fallback to the authenticated user
      payload.userId = payload.userId || req.user?.id;
    }

    const subtotal =
      payload.subtotal ||
      payload.products.reduce(
        (sum, p) => sum + (Number(p.total) || p.unitPrice * p.quantity),
        0,
      );

    const discountAmount = Number(payload.discountAmount || 0);
    const markupAmount = Number(payload.markupAmount || 0);
    const finalTotal = subtotal - discountAmount + markupAmount;
    const advancePayment = Number(payload.advancePayment || 0);
    const remainingAmount = finalTotal - advancePayment;

    // Determine customerId string (C-001 style) from Customer collection if possible
    // Resolve `customerId` (C-001 style) from payload.customerId or from Customer.userId
    console.log("[SALE] Payload received:", {
      saleType: payload.saleType,
      userId: payload.userId,
      customerId: payload.customerId,
      products: payload.products?.length,
    });

    let resolvedCustomerId = null;
    if (payload.customerId) {
      console.log("[SALE] Using customerId from payload:", payload.customerId);
      resolvedCustomerId = payload.customerId;
    } else if (payload.userId) {
      console.log("[SALE] Resolving customerId from userId:", payload.userId);
      try {
        const cust = await Customer.findOne({ userId: payload.userId }).select(
          "customerId firstName lastName",
        );
        console.log(
          "[SALE] Customer lookup result:",
          cust
            ? {
                customerId: cust.customerId,
                name: `${cust.firstName} ${cust.lastName}`,
              }
            : "null",
        );
        if (cust && cust.customerId) resolvedCustomerId = cust.customerId;
      } catch (err) {
        console.warn(
          "[SALE] Could not resolve customerId from userId",
          err.message,
        );
      }
    }

    console.log("[SALE] Final resolvedCustomerId:", resolvedCustomerId);

    // For installment sales, ensure we have a valid resolvedCustomerId
    if (payload.saleType === "installment" && !resolvedCustomerId) {
      console.error("[SALE] Missing customerId for installment sale");
      return res.status(400).json({ error: "Invalid customer id" });
    }

    // Enrich products with costPrice from Product model for COGS calculation
    const enrichedProducts = await Promise.all(
      payload.products.map(async (product) => {
        try {
          // Find product in database by productId or model
          const dbProduct = await Product.findOne({
            $or: [
              { productId: product.productId },
              { model: product.model }
            ]
          }).select('costPrice');

          const costPrice = dbProduct?.costPrice || 0;
          
          return {
            ...product,
            costPrice: costPrice
          };
        } catch (err) {
          console.warn(`[SALE] Could not fetch costPrice for product ${product.productId}:`, err.message);
          return {
            ...product,
            costPrice: 0
          };
        }
      })
    );

    // Calculate total COGS
    const totalCOGS = enrichedProducts.reduce((sum, product) => {
      return sum + (Number(product.costPrice || 0) * Number(product.quantity || 0));
    }, 0);

    // Calculate profit
    const profit = finalTotal - totalCOGS;

    console.log("[SALE] COGS Calculation:", {
      totalCOGS,
      finalTotal,
      profit,
      productsWithCost: enrichedProducts.map(p => ({
        name: p.name,
        costPrice: p.costPrice,
        quantity: p.quantity,
        itemCOGS: p.costPrice * p.quantity
      }))
    });

    const sale = new Sale({
      invoiceId: payload.invoiceId || `INV-${Date.now()}`,
      saleType: payload.saleType,
      products: enrichedProducts, // Use enriched products with costPrice
      userId: payload.userId, // ✅ DIRECT users._id
      customerId: resolvedCustomerId || null,
      guarantorId: payload.guarantorId || null,
      paymentMethod: payload.paymentMethod || null,
      planMonths: payload.planMonths || 0,
      markupRate: payload.markupRate || 0,
      advancePayment,
      monthlyPayment: payload.monthlyPayment || 0,
      timeline: payload.timeline || [],
      subtotal,
      discountAmount,
      markupAmount,
      finalTotal,
      remainingAmount,
      totalCOGS, // Add COGS to sale
      profit, // Add profit to sale
      status: payload.saleType === "cash" ? "paid" : "active",
      createdBy: req.user.id,
      savedOn: new Date(),
    });

    const saved = await sale.save();

    // After saving sale, decrement corresponding purchase stock quantities
    try {
      for (const prod of payload.products) {
        try {
          const match = prod.productId
            ? { productId: prod.productId }
            : prod.model
              ? { model: prod.model }
              : null;
          if (!match) continue;

          const purchase = await Purchase.findOne(match);
          if (!purchase) continue;

          const soldQty = Number(prod.quantity || 0);
          const currentQty = Number(purchase.quantity || 0);
          const newQty = Math.max(0, currentQty - soldQty);

          purchase.quantity = newQty;
          purchase.updatedAt = new Date();
          purchase.savedOn = purchase.savedOn || new Date();
          if (!purchase.meta) purchase.meta = {};
          purchase.meta.lastUpdateMessage = `Sold ${soldQty} (invoice ${saved.invoiceId})`;
          await purchase.save();
        } catch (err) {
          console.warn(
            "Could not update purchase quantity for product",
            prod,
            err,
          );
        }
      }
    } catch (err) {
      console.error("Error while updating purchase stocks after sale:", err);
    }

    return res.status(201).json(saved);
  } catch (err) {
    console.error("createSale error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.listSales = async (req, res) => {
  try {
    const { saleType } = req.query;

    // Build filter - return all sales (no user filtering)
    const filter = {};

    // Add saleType filter if provided
    if (saleType) {
      filter.saleType = saleType;
    }

    const sales = await Sale.find(filter).sort({ createdAt: -1 });
    return res.json(sales);
  } catch (err) {
    console.error("listSales error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const id = req.params.id;
    const sale = await Sale.findById(id);
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    return res.json(sale);
  } catch (err) {
    console.error("getSaleById error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getSalesByCustomer = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const sales = await Sale.find({ customerId }).sort({ createdAt: -1 });
    return res.json(sales);
  } catch (err) {
    console.error("getSalesByCustomer error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Record a payment for a specific sale timeline entry
exports.recordPayment = async (req, res) => {
  try {
    const saleId = req.params.id;
    const {
      paymentNumber,
      dueDate,
      paymentAmount,
      paymentDate,
      paymentMethod,
      transactionId,
    } = req.body || {};

    const sale = await Sale.findById(saleId);
    if (!sale) return res.status(404).json({ error: "Sale not found" });

    if (!Array.isArray(sale.timeline) || sale.timeline.length === 0) {
      return res
        .status(400)
        .json({ error: "No payment timeline found for sale" });
    }

    // Find timeline entry by paymentNumber first, else by dueDate
    let idx = -1;
    if (typeof paymentNumber !== "undefined" && paymentNumber !== null) {
      idx = sale.timeline.findIndex(
        (t) => Number(t.paymentNumber) === Number(paymentNumber),
      );
    }
    if (idx === -1 && dueDate) {
      idx = sale.timeline.findIndex(
        (t) =>
          new Date(t.dueDate).toISOString() === new Date(dueDate).toISOString(),
      );
    }
    if (idx === -1 && paymentAmount) {
      // fallback: match by amount and unpaid
      idx = sale.timeline.findIndex(
        (t) => Number(t.paymentAmount) === Number(paymentAmount) && !t.paid,
      );
    }

    if (idx === -1)
      return res
        .status(400)
        .json({ error: "Matching timeline entry not found" });

    const entry = sale.timeline[idx];
    if (entry.paid)
      return res.status(400).json({ error: "Installment already paid" });

    // Update timeline entry
    entry.paid = true;
    entry.paidOn = paymentDate || new Date().toISOString();
    entry.actualAmount =
      typeof paymentAmount !== "undefined"
        ? Number(paymentAmount)
        : Number(entry.paymentAmount || 0);
    entry.paymentMethod = paymentMethod || entry.paymentMethod || null;
    if (transactionId) entry.transactionId = transactionId;

    // Recompute sale totals
    sale.totalPaid = (sale.totalPaid || 0) + Number(entry.actualAmount || 0);
    sale.remainingAmount = Math.max(
      0,
      Number(sale.remainingAmount || 0) - Number(entry.actualAmount || 0),
    );

    // If all timeline entries are paid, mark sale as completed/paid
    const allPaid = sale.timeline.every((t) => t.paid);
    if (allPaid) sale.status = "paid";

    await sale.save();

    return res.json(sale);
  } catch (err) {
    console.error("recordPayment error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
