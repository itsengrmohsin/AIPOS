import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Lock, Eye, EyeOff } from "lucide-react";
import api from "../../../utils/api";

export default function CPForgetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
        console.log("[CP ForgetPassword] User loaded from localStorage");
      } catch (e) {
        console.error(
          "[CP ForgetPassword] Failed to parse user from localStorage",
          e,
        );
      }
    }
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login first to reset password", { autoClose: 2000 });
      return;
    }

    // Handle both user._id and user.id
    const userId = user._id || user.id;
    if (!userId) {
      toast.error("Invalid user session", { autoClose: 2000 });
      return;
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

    setLoading(true);
    try {
      console.log("[CP ForgetPassword] Updating password for user:", userId);

      // Call backend endpoint to update password
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
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("[CP ForgetPassword] Password reset error:", err);
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to change password",
        {
          autoClose: 2000,
        },
      );
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
            Reset Password
          </h2>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <p className="text-center text-white/80 mb-6">
            Enter your new password below
          </p>

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

          <div>
            <label className="block text-sm font-medium mb-2">
              Confirm Password
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
