import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Lock, Eye, EyeOff } from "lucide-react";
import api from "../../../../../utils/api";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login first to change password", { autoClose: 2000 });
      return;
    }

    const userId = user._id || user.id;
    if (!userId) {
      toast.error("Invalid user session", { autoClose: 2000 });
      return;
    }

    if (!currentPassword.trim()) {
      return toast.error("Current password is required", { autoClose: 2000 });
    }
    if (!newPassword.trim()) {
      return toast.error("New password is required", { autoClose: 2000 });
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters", {
        autoClose: 2000,
      });
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match", { autoClose: 2000 });
    }
    if (currentPassword === newPassword) {
      return toast.error("New password must be different from current password", {
        autoClose: 2000,
      });
    }

    setLoading(true);
    try {
      // First verify current password by attempting login
      await api.post("/auth/login", { 
        email: user.email, 
        password: currentPassword 
      });

      // If login successful, update password
      const res = await api.put(`/users/${userId}/password`, { 
        password: newPassword 
      });

      if (res.data.success) {
        toast.success(res.data.message || "Password changed successfully!", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });

        // Reset form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("Password change error:", err);
      if (err.response?.status === 401) {
        toast.error("Current password is incorrect", { autoClose: 2000 });
      } else {
        toast.error(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to change password",
          { autoClose: 2000 }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100%] flex items-center justify-center text-white p-4">
      <ToastContainer position="top-right" autoClose={2000} theme="dark" />

      <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-10 shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-cyan-400 mr-3" />
          <h2 className="text-3xl font-extrabold tracking-wide">
            Change Password
          </h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5">
          <p className="text-center text-white/80 mb-6">
            Enter your current and new password
          </p>

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full p-4 rounded-lg bg-black/30 border border-white/20 text-white outline-none placeholder-white/60 focus:ring-2 focus:ring-cyan-400/50 transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full p-4 rounded-lg bg-black/30 border border-white/20 text-white outline-none placeholder-white/60 focus:ring-2 focus:ring-cyan-400/50 transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full p-4 rounded-lg bg-black/30 border border-white/20 text-white outline-none placeholder-white/60 focus:ring-2 focus:ring-cyan-400/50 transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-6 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-semibold transition shadow-lg disabled:opacity-50"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
