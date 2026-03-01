import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { User, Mail, CreditCard, Phone, Save, X, Edit3, Loader } from "lucide-react";
import api from "../../../../../utils/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load logged-in user profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user._id || user.id;

      if (!userId) {
        setLoading(false);
        return; // Handle case where no user is logged in if necessary
      }

      const res = await api.get(`/users/${userId}`);
      if (res.data) {
        setProfile(res.data);
        setForm(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  function notifySuccess(msg) {
    toast.success(msg, { position: "top-right", autoClose: 2000, theme: "dark" });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "cnic") {
      let digits = value.replace(/\D/g, "").slice(0, 13);
      let formatted = digits;
      if (digits.length > 5 && digits.length <= 12)
        formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
      if (digits.length === 13)
        formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
      setForm((s) => ({ ...s, cnic: formatted }));
      return;
    }
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleSave() {
    if (!form.name?.trim()) return toast.error("Name is required");
    if (!form.email?.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(form.email)) return toast.error("Invalid email");
    if (form.cnic && !/^\d{5}-\d{7}-\d{1}$/.test(form.cnic))
      return toast.error("CNIC must be 13 digits in 5-7-1 format");

    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user._id || user.id;

      const res = await api.put(`/users/${userId}/profile`, {
        name: form.name,
        email: form.email,
        cnic: form.cnic,
      });

      if (res.data.success) {
        // Update local storage with new user data
        const updatedUser = { ...user, ...res.data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Dispatch event for other components to update
        window.dispatchEvent(new Event("user-updated"));

        setProfile(res.data.user);
        notifySuccess("Profile updated successfully");
        setIsModalOpen(false);
        setConfirmModalOpen(false);
      }
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  function openModal() {
    setForm({ ...profile });
    setIsModalOpen(true);
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        <Loader className="w-10 h-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center text-white/50">
        User not found.
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-6 animate-fadeIn">
      <ToastContainer />

      {/* Main Card */}
      <div className="relative w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden group">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-50 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-400/30 transition duration-700" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-400/30 transition duration-700" />

        <div className="relative z-10 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-1 mb-6 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-3xl font-bold text-white uppercase">
                {profile.name?.charAt(0) || "U"}
              </span>
            </div>
          </div>

          <h2 className="text-4xl font-extrabold text-white my-4 tracking-tight">
            {profile.name}
          </h2>
        

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-10">
            <InfoItem
              icon={<CreditCard className="w-5 h-5 text-black" />}
              label="CNIC"
              value={profile.cnic || "N/A"}
            />
            <InfoItem
              icon={<Phone className="w-5 h-5 text-black" />}
              label="Email Address"
              value={profile.email || "N/A"}
            />
            {/* Add more fields here if needed */}
          </div>

          <button
            onClick={openModal}
            className="group relative inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-white font-semibold shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Edit3 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#1a1c23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-semibold text-white">Edit Profile</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/50 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setConfirmModalOpen(true);
              }}
              className="p-6 space-y-5"
            >
              <InputField
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                icon={<User className="w-5 h-5" />}
              />
              <InputField
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                icon={<Mail className="w-5 h-5" />}
              />
              <InputField
                label="CNIC (xxxxx-xxxxxxx-x)"
                name="cnic"
                value={form.cnic}
                onChange={handleChange}
                icon={<CreditCard className="w-5 h-5" />}
              />

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg shadow-cyan-500/20 transition font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#1a1c23] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-scaleIn">
            <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-400">
              <Save className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Save Changes?</h3>
            <p className="text-white/60 mb-8">
              Are you sure you want to update your profile information?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Components
function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
      <div className="p-2.5 bg-white/10 rounded-lg text-cyan-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-white/50 mb-1">{label}</p>
        <p className="text-white font-medium break-all">{value}</p>
      </div>
    </div>
  );
}

function InputField({ label, name, type = "text", value, onChange, icon }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/70 ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-cyan-400 transition-colors">
          {icon}
        </div>
        <input
          name={name}
          type={type}
          value={value || ""}
          onChange={onChange}
          className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-white placeholder-white/20 outline-none transition-all"
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      </div>
    </div>
  );
}

