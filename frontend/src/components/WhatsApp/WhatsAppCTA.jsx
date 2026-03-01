// |===============================| Imports |===============================|
import React from "react";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

// |===============================| WhatsAppCTA Component |===============================|
const WhatsAppCTA = () => {
  return (
    // |===============================| CTA Button Link |===============================|
    <a
      href="https://wa.me/+923001358167"
      target="_blank"
      rel="noopener noreferrer"
      title="Chat with us on WhatsApp"
      className="hidden md:flex items-center justify-center fixed bottom-5 right-5 w-max h-max p-2
                 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full shadow-lg 
                 text-white hover:bg-white/20 hover:shadow-2xl transition-all duration-300 z-50 cursor-pointer"
    >
      {/* |===============================| WhatsApp Icon |===============================| */}
      <WhatsAppIcon sx={{ width: 25, height: 25 }} />

      {/* |===============================| CTA Text |===============================| */}
      <span className="mx-1 text-sm">WhatsApp</span>
    </a>
  );
};

// |===============================| Export Component |===============================|
export default WhatsAppCTA;
