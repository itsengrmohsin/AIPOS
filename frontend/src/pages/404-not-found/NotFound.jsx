// |===============================| Imports |===============================|
import React from "react";
import { XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AlertCard from "../../components/Card/AlertCard";

// |===============================| NotFound Component |===============================|
const NotFound = () => {
  // |===============================| Animation Variants |===============================|
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
    // |===============================| Container |===============================|
    <div className="min-h-screen flex items-center justify-center">
      <AnimatePresence mode="wait">
        {/* |===============================| Motion Wrapper |===============================| */}
        <motion.div
          key="not-found"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={centerAppear}
        >
          {/* |===============================| Alert Card |===============================| */}
          <AlertCard
            icon={
              <XCircle className="w-20 h-20 text-red-500 mb-6 animate-pulse" />
            }
            title="404 Error"
            message="Oops! The page you are looking for doesn’t exist."
            onBackClick
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// |===============================| Export Component |===============================|
export default NotFound;
