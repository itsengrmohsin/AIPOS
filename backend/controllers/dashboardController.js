const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const Customer = require("../models/Customer");
const Guarantor = require("../models/Guarantor");
const Product = require("../models/Product");

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parallel fetch for performance
    const [
      allSales,
      allPurchases,
      customerCount,
      guarantorCount,
      cashCustomersCount,
      installmentCustomersCount,
    ] = await Promise.all([
      Sale.find({ status: { $ne: "cancelled" } }),
      Purchase.find(),
      Customer.countDocuments(),
      Guarantor.countDocuments(),
      Sale.distinct("customerId", { saleType: "cash" }).then((ids) => ids.length),
      Sale.distinct("customerId", { saleType: "installment" }).then((ids) => ids.length),
    ]);

    // Sales Stats
    let totalRevenue = 0;
    let todaySalesTotal = 0;
    let cashSalesTotal = 0;
    let installmentSalesTotal = 0;
    let pendingInstallmentsCount = 0;
    let pendingInstallmentsValue = 0;
    let totalCOGS = 0;
    let totalProfit = 0;

    // Track cash invoices count (not unique customers)
    let cashInvoicesCount = 0;

    // Process each sale with COGS calculation
    for (const sale of allSales) {
      const revenue = Number(sale.finalTotal || 0);
      totalRevenue += revenue;

      const saleDate = new Date(sale.createdAt);
      saleDate.setHours(0, 0, 0, 0);
      if (saleDate.getTime() === today.getTime()) {
        todaySalesTotal += revenue;
      }

      // Calculate COGS for this sale with Purchase fallback
      let saleCOGS = 0;
      if (sale.products && sale.products.length > 0) {
        for (const product of sale.products) {
          let costPrice = Number(product.costPrice || 0);
          
          // If costPrice is 0 or missing, try to get from Purchase or Product model
          if (costPrice === 0) {
            try {
              // Try Product model first
              const dbProduct = await Product.findOne({
                $or: [
                  { productId: product.productId },
                  { model: product.model }
                ]
              }).select('costPrice');
              
              if (dbProduct && dbProduct.costPrice) {
                costPrice = Number(dbProduct.costPrice);
              } else {
                // Fallback to Purchase model
                const purchase = await Purchase.findOne({
                  $or: [
                    { productId: product.productId },
                    { model: product.model }
                  ]
                }).select('price').sort({ createdAt: -1 });
                
                if (purchase && purchase.price) {
                  costPrice = Number(purchase.price);
                }
              }
            } catch (err) {
              console.warn(`[COGS] Could not fetch cost for ${product.productId}:`, err.message);
            }
          }
          
          const quantity = Number(product.quantity || 0);
          saleCOGS += (costPrice * quantity);
        }
      }
      
      totalCOGS += saleCOGS;
      totalProfit += (revenue - saleCOGS);

      if (sale.saleType === "cash") {
        cashSalesTotal += revenue;
        cashInvoicesCount++; // Count total cash invoices
      } else if (sale.saleType === "installment") {
        installmentSalesTotal += revenue;
        if (sale.remainingAmount > 0) {
          pendingInstallmentsCount++;
          pendingInstallmentsValue += Number(sale.remainingAmount);
        }
      }
    }

    // Inventory Stats
    let totalStockValue = 0; // Value of current stock (selling price estimate? Or cost?)
    // Usually Stock Value = Cost Price * Quantity
    let totalStockCost = 0;
    let totalUnits = 0;
    let lowStockCount = 0;
    
    // Suppliers (distinct)
    const suppliers = new Set();

    allPurchases.forEach((p) => {
      const qty = Number(p.quantity || 0);
      const price = Number(p.price || 0); // Cost price likely
      // If p.price is unit price

      if (qty > 0) {
        totalStockCost += qty * price;
        totalUnits += qty;
        if (qty < 5) lowStockCount++;
      }
      if (p.supplier) suppliers.add(p.supplier);
    });

    // Calculate profit margin
    const profitMargin = totalRevenue > 0 
      ? ((totalProfit / totalRevenue) * 100).toFixed(2) 
      : 0;

    res.json({
      revenue: totalRevenue,
      todaySales: todaySalesTotal,
      cashSales: cashSalesTotal,
      installmentSales: installmentSalesTotal,
      
      // COGS and Profit
      costOfGoodsSold: totalCOGS,
      grossProfit: totalProfit,
      profitMargin: parseFloat(profitMargin),
      
      pendingInstallmentsCount,
      pendingInstallmentsValue,
      
      // Customer stats - cashInvoices shows total cash invoice count
      cashInvoices: cashInvoicesCount,
      cashCustomers: cashCustomersCount, // Keep for backward compatibility
      installmentCustomers: installmentCustomersCount,
      totalCustomers: customerCount,
      
      totalUnits,
      totalProducts: allPurchases.length,
      stockCost: totalStockCost,
      totalSuppliers: suppliers.size,
      totalGuarantors: guarantorCount,
      lowStockCount,
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};
