const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "10h" } // Extended for usability, can be restricted for higher security
  );
};

// @desc    Register a new user (Customer by default)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, cnic, password } = req.body;

    // Validate input
    if (!name || !email || !cnic || !password) {
      return res.status(400).json({ error: "Please provide all required fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { cnic }] });
    if (userExists) {
      return res.status(400).json({ error: "User already exists with this Email or CNIC" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (Always force role to 'customer' for public registration)
    const user = await User.create({
      name,
      email,
      cnic,
      password: hashedPassword,
      role: "customer", 
    });

    if (user) {
      // Auto-create Customer record for the new user
      const Customer = require("../models/Customer");
      
      // Generate next customerId
      const customers = await Customer.find().select("customerId");
      let max = 0;
      customers.forEach((c) => {
        if (!c.customerId) return;
        const match = c.customerId.match(/C-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > max) max = num;
        }
      });
      const nextCustomerId = `C-${String(max + 1).padStart(3, "0")}`;

      // Split name into firstName and lastName
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || name;
      const lastName = nameParts.slice(1).join(" ") || "";

      // Create Customer record
      await Customer.create({
        customerId: nextCustomerId,
        firstName,
        lastName,
        contact: email, // Use email as contact initially
        cnic,
        city: "",
        address: "",
        status: "Active",
        userId: user._id, // Link to User
      });

      const token = generateToken(user);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ error: "Server error during registration" });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input (email field can contain Email OR CNIC)
    if (!email || !password) {
      return res.status(400).json({ error: "Please provide credentials" });
    }

    // Check for user by Email OR CNIC
    const user = await User.findOne({
      $or: [{ email: email }, { cnic: email }],
    });

    // Validate password
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user);
      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: "Server error during login" });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("GetMe Error:", error.message);
    res.status(500).json({ error: "Server error fetching profile" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
