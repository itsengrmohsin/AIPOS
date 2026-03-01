const Product = require("../models/Product");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");

// List all products with their current stock state
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    return res.json(products);
  } catch (err) {
    console.error("listProducts error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.id });
    if (!product) {
      // Try by _id if productId not found
      try {
        const productById = await Product.findById(req.params.id);
        if (productById) return res.json(productById);
      } catch (e) {
        // Ignore invalid ObjectId error
      }
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json(product);
  } catch (err) {
    console.error("getProductById error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update product details
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find by productId first, then _id
    let product = await Product.findOne({ productId: id });
    
    if (!product) {
       try {
        product = await Product.findById(id);
       } catch(e) {}
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      // Prevent updating separate stock logic directly via this generic update if needed
      // but for now allow it as admin override
      product[key] = updateData[key];
    });

    await product.save();
    return res.json(product);
  } catch (err) {
    console.error("updateProduct error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Add Stock (Real-time update)
// 1. Updates Product stock
// 2. Creates a Purchase record for history
exports.addStock = async (req, res) => {
  try {
    const { id } = req.params; // productId or _id
    const { quantity, price, supplier, total, invoiceId } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Valid quantity is required" });
    }

    // Find Product
    let product = await Product.findOne({ productId: id });
     if (!product) {
       try {
        product = await Product.findById(id);
       } catch(e) {}
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 1. Update Product Stock (Atomic increment)
    // We do NOT update price/supplier here anymore as requested, only stock count.
    product.stock += parseInt(quantity);
    await product.save();

    // 2. Create Purchase Record (History) with existing product details
    const newPurchase = new Purchase({
      invoiceId: invoiceId || `STK-${Date.now()}`, // Auto-generate if not provided
      productId: product.productId,
      name: product.name,
      model: product.model,
      category: product.category,
      quantity: parseInt(quantity),
      // Use existing product price/supplier since we aren't asking for new ones
      price: product.unitPrice || 0,
      total: (product.unitPrice || 0) * parseInt(quantity),
      supplier: product.supplier || "Unknown",
      type: "stock-addition",
      // Add explanation/note if provided
      meta: req.body.note ? { note: req.body.note } : {},
      savedOn: new Date(),
    });

    await newPurchase.save();

    return res.json({ 
      message: "Stock added successfully", 
      product, 
      purchase: newPurchase 
    });

  } catch (err) {
    console.error("addStock error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Sync Inventory (Recalculate Stock from Purchases and Sales)
exports.syncInventory = async (req, res) => {
  try {
    console.log("Starting inventory sync...");
    
    // 1. Aggregate Purchases (Incoming Stock) - sorted by date to get latest details
    const purchaseAgg = await Purchase.aggregate([
        { $sort: { savedOn: 1 } }, // Sort oldest to newest so $last gives the most recent
        {
            $group: {
                _id: "$productId",
                totalPurchased: { $sum: "$quantity" },
                name: { $last: "$name" },
                model: { $last: "$model" },
                category: { $last: "$category" },
                unitPrice: { $last: "$price" },
                supplier: { $last: "$supplier" },
                supplierContact: { $last: "$supplierContact" },
                company: { $last: "$company" },
                paymentMethod: { $last: "$paymentMethod" },
                lastInvoiceId: { $last: "$invoiceId" },
                lastUpdated: { $max: "$savedOn" }
            }
        }
    ]);

    // 2. Aggregate Sales (Outgoing Stock)
    const salesAgg = await Sale.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalSold: { $sum: "$products.quantity" }
        }
      }
    ]);

    // Map sales for O(1) lookup
    const salesMap = {};
    salesAgg.forEach(s => {
        if(s._id) salesMap[s._id] = s.totalSold;
    });

    // 3. Prepare Bulk Operations
    // Filter out items without proper Product ID
    const validPurchases = purchaseAgg.filter(p => p._id && p._id.trim() !== "");

    const operations = validPurchases.map(p => {
        const sold = salesMap[p._id] || 0;
        const currentStock = Math.max(0, p.totalPurchased - sold);
        
        return {
            updateOne: {
                filter: { productId: p._id },
                update: {
                    $set: {
                        productId: p._id,
                        name: p.name || "Unknown Product",
                        model: p.model || "Unknown Model",
                        category: p.category || "Uncategorized",
                        unitPrice: p.unitPrice || 0,
                        supplier: p.supplier || "",
                        supplierContact: p.supplierContact || "",
                        company: p.company || "",
                        paymentMethod: p.paymentMethod || "",
                        lastInvoiceId: p.lastInvoiceId || "",
                        stock: currentStock,
                        // Only set created time if inserting
                        $setOnInsert: {
                          createdAt: new Date()
                        }
                    }
                },
                upsert: true
            }
        };
    });

    if (operations.length > 0) {
        await Product.bulkWrite(operations);
    }

    console.log(`Synced ${operations.length} products.`);

    return res.json({ 
        message: "Inventory synced successfully", 
        productsUpdated: operations.length 
    });

  } catch (err) {
    console.error("syncInventory error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get product history (purchases and sales)
exports.getProductHistory = async (req, res) => {
  try {
    const { id } = req.params; // productId

    // 1. Get Purchases
    const purchases = await Purchase.find({ productId: id })
      .sort({ savedOn: -1 })
      .lean();

    // 2. Get Sales (need to filter by product inside the products array)
    const sales = await Sale.find({ "products.productId": id })
      .sort({ savedOn: -1 })
      .lean();

    // Transform sales to show quantity of THIS product
    const salesHistory = sales.map(sale => {
      const item = (sale.products || []).find(p => p.productId === id);
      return {
        ...sale,
        quantity: item ? item.quantity : 0,
        type: 'sale',
        price: item ? item.unitPrice : 0,
        savedOn: sale.savedOn // ensure date exists
      };
    });

    const purchaseHistory = purchases.map(p => ({ ...p, type: 'purchase' }));

    // Merge and sort
    const history = [...purchaseHistory, ...salesHistory].sort((a, b) => new Date(b.savedOn) - new Date(a.savedOn));

    return res.json(history);
  } catch (err) {
    console.error("getProductHistory error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
