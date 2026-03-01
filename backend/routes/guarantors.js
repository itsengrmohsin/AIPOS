const express = require("express");
const router = express.Router();
const {
  listGuarantors,
  createGuarantor,
  updateGuarantor,
  deleteGuarantor,
} = require("../controllers/guarantorController");

const { auth } = require("../middleware/auth");

router.get("/", auth, listGuarantors);
router.post("/", auth, createGuarantor);
router.put("/:id", auth, updateGuarantor);
router.delete("/:id", auth, deleteGuarantor);

module.exports = router;
