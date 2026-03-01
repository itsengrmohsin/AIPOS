const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMe } = require("../controllers/authController");
const { auth } = require("../middleware/auth");

// ❌ PUBLIC REGISTRATION DISABLED
// Only admin can add customers through the admin panel
// router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Get current user (Private)
router.get("/me", auth, getMe);

module.exports = router;
