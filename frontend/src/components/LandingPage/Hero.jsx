// |===============================| Import React, MUI Icons, Framer Motion |===============================|
import React from "react";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import StarIcon from "@mui/icons-material/Star";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import { motion } from "framer-motion";

// |===============================| Hero Component |===============================|
const Hero = () => {
  // |===============================| Scroll Down Function |===============================|
  const scrollDown = () => {
    const servicesSection = document.getElementById("products");
    if (servicesSection) servicesSection.scrollIntoView({ behavior: "smooth" });
  };

  // |===============================| Animation Variants |===============================|
  const fadeInUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } } };
  const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.2 } } };
  const floating = { animate: { y: [0, -15, 0], scale: [1, 1.05, 1], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } } };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="relative h-[100vh] flex items-center justify-center overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8  text-center flex flex-col items-center justify-center pt-5 sm:pt-0">
        
        {/* |===============================| Hero Title & Description |===============================| */}
        <div className="space-y-8">
          <div className="space-y-4">
            <motion.h2 variants={fadeInUp} className="text-white/80 font-medium tracking-wide text-base sm:text-xl md:text-2xl">
              Your Trusted Partner
            </motion.h2>
            <motion.h1 variants={fadeInUp} className="font-extrabold tracking-tight text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white">
              ZUBI ELECTRONICS
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-white/90 text-sm sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Explore the latest gadgets and premium electronics. <br />
              Buy instantly or pay later with our flexible installment plans — designed to make technology accessible for everyone.
            </motion.p>
          </div>

          {/* |===============================| Feature Pills |===============================| */}
          <motion.div
            className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              { icon: ShoppingCartIcon, text: "Seamless Shopping", color: "text-blue-700" },
              { icon: CreditCardIcon, text: "Flexible Payments", color: "text-red-600" },
              { icon: StarIcon, text: "Top Quality", color: "text-yellow-400" },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 40, scale: 0.9 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 12 } },
                  }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-full px-2.5 py-1 sm:px-4 sm:py-1.5 flex items-center space-x-2 cursor-pointer hover:border-white/50 hover:shadow-lg transition"
                >
                  <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${feature.color}`} />
                  <span className="text-white font-medium text-xs sm:text-sm">{feature.text}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* |===============================| Scroll Down Button |===============================| */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
      >
        <motion.button
          onClick={scrollDown}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
          whileTap={{ scale: 0.9 }}
          className="cursor-pointer flex flex-col items-center justify-center w-8 h-8 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full hover:bg-white/20 transition duration-300"
        >
          <KeyboardDoubleArrowDownIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </motion.button>
      </motion.div>
    </motion.section>
  );
};

// |===============================| Export Hero Component |===============================|
export default Hero;
