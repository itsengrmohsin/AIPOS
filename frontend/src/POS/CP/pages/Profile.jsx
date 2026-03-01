import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CPProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load logged-in customer profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Use NEW customer portal endpoint
      const res = await api.get("/cp/profile");
      const profileData = {
        customerId: res.data.customerId,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        name: `${res.data.firstName} ${res.data.lastName}`,
        email: res.data.email || "",
        contact: res.data.contact || "",
        cnic: res.data.cnic || "",
        city: res.data.city || "",
        address: res.data.address || "",
        status: res.data.status || "Active",
      };
      
      setProfile(profileData);
    } catch (err) {
      console.error("[CP Profile] Failed to load profile:", err);
      toast.error(
        err.response?.data?.error || "Failed to load profile",
        { autoClose: 2000 }
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading your profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-white p-4">
      <ToastContainer position="top-right" autoClose={2000} theme="dark" />

      <div className="max-w-md w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6 pb-4 border-b border-white/10">
          <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-[#159FA8]/40 to-[#0d7a82]/40 rounded-full flex items-center justify-center border-2 border-[#159FA8]/50">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="text-2xl font-bold tracking-wide text-white">
            {profile.name}
          </h2>
          <p className="text-sm text-gray-900 mt-1">Customer Profile</p>
        </div>

        {/* Profile Information Grid */}
        <div className="space-y-3 mb-6">
          {/* Customer ID */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🆔</span>
              <div className="flex-1">
                <p className="text-xs text-gray-900 uppercase tracking-wide">Customer ID</p>
                <p className="text-white font-medium">{profile.customerId}</p>
              </div>
            </div>
          </div>

          {/* CNIC */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📇</span>
              <div className="flex-1">
                <p className="text-xs text-gray-900 uppercase tracking-wide">CNIC</p>
                <p className="text-white font-medium">{profile.cnic || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📧</span>
              <div className="flex-1">
                <p className="text-xs text-gray-900 uppercase tracking-wide">Email</p>
                <p className="text-white font-medium">{profile.email || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div className="flex-1">
                <p className="text-xs text-gray-900 uppercase tracking-wide">Contact</p>
                <p className="text-white font-medium">{profile.contact || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* City */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏙️</span>
              <div className="flex-1">
                <p className="text-xs text-gray-900 uppercase tracking-wide">City</p>
                <p className="text-white font-medium">{profile.city || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div className="flex-1">
                <p className="text-xs text-gray-900 uppercase tracking-wide">Address</p>
                <p className="text-white font-medium">{profile.address || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {profile.status === "Active" ? "✅" : "⚠️"}
              </span>
              <div className="flex-1">
                <p className="text-xs text-gray-900 uppercase tracking-wide">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    profile.status === "Active"
                      ? "bg-green-500/20 text-green-300 border border-green-500/50"
                      : profile.status === "Inactive"
                      ? "bg-red-500/20 text-red-300 border border-red-500/50"
                      : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
                  }`}
                >
                  {profile.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-[#159FA8]/10 border border-[#159FA8]/30 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <span className="text-[#159FA8] text-lg">ℹ️</span>
            <p className="text-xs text-gray-200">
              Your profile information is managed by the administrator. 
              To update your details, please contact support.
            </p>
          </div>
        </div>

        {/* Change Password Button */}
        <button
          onClick={() => navigate('/cp/change-password')}
          className="w-full px-6 py-3 bg-gradient-to-r from-[#159FA8]/80 to-[#0d7a82]/80 hover:from-[#159FA8] hover:to-[#0d7a82] rounded-lg shadow-lg hover:shadow-[#159FA8]/50 transition-all duration-200 font-medium flex items-center justify-center gap-2 border border-[#159FA8]/30"
        >
          <span className="text-xl">🔒</span>
          Change Password
        </button>
      </div>
    </div>
  );
}
