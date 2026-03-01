const express = require("express");
const router = express.Router();
const { verifyAndResetPassword } = require("../controllers/adminAuthController");

console.log("🔥 Admin Auth Routes Loading...");
console.log("✅ verifyAndResetPassword function loaded:", typeof verifyAndResetPassword);

// Test route to verify admin auth is working
router.get("/test", (req, res) => {
  console.log("✅ Admin Auth Test Route Hit!");
  res.json({ 
    success: true, 
    message: "Admin Auth routes are working!",
    endpoint: "/api/AP/auth/test"
  });
});

// Admin password reset via CNIC, Email, Contact
router.post("/verify-reset", (req, res, next) => {
  console.log("📨 POST /api/AP/auth/verify-reset hit!");
  console.log("Request body:", req.body);
  verifyAndResetPassword(req, res, next);
});

console.log("✅ Admin Auth Routes Registered:");
console.log("   - GET  /test");
console.log("   - POST /verify-reset");

module.exports = router;
