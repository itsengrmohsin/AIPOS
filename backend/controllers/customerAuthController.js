const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// @desc    Verify CNIC, Email, Contact and send password reset (CUSTOMER)
// @route   POST /api/customer-portal/forgot-password
// @access  Public
exports.customerForgotPassword = async (req, res) => {
  try {
    const { cnic, email, contact } = req.body;

    console.log("[Customer Forgot Password] Request received:", { cnic, email, contact });

    // Validate required fields (contact is optional)
    if (!cnic || !email) {
      return res.status(400).json({ 
        success: false,
        message: "CNIC and Email are required" 
      });
    }

    // Clean and format inputs
    const cleanCnic = cnic.replace(/\D/g, ""); // Remove non-digits
    const cleanEmail = email.trim().toLowerCase();
    const cleanContact = contact.replace(/\D/g, ""); // Remove non-digits

    console.log("[Customer Forgot Password] Cleaned inputs:", { 
      cleanCnic, 
      cleanEmail, 
      cleanContact,
      cnicLength: cleanCnic.length,
      contactLength: cleanContact.length
    });

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

    // Find customer user by CNIC and email (both must match)
    const customers = await User.find({ role: "customer" });
    
    console.log(`[Customer Forgot Password] Found ${customers.length} customers in database`);
    
    // Debug: Show all customers' data
    customers.forEach((c, idx) => {
      const dbCnic = (c.cnic || "").replace(/\D/g, "");
      const dbEmail = (c.email || "").toLowerCase();
      const dbContact = (c.contact || "").replace(/\D/g, "");
      
      console.log(`[Customer ${idx + 1}]:`, {
        name: c.name,
        dbCnic,
        dbEmail,
        dbContact,
        cnicMatch: dbCnic === cleanCnic,
        emailMatch: dbEmail === cleanEmail,
        contactMatch: dbContact === cleanContact
      });
    });
    
    const user = customers.find(customer => {
      const dbCnic = (customer.cnic || "").replace(/\D/g, "");
      const dbEmail = (customer.email || "").toLowerCase();
      
      // Only verify CNIC and Email (contact is optional since it's not in database)
      return dbCnic === cleanCnic && dbEmail === cleanEmail;
    });

    if (!user) {
      console.log("[Customer Forgot Password] No matching customer found");
      return res.status(404).json({ 
        success: false,
        message: "No customer found with these credentials. Please verify your CNIC, Email, and Contact number." 
      });
    }

    console.log("[Customer Forgot Password] Match found:", user.name);

    // Generate a random 8-character password (alphanumeric)
    const tempPassword = crypto.randomBytes(4).toString("hex").toUpperCase();

    // Hash the temporary password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    console.log(`[Customer Password Reset] Password reset for: ${user.email}`);
    console.log(`[Customer Password Reset] Temp Password: ${tempPassword}`);

    res.json({
      success: true,
      message: "Password reset successful!",
      tempPassword: tempPassword,
      email: user.email,
      instructions: "Please copy this password and login. Change your password immediately after logging in."
    });

  } catch (error) {
    console.error("[Customer Password Reset] Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error. Please try again later." 
    });
  }
};
