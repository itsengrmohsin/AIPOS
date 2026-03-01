const express = require("express");
const router = express.Router();
const { getUsers, getUserById, updatePassword, updateProfile, verifyPassword } = require("../controllers/userController");
const { auth } = require("../middleware/auth");

// Get users (with optional role filter: ?role=customer)
router.get("/", auth, getUsers);

// Get single user by ID
router.get("/:id", auth, getUserById);

// Update user profile
router.put("/:id/profile", auth, updateProfile);

// Update user password
router.put("/:id/password", auth, updatePassword);

// Verify user password
router.post("/verify-password", auth, verifyPassword);

module.exports = router;

