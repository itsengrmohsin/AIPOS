const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// @desc    Verify CNIC, Email and send password reset (ADMIN)
// @route   POST /api/AP/auth/verify-reset
// @access  Public
exports.verifyAndResetPassword = async (req, res) => {
  try {
    const { cnic, email } = req.body;

    // Validate all required fields
    if (!cnic || !email) {
      return res.status(400).json({ 
        success: false,
        message: "CNIC and Email are required" 
      });
    }

    // Clean and format inputs
    const cleanCnic = cnic.replace(/\D/g, ""); // Remove non-digits
    const cleanEmail = email.trim().toLowerCase();

    // Validate CNIC format (13 digits)
    if (cleanCnic.length !== 13) {
      return res.status(400).json({ 
        success: false,
        message: "CNIC must be 13 digits" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid email format" 
      });
    }

    // Find admin user by CNIC and email (both must match)
    const admins = await User.find({ role: "admin" });
    
    const user = admins.find(admin => {
      const dbCnic = (admin.cnic || "").replace(/\D/g, "");
      const dbEmail = (admin.email || "").toLowerCase();
      
      return dbCnic === cleanCnic && dbEmail === cleanEmail;
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "No admin found with these credentials. Please verify your CNIC and Email." 
      });
    }

    // Generate a random 8-character password (alphanumeric)
    const tempPassword = crypto.randomBytes(4).toString("hex").toUpperCase();

    // Hash the temporary password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    console.log(`[Admin Password Reset] Password reset for: ${user.email}`);
    console.log(`[Admin Password Reset] Temp Password: ${tempPassword}`);

    res.json({
      success: true,
      message: "Password reset successful!",
      tempPassword: tempPassword,
      email: user.email,
      instructions: "Please copy this password and login. Change your password immediately after logging in."
    });

  } catch (error) {
    console.error("[Admin Password Reset] Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error. Please try again later." 
    });
  }
};
