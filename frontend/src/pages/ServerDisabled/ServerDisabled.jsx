// |===============================| Imports |===============================|
import React from "react";
import { ServerCrash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AlertCard from "../../components/Card/AlertCard";

// |===============================| ServerDisabled Component |===============================|
const ServerDisabled = () => {
  // |===============================| Motion Variants |===============================|
  const centerAppear = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key="server-disabled"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={centerAppear}
        >
          {/* |===============================| AlertCard |===============================| */}
          <AlertCard
            icon={
              <ServerCrash className="w-20 h-20 text-yellow-500 mb-6 animate-pulse" />
            }
            title="Server Disabled"
            message="Our servers are temporarily unavailable. Please try again later."
            onBackClick
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// |===============================| Export Component |===============================|
export default ServerDisabled;
