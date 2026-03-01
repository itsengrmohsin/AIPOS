import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { ContentCopy, CheckCircle } from "@mui/icons-material";
import logo from "../../../assets/common-images/logo.webp";
import BackButton from "../../../components/Button/BackButton";
import api from "../../../utils/api";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const staggerContainer = { visible: { transition: { staggerChildren: 0.2 } } };
const cardVariant = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const ForgotPassword = () => {
  const [cnic, setCnic] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const formatCNIC = (value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 13);
    const match = cleaned.match(/^(\d{0,5})(\d{0,7})(\d{0,1})$/);
    return match
      ? [match[1], match[2], match[3]].filter(Boolean).join("-")
      : value;
  };

  const formatContact = (value) => {
    // If empty, return +
    if (!value) return "+";
    
    // If doesn't start with +, add it
    if (!value.startsWith("+")) {
      return "+" + value.replace(/[^\d]/g, "");
    }
    
    // Keep + and allow only digits after it
    return "+" + value.substring(1).replace(/[^\d]/g, "");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    toast.success("Password copied to clipboard!", {
      position: "top-right",
      autoClose: 2000,
      theme: "dark",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setTempPassword("");

    if (!cnic || !email) {
      setError("Please enter CNIC and Email.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/customer-portal/forgot-password", { 
        cnic, 
        email,
        contact: contact || "" // Optional
      });
      
      if (data?.success) {
        setTempPassword(data.tempPassword);
        toast.success("Password reset successful!", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
      } else {
        setError(data?.message || "Verification failed.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Server error. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>Forgot Password - Customer Portal</title>
      </Helmet>
      <ToastContainer position="top-right" autoClose={2500} theme="dark" />

      <motion.div
        className="min-h-screen flex items-center justify-center"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div className="max-w-md w-full mx-4" variants={cardVariant}>
          <motion.div
            className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl relative"
            variants={fadeInUp}
          >
            <BackButton />
            <motion.div className="text-center mb-4" variants={fadeInUp}>
              <div className="flex items-center justify-center mb-4">
                <Link
                  to="/cp-signin"
                  className="p-2 rounded-full backdrop-blur-md bg-white/10 shadow-lg hover:bg-white/20 transition duration-300 hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] transform hover:rotate-180"
                >
                  <img
                    src={logo}
                    alt="logo"
                    className="w-12 h-12 object-contain"
                  />
                </Link>
              </div>
              <motion.h1
                className="text-2xl font-bold text-white mb-1"
                variants={fadeInUp}
              >
                Forgot Password
              </motion.h1>
              <motion.p className="text-white text-sm" variants={fadeInUp}>
                Enter your CNIC and Email (Contact optional)
              </motion.p>
            </motion.div>

            {!tempPassword ? (
              <motion.form
                onSubmit={handleVerify}
                className="space-y-3"
                variants={staggerContainer}
              >
                {error && (
                  <motion.div
                    className="bg-red-500/90 border border-red-500/90 rounded-md p-3"
                    role="alert"
                    variants={fadeInUp}
                  >
                    <p className="text-red-200 text-sm">{error}</p>
                  </motion.div>
                )}

                <motion.div variants={fadeInUp}>
                  <label className="block text-white font-medium mb-1 text-sm">
                    CNIC
                  </label>
                  <input
                    type="text"
                    value={cnic}
                    onChange={(e) => setCnic(formatCNIC(e.target.value))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/80 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm"
                    placeholder="12345-1234567-1"
                    maxLength={15}
                  />
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <label className="block text-white font-medium mb-1 text-sm">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/80 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm"
                    placeholder="customer@example.com"
                  />
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <label className="block text-white font-medium mb-1 text-sm">
                    Contact Number <span className="text-white/60">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(formatContact(e.target.value))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/80 focus:outline-none focus:ring-1 focus:ring-white/40 text-sm"
                    placeholder="+923001234567"
                    maxLength={20}
                  />
                </motion.div>

                <motion.div className="flex justify-center" variants={fadeInUp}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 cursor-pointer mb-2 bg-cyan-950/70 backdrop-blur-lg border border-white/10 text-white/90 px-8 py-2 rounded-md font-semibold text-sm transition-all duration-200 hover:bg-cyan-950 hover:text-white disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Reset Password"}
                  </button>
                </motion.div>
              </motion.form>
            ) : (
              <motion.div
                className="space-y-4"
                variants={fadeInUp}
              >
                <div className="bg-green-500/20 border border-green-500/50 rounded-md p-4">
                  <p className="text-green-200 text-sm mb-3">
                    ✅ Password reset successful! Copy your temporary password:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempPassword}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white font-mono text-lg text-center select-all"
                    />
                    <button
                      onClick={handleCopy}
                      className="p-2 bg-cyan-700 hover:bg-cyan-800 rounded-md transition"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-green-300" />
                      ) : (
                        <ContentCopy className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                  <p className="text-white/80 text-xs mt-3">
                    ⚠️ Please change this password immediately after logging in.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/cp-signin")}
                  className="w-full bg-cyan-950/70 backdrop-blur-lg border border-white/10 text-white/90 px-8 py-2 rounded-md font-semibold text-sm transition-all duration-200 hover:bg-cyan-950 hover:text-white"
                >
                  Go to Login
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </HelmetProvider>
  );
};

export default ForgotPassword;
