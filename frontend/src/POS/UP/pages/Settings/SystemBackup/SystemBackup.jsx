import React, { useState } from "react";
import BackupIcon from "@mui/icons-material/Backup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SystemBackup() {
  const [loading, setLoading] = useState(false);
  const [latestBackup, setLatestBackup] = useState(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  // ✅ Create Backup
  const handleCreateBackup = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Branch selection removed as requested requirement was full DB backup (which usually ignores branch in mongodump unless specific filtering is added)
      // If branch logic is strictly required by business logic, we can keep it, but for a "System Backup" it often implies the whole DB.
      // Keeping branch check if user desires, but making it optional in code for now or assuming Header Office defaults if not selected, 
      // but to be safe and match user existing UI, let's keep the check if they want to enforcing selecting a 'source' label.
      
      const token = localStorage.getItem("token"); 
      if (!token) {
        toast.error("You are not authenticated", {
             position: "top-right",
             autoClose: 2000,
             theme: "dark",
        });
        setLoading(false);
        return;
      }

      toast.info("Starting backup process...", {
        position: "top-right",
        autoClose: 2000,
        theme: "dark",
      });

      const response = await fetch("http://localhost:5000/api/system/backup", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Backup failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `database-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
            filename = match[1];
        }
      }
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Backup downloaded successfully!", {
        position: "top-right",
        autoClose: 2000,
        theme: "dark",
      });

    } catch (error) {
      console.error("Backup error:", error);
      toast.error(error.message || "Failed to create backup.", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } finally {
        setLoading(false);
    }
  };

  // ✅ Download Backup (deprecated/removed as download happens automatically now)
  const handleDownload = (backup) => {
    // This function is no longer needed with the direct download approach
    // kept for reference if needed, but the main logic is in handleCreateBackup
  };

  // ✅ Print Backup Report
  const handlePrint = (backup) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>Backup Report</title></head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h2>Backup Report</h2>
          <p><strong>Branch:</strong> ${backup.branch}</p>
          <p><strong>Backup ID:</strong> ${backup.id}</p>
          <p><strong>Date:</strong> ${formatDate(backup.date)}</p>
          <p><strong>Size:</strong> ${backup.size}</p>
          <hr/>
          <p>Backup created successfully and verified.</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();

    toast.success("Backup report sent to printer!", {
      position: "bottom-center",
      autoClose: 2000,
      theme: "dark",
    });
  };

  return (
    <div className="p-6 h-[100%] text-white flex flex-col items-center justify-center">
      {/* ✅ Dark Toasts with 2s Duration */}
      <ToastContainer theme="dark" autoClose={2000} />

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex flex-col items-center  shadow-lg p-8 max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">System Backup</h1>
        <p className="text-white/80 mb-6">
          Download the latest backup for your system.
        </p>



        {/* Create Backup Button */}
        <button
          disabled={loading}
          className={`flex items-center justify-center border border-white/40 gap-2 w-1/2 bg-cyan-800/80 hover:bg-cyan-900 px-4 py-2 rounded-md text-lg font-semibold transition cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleCreateBackup}
        >
          {loading ? (
             <>
               <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
               Creating Backup...
             </>
          ) : (
             <>
               <BackupIcon />
               Backup Now
             </>
          )}
        </button>
      </div>

    </div>
  );
}
