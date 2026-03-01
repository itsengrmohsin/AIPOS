const Customer = require("../models/Customer");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ==================== List all customers ====================
exports.listCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list customers" });
  }
};

// ==================== Create a new customer ====================
exports.createCustomer = async (req, res) => {
  try {
    const {
      customerId,
      firstName,
      lastName,
      contact,
      cnic,
      city,
      status = "Active",
      address,
      email,
      password,
    } = req.body;

    // Required fields validation
    if (!customerId || !firstName || !lastName || !contact || !cnic || !email || !password || !city || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Prevent duplicates by CNIC or customerId
    const existingCustomer = await Customer.findOne({
      $or: [{ cnic }, { customerId }],
    });
    if (existingCustomer) {
      return res.status(400).json({ error: "Customer already exists" });
    }

    const existingUser = await User.findOne({ cnic });
    if (existingUser) {
      return res.status(400).json({ error: "User with this CNIC already exists" });
    }

    // Generate temporary password if not provided
    const userPassword = password || `Temp${Math.random().toString(36).slice(-8)}`;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    // Create User account
    const newUser = await User.create({
      name: `${firstName} ${lastName}`,
      email,
      cnic,
      password: hashedPassword,
      role: "customer",
    });

    // Create Customer record
    const newCustomer = await Customer.create({
      customerId,
      firstName,
      lastName,
      contact,
      cnic,
      city,
      status,
      address,
      email,
      password: hashedPassword,
      userId: newUser._id,
    });

    res.status(201).json({
      success: true,
      customer: newCustomer,
      temporaryPassword: userPassword,
      message: password
        ? "Customer created successfully with provided password."
        : "Customer created successfully. Share the temporary password with the customer.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create customer" });
  }
};

// ==================== Update customer ====================
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Fields that should not be updated
    delete updates.customerId;
    delete updates.cnic;
    delete updates.userId;
    delete updates.dateAdded;

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(updatedCustomer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update customer" });
  }
};

// ==================== Generate next available Customer ID ====================
exports.nextCustomerId = async (req, res) => {
  try {
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

    const nextId = `C-${String(max + 1).padStart(3, "0")}`;
    res.json({ nextCustomerId: nextId });
  } catch (err) {
    console.error("nextCustomerId error", err);
    res.status(500).json({ error: "Failed to compute next customerId" });
  }
};
