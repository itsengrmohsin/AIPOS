require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const connectDB = require("../config/db");

// Connect to DB
const seedDatabase = async () => {
  try {
    await connectDB();

    // Check if admin exists
    const adminEmail = "admin@zubi.com";
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "Admin",
        email: "admin@zubi.com",
        cnic: "00000-0000000-0",
        password: hashedPassword,
        role: "admin",
      });
      console.log(`✅ Admin user created: admin@zubi.com / admin123`);
    } else {
      console.log("ℹ️ Admin user already exists");
    }

    // Add more seed logic here for other collections if needed in the future

    process.exit();
  } catch (error) {
    console.error("❌ Seed Error:", error);
    process.exit(1);
  }
};

seedDatabase();
