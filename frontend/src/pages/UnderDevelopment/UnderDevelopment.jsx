// |===============================| Imports |===============================|
import React from "react";
import { Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AlertCard from "../../components/Card/AlertCard";

// |===============================| UnderDevelopment Component |===============================|
const UnderDevelopment = () => {
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
          key="under-development"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={centerAppear}
        >
          {/* |===============================| AlertCard |===============================| */}
          <AlertCard
            icon={
              <Wrench className="w-20 h-20 text-yellow-400 mb-6 animate-pulse" />
            }
            title="Under Development"
            message="This page is still under construction. Check back soon!"
            onBackClick
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// |===============================| Export Component |===============================|
export default UnderDevelopment;
