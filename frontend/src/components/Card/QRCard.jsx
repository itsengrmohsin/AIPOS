// |===============================| Import React and Dependencies |===============================|
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import CloseIcon from "@mui/icons-material/Close";
import qr_mobile_app from "../../assets/common-images/qr.webp";

// |===============================| QRCard Component |===============================|
const QRCard = () => {
  // |===============================| State: Open/Close |===============================|
  const [open, setOpen] = useState(false);

  // |===============================| Effect: Auto Open/Close |===============================|
  useEffect(() => {
    // Open after 3 seconds
    const openTimer = setTimeout(() => setOpen(true), 3000);

    // Close 6 seconds after opening
    const closeTimer = setTimeout(() => setOpen(false), 9000); // 3s + 6s = 9s from mount

    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, []);

  // |===============================| Animation Variants |===============================|
  const cardVariants = {
    closed: { opacity: 0, scale: 0.8, x: 50 },
    open: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
  };

  return (
    <div className="fixed top-36 right-0 z-[9999] flex items-start">
      {/* |===============================| Animated QR Card |===============================| */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="relative backdrop-blur-lg bg-white/10 border border-white/20 shadow-xl rounded-lg overflow-hidden flex flex-col p-2 w-[130px]"
            initial="closed"
            animate="open"
            exit="closed"
            variants={cardVariants}
          >
            {/* |===============================| Close Button |===============================| */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-1 right-1 p-2 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white/90 hover:text-white rounded-full w-5 h-5 shadow-lg transition duration-300 cursor-pointer"
            >
              <CloseIcon fontSize="small" className="p-[3px]" />
            </button>

            {/* |===============================| QR Image + Text |===============================| */}
            <div className="flex flex-col gap-1 justify-center items-center mt-2">
              <img
                src={qr_mobile_app}
                alt="Get Z APP for your phone"
                width="80"
                height="80"
                className="rounded-lg"
              />
              <p className="text-white/90 text-[12px] text-center leading-tight">
                Get
                <br />
                Zubi Electronics
                <br />
                App
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* |===============================| Phone Toggle Button (when closed) |===============================| */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-3 bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg rounded-l-2xl hover:bg-white/20 transition cursor-pointer"
        >
          <PhoneIphoneIcon className="text-white/90 transition-transform duration-500" />
        </button>
      )}
    </div>
  );
};

// |===============================| Export QRCard |===============================|
export default QRCard;
