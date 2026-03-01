// |===============================| Import React, Routing, and Icons |===============================|
import React from "react";
import { motion } from "framer-motion";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Link } from "react-router-dom";
import logo from "../../assets/common-images/logo.webp";

// |===============================| Animation Variants |===============================|
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// |===============================| Footer Component |===============================|
const Footer = () => {
  return (
    <motion.footer
      className="relative bg-black/40 backdrop-blur-2xl border-t border-white/20 overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative z-50">
          {/* |===============================| Main Footer Grid |===============================| */}
          <motion.div
            className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-12"
            variants={staggerContainer}
          >
            {/* |===============================| Left Section: Logo + Heading + Description |===============================| */}
            <motion.div className="lg:w-1/3 space-y-6" variants={fadeInUp}>
              <div className="flex items-center space-x-2">
                <a
                  href="/"
                  className="flex items-center space-x-2 hover:rotate-180 transition-transform duration-300"
                >
                  <div className="p-2 rounded-4xl backdrop-blur-md bg-white/10 border border-white/10 shadow-md transition hover:bg-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                    <img
                      src={logo}
                      alt="logo"
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                </a>
                <span className="text-2xl font-bold text-white">
                  Zubi Electronics
                </span>
              </div>
              <p className="text-white/90 leading-relaxed">
                Your trusted partner for premium electronics with flexible
                payment solutions. Making technology accessible for everyone.
              </p>
            </motion.div>

            {/* |===============================| Right Section: Quick Links + Support + Follow Us |===============================| */}
            <motion.div
              className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={staggerContainer}
            >
              {/* |===============================| Quick Links |===============================| */}
              <motion.div variants={fadeInUp}>
                <h3 className="text-white font-semibold text-lg mb-6">
                  Quick Links
                </h3>
                <ul className="space-y-3">
                  {["Home", "Products", "Services", "About", "Contact"].map(
                    (link) => {
                      const path =
                        link === "Home"
                          ? "/"
                          : `/${link.toLowerCase().replace(/\s+/g, "")}`;
                      return (
                        <li key={link}>
                          <Link
                            to={path}
                            className="text-white/90 hover:text-white transition-colors duration-300"
                          >
                            {link}
                          </Link>
                        </li>
                      );
                    }
                  )}
                </ul>
              </motion.div>

              {/* |===============================| Support Links |===============================| */}
              <motion.div variants={fadeInUp}>
                <h3 className="text-white font-semibold text-lg mb-6">
                  Support
                </h3>
                <ul className="space-y-3">
                  {[
                    { label: "FAQ", path: "faq" },
                    { label: "Return Policy", path: "return-policy" },
                    { label: "Privacy Policy", path: "privacy-policy" },
                    { label: "Installment Plans", path: "installment-plans" },
                    { label: "Customer Services", path: "customer-services" },
                  ].map(({ label, path }) => (
                    <li key={label}>
                      <Link
                        to={`/pages/policies/${path}`}
                        className="text-white/90 hover:text-white transition-colors duration-300"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* |===============================| Follow Us Section |===============================| */}
              <motion.div variants={fadeInUp}>
                <h3 className="text-white font-semibold text-lg mb-6">
                  Follow Us
                </h3>
                <div className="flex flex-col gap-2 w-max">
                  <a
                    href=""
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 flex items-center gap-2 bg-white/10 rounded-lg text-white/90 transition-colors duration-300 hover:text-white "
                  >
                    <FacebookIcon className="w-5 h-5" />
                    <span className="text-white/90 text-sm">Facebook</span>
                  </a>

                  <a
                    href=""
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 flex items-center gap-2 bg-white/10 rounded-lg text-white/90 transition-colors duration-300 hover:text-white "
                  >
                    <InstagramIcon className="w-5 h-5" />
                    <span className="text-white/90 text-sm">Instagram</span>
                  </a>

                  <a
                    href="https://wa.me/+923001358167"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 flex items-center gap-2 bg-white/10 rounded-lg text-white/90 transition-colors duration-300 hover:text-white "
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                    <span className="text-white/90 text-sm">WhatsApp</span>
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* |===============================| Bottom Bar / Copyright |===============================| */}
          <motion.div
            className="mt-7 pt-8 border-t border-white/20"
            variants={fadeInUp}
          >
            <div className="flex flex-col items-center justify-center space-y-4 md:space-y-0">
              <p className="text-white/90 text-center text-[14px]">
                © {new Date().getFullYear()}{" "}
                <span>
                  <a
                    href="/"
                    className="font-bold text-white/90 hover:text-white"
                  >
                    Zubi Electronics. &nbsp;
                  </a>
                </span>
                <span className="block md:inline">All rights reserved.</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  );
};

// |===============================| Export Footer |===============================|
export default Footer;
