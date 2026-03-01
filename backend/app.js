require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const app = express();

// Middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(mongoSanitize());
app.use(morgan("dev"));

// TEST ROUTE - DELETE AFTER DEBUGGING
app.get("/api/test-route-works", (req, res) => {
  res.json({ message: "✅ Routes are working! Server reloaded successfully!" });
});
console.log("🔥🔥🔥 TEST ROUTE REGISTERED AT /api/test-route-works 🔥🔥🔥");

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/purchases", require("./routes/purchases"));
app.use("/api/products", require("./routes/products"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/guarantors", require("./routes/guarantors"));
app.use("/api/sales", require("./routes/sales"));

// NEW CUSTOMER PORTAL ROUTES - Using /api/cp prefix
console.log("🚀🚀🚀 ATTEMPTING TO LOAD /api/cp ROUTES... 🚀🚀🚀");
try {
  const cpRoutes = require("./routes/cp");
  console.log("✅ CP routes module loaded, type:", typeof cpRoutes);
  app.use("/api/cp", cpRoutes);
  console.log("✅✅✅ /api/cp ROUTES REGISTERED SUCCESSFULLY! ✅✅✅");
} catch (error) {
  console.error("❌❌❌ FATAL ERROR LOADING /api/cp ROUTES:", error.message);
  console.error("Stack:", error.stack);
}

// Customer Portal Routes - Inline to ensure they load
console.log("[DEBUG] Loading customer portal middleware and controller...");
const { auth, customerOnly } = require("./middleware/auth");
console.log("[DEBUG] Auth middleware loaded successfully");

const customerPortalController = require("./controllers/customerPortalController");
console.log("[DEBUG] Customer portal controller loaded. Functions:", Object.keys(customerPortalController));

// Profile routes
console.log("[DEBUG] Registering customer portal routes...");
app.get("/api/customer-portal/profile", auth, customerOnly, customerPortalController.getMyProfile);
app.put("/api/customer-portal/profile", auth, customerOnly, customerPortalController.updateMyProfile);

// Purchase routes
app.get("/api/customer-portal/purchases", auth, customerOnly, customerPortalController.getMyPurchases);
app.get("/api/customer-portal/installments", auth, customerOnly, customerPortalController.getMyInstallments);
app.get("/api/customer-portal/installments/:saleId", auth, customerOnly, customerPortalController.getInstallmentDetail);

// Payment routes
app.get("/api/customer-portal/pending-payments", auth, customerOnly, customerPortalController.getPendingPayments);

// Stats route
app.get("/api/customer-portal/stats", auth, customerOnly, customerPortalController.getDashboardStats);

// Password management
app.put("/api/customer-portal/change-password", auth, customerOnly, customerPortalController.changePassword);

// Test endpoint to verify customer portal routes are working
app.get("/api/customer-portal/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Customer portal routes are working!",
    availableRoutes: [
      "GET /api/customer-portal/test",
      "POST /api/customer-portal/forgot-password"
    ]
  });
});

// Customer forgot password (PUBLIC - no auth required)
console.log("🔥 Registering customer forgot password route...");
const { customerForgotPassword } = require("./controllers/customerAuthController");
app.post("/api/customer-portal/forgot-password", customerForgotPassword);
console.log("✅ Customer forgot password route registered at POST /api/customer-portal/forgot-password");

console.log("[DEBUG] ✅ All customer portal routes registered successfully!");

app.use("/api", require("./routes/system"));
app.use("/api/system/backup", require("./routes/backupRoute"));


// Base Route
app.get("/", (req, res) => res.send("Zubi backend is running"));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Server error" });
});

module.exports = app;
