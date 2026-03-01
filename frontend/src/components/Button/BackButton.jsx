// |===============================| Import React and Icons |===============================|
import React from "react";
import { ArrowLeft } from "lucide-react";

// |===============================| BackButton Component |===============================|
const BackButton = () => {
  // |===============================| Handle Back Navigation |===============================|
  return (
    <button
      onClick={() => window.history.back()}
      className="flex items-center gap-2 text-white/90 backdrop-blur-md bg-cyan-950/70 border border-white/10 hover:bg-cyan-950 hover:text-white hover:cursor-pointer rounded-full px-4 py-2 transition-all duration-200"
    >
      {/* |===============================| Arrow Icon + Label |===============================| */}
      <ArrowLeft size={18} /> Back
    </button>
  );
};

// |===============================| Export BackButton |===============================|
export default BackButton;
