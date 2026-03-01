// |===============================| Imports |===============================|
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import logo from "../../../assets/common-images/logo.webp";
import BackButton from "../../../components/Button/BackButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import api from "../../../utils/api";

// |===============================| Animation Variants |===============================|
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

const cardVariant = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// |===============================| SignIn Component |===============================|
const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Simulated DB user fetch removed

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;
      if (user.role !== "admin") {
        setError("Access denied. Admin only.");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", "admin"); // Use consistent role naming

      toast.success(`Welcome: ${user.name}`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        theme: "dark",
      });
      navigate("/up");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid CNIC or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>User Portal - Zubi Electronics</title>
        <meta
          name="description"
          content="This is the user portal of Zubi Electronics."
        />
      </Helmet>

      {/* Toast Container (Dark Mode) */}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover={false}
        draggable={false}
        theme="dark" // ✅ Matches the dark UI
      />

      {/* Main Content */}
      <motion.div
        className="min-h-screen flex items-center justify-center relative"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div
          className="max-w-sm w-full mx-4 relative"
          variants={cardVariant}
        >
          <motion.div
            className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl relative"
            variants={fadeInUp}
          >
            <BackButton />

            {/* Header */}
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
                Zubi Electronics
              </motion.h1>
              <motion.p className="text-white text-sm" variants={fadeInUp}>
                Access your dashboard
              </motion.p>
            </motion.div>

            {/* Sign-In Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-2"
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

              {/* Email Input */}
              <motion.div variants={fadeInUp}>
                <label className="block text-white font-medium mb-1 text-sm">
                  Email / CNIC
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/80 focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-transparent text-sm"
                  placeholder="Enter email or CNIC"
                />
              </motion.div>

              {/* Password Input */}
              <motion.div variants={fadeInUp}>
                <label className="block text-white font-medium mb-1 text-sm">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/80 focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-transparent pr-10 text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/90 hover:text-white"
                  >
                    {showPassword ? (
                      <VisibilityOffIcon className="w-4 h-4" />
                    ) : (
                      <VisibilityIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div className="flex justify-center" variants={fadeInUp}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 my-3 bg-cyan-950/70 backdrop-blur-lg border border-white/10 text-white/90 px-8 py-2 rounded-md font-semibold text-sm transition-all duration-200 hover:bg-cyan-950 hover:text-white hover:cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>{loading ? "Signing In..." : "Sign In"}</span>
                </button>
              </motion.div>
            </motion.form>
          </motion.div>
        </motion.div>
      </motion.div>
    </HelmetProvider>
  );
};

export default SignIn;
