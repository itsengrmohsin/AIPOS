const Guarantor = require("../models/Guarantor");

exports.listGuarantors = async (req, res) => {
  try {
    const guarantors = await Guarantor.find().sort({ createdAt: -1 });
    res.json(guarantors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list guarantors" });
  }
};

exports.createGuarantor = async (req, res) => {
  try {
    const { guarantorId, firstName, lastName, contact, cnic, city, address } =
      req.body;

    if (!guarantorId || !firstName || !lastName || !contact || !cnic)
      return res.status(400).json({ error: "Missing required fields" });

    const existing = await Guarantor.findOne({
      $or: [{ cnic }, { guarantorId }],
    });
    if (existing)
      return res.status(400).json({ error: "Guarantor already exists" });

    const guarantor = new Guarantor({
      guarantorId,
      firstName,
      lastName,
      contact,
      cnic,
      city,
      address,
    });
    await guarantor.save();
    res.status(201).json(guarantor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create guarantor" });
  }
};

exports.updateGuarantor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const guarantor = await Guarantor.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!guarantor) {
      return res.status(404).json({ error: "Guarantor not found" });
    }

    res.json(guarantor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update guarantor" });
  }
};

exports.deleteGuarantor = async (req, res) => {
  try {
    const { id } = req.params;
    const guarantor = await Guarantor.findByIdAndDelete(id);

    if (!guarantor) {
      return res.status(404).json({ error: "Guarantor not found" });
    }

    res.json({ message: "Guarantor deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete guarantor" });
  }
};
