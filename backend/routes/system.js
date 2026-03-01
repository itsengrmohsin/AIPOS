const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");
const Guarantor = require("../models/Guarantor");
const User = require("../models/User");

const { auth, adminOnly } = require("../middleware/auth");



module.exports = router;
