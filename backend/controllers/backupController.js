const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const mongoose = require("mongoose");

/**
 * @desc    Create a full database backup and return as a zip file
 *          (Uses Node.js to fetch data, no mongodump dependency required)
 * @route   GET /api/system/backup
 * @access  Private/Admin
 */
const getBackup = async (req, res) => {
  let tempDir = null;
  let zipPath = null;
  const backupDir = path.join(process.cwd(), "db_backups");

  try {
    // 1. Setup paths
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    tempDir = path.join(backupDir, `backup-${timestamp}`);
    fs.mkdirSync(tempDir);

    const zipName = `database-backup-${timestamp}.zip`;
    zipPath = path.join(backupDir, zipName);

    console.log(`[Backup] Starting backup to: ${tempDir}`);

    // 2. Fetch all collections dynamically
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const name = collection.name;
      console.log(`[Backup] Fetching collection: ${name}`);
      
      // Fetch documents (raw)
      const documents = await mongoose.connection.db.collection(name).find({}).toArray();
      
      // Write to JSON file
      const filePath = path.join(tempDir, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
    }

    console.log("[Backup] Data export completed. Compressing...");

    // 3. Compress to Zip
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", () => {
      console.log(`[Backup] Archive created: ${archive.pointer()} total bytes`);
      
      // 4. Send File to User
      res.download(zipPath, zipName, (err) => {
        if (err) {
          console.error("[Backup] Download error:", err);
        }

        // 5. Cleanup Temp Files
        try {
          console.log("[Backup] Cleaning up temp files...");
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
          if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
          }
          console.log("[Backup] Cleanup successful");
        } catch (cleanupErr) {
          console.error("[Backup] Cleanup failed:", cleanupErr);
        }
      });
    });

    archive.on("error", (err) => {
      console.error("[Backup] Archiver error:", err);
      res.status(500).json({ error: "Backup compression failed" });
    });

    archive.pipe(output);
    archive.directory(tempDir, false); // Add JSON files to root of zip
    archive.finalize();

  } catch (err) {
    console.error("[Backup] Critical error:", err);
    
    // Cleanup on error
    if (tempDir && fs.existsSync(tempDir)) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
    }
    
    res.status(500).json({ 
      error: "Internal server error during backup",
      details: err.message 
    });
  }
};

module.exports = {
  getBackup,
};
