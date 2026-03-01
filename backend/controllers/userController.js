const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Get users (optionally filtered by role)
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    
    console.log("GET /users - Query params:", req.query);
    console.log("GET /users - Role filter:", role);
    
    // Build query
    const query = {};
    if (role) {
      query.role = role;
    }

    console.log("GET /users - MongoDB query:", query);

    // Fetch users, exclude password field
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });
    
    console.log("GET /users - Found users:", users.length);
    
    res.json(users);
  } catch (err) {
    console.error("GET /users - Error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Update user password
exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Validation
    if (!password || password.trim().length < 6) {
      return res.status(400).json({ 
        error: "Password must be at least 6 characters long" 
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check authorization - users can only update their own password unless admin
    if (req.user.id !== id && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Not authorized to update this password" 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log(`Password updated for user: ${id}`);

    res.json({ 
      success: true,
      message: "Password updated successfully" 
    });
  } catch (err) {
    console.error("updatePassword error:", err);
    res.status(500).json({ error: "Failed to update password" });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, cnic, contact } = req.body;

    console.log("[updateProfile] Request received:", { id, name, email, cnic, contact });
    console.log("[updateProfile] Authenticated user:", req.user);

    // Find user
    const user = await User.findById(id);
    if (!user) {
      console.log("[updateProfile] User not found:", id);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("[updateProfile] User found:", { id: user._id, role: user.role });

    // Check authorization - users can only update their own profile unless admin
    if (req.user.id !== id && req.user.role !== "admin") {
      console.log("[updateProfile] Authorization failed:", { userId: req.user.id, targetId: id, role: req.user.role });
      return res.status(403).json({ 
        error: "Not authorized to update this profile" 
      });
    }

    console.log("[updateProfile] Authorization passed");

    // Update fields
    if (name) user.name = name.trim();
    if (email) {
      // Check if email already exists for another user
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        console.log("[updateProfile] Email already in use:", email);
        return res.status(400).json({ error: "Email already in use" });
      }
      user.email = email.trim();
    }
    if (cnic) user.cnic = cnic.trim();
    if (contact) user.contact = contact.trim();

    await user.save();

    console.log(`[updateProfile] Profile updated successfully for user: ${id}`);

    res.json({ 
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        cnic: user.cnic,
        contact: user.contact,
        role: user.role
      }
    });
  } catch (err) {
    console.error("[updateProfile] Error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Verify user password for sensitive operations
exports.verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id; // From auth middleware

    console.log("=== [verifyPassword] START ===");
    console.log("[verifyPassword] User ID from token:", userId);
    console.log("[verifyPassword] Password received:", password ? "YES (length: " + password.length + ")" : "NO");
    console.log("[verifyPassword] Request body:", req.body);

    if (!password) {
      console.log("[verifyPassword] ERROR: No password provided");
      return res.status(400).json({ 
        success: false,
        error: "Password is required" 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.log("[verifyPassword] ERROR: User not found with ID:", userId);
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    console.log("[verifyPassword] User found:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });

    // Compare password
    console.log("[verifyPassword] Comparing passwords...");
    console.log("[verifyPassword] Input password:", password);
    console.log("[verifyPassword] Stored hash:", user.password);
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    console.log("[verifyPassword] Password match result:", isMatch);
    console.log("=== [verifyPassword] END ===");

    res.json({ 
      success: isMatch,
      message: isMatch ? "Password verified" : "Invalid password"
    });
  } catch (err) {
    console.error("[verifyPassword] EXCEPTION:", err);
    res.status(500).json({ 
      success: false,
      error: "Verification failed" 
    });
  }
};
