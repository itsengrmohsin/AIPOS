const express = require("express");
const router = express.Router();
const { getBackup } = require("../controllers/backupController");
const { auth, adminOnly } = require("../middleware/auth");

/**
 * @desc    Get full database backup
 * @route   GET /api/system/backup
 * @access  Private/Admin
 */
router.get("/", auth, adminOnly, getBackup);

module.exports = router;
