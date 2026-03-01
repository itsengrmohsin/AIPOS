import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Password strength calculator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" };
    
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z\d]/.test(password)) strength += 1;

    const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
    const colors = [
      "",
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-green-500",
      "bg-emerald-500",
    ];

    return {
      strength,
      label: labels[strength],
      color: colors[strength],
    };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.currentPassword) {
      return toast.error("Current password is required", { autoClose: 2000 });
    }

    if (!formData.newPassword) {
      return toast.error("New password is required", { autoClose: 2000 });
    }

    if (formData.newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters", {
        autoClose: 2000,
      });
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("Passwords do not match", { autoClose: 2000 });
    }

    if (formData.currentPassword === formData.newPassword) {
      return toast.error(
        "New password must be different from current password",
        { autoClose: 2000 }
      );
    }

    try {
      setLoading(true);

      const res = await api.put("/cp/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Password changed successfully!", {
          autoClose: 2000,
        });

        // Clear form
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // Redirect to profile after 2 seconds
        setTimeout(() => {
          navigate("/cp/profile");
        }, 2000);
      }
    } catch (err) {
      console.error("[Change Password] Error:", err);
      toast.error(err.response?.data?.error || "Failed to change password", {
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ToastContainer position="top-right" autoClose={2000} theme="dark" />

      <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-white mb-2">
            Change Password
          </h2>
          <p className="text-gray-300 text-sm">
            Update your account password securely
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Current Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className="w-full p-4 pr-12 rounded-lg bg-black/30 border border-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                {showPasswords.current ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              New Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password (min 6 characters)"
                className="w-full p-4 pr-12 rounded-lg bg-black/30 border border-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                {showPasswords.new ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-white font-medium">
                    {passwordStrength.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Use uppercase, lowercase, numbers, and symbols for a stronger
                  password
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Confirm New Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter new password"
                className="w-full p-4 pr-12 rounded-lg bg-black/30 border border-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                {showPasswords.confirm ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <p
                className={`text-xs mt-1 ${
                  formData.newPassword === formData.confirmPassword
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {formData.newPassword === formData.confirmPassword
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match"}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/cp/profile")}
              className="flex-1 px-6 py-3 border border-white/40 rounded-lg bg-gray-600/50 hover:bg-gray-700/50 text-white font-medium transition shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 border border-white/40 rounded-lg bg-cyan-800/80 hover:bg-cyan-900 text-white font-medium transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>

        {/* Security Tips */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-200 text-xs font-semibold mb-2">
            🔒 Security Tips:
          </p>
          <ul className="text-xs text-blue-100 space-y-1">
            <li>• Use a unique password you don't use elsewhere</li>
            <li>• Make it at least 10 characters long</li>
            <li>• Include uppercase, lowercase, numbers, and symbols</li>
            <li>• Avoid personal information like names or birthdays</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
