// |===============================| Import React |===============================|
import React from "react";

// |===============================| Badge Component |===============================|
const Badge = ({ label }) => {
  // |===============================| Do not render if no label |===============================|
  if (!label) return null;

  // |===============================| Badge UI |===============================|
  return (
    <span
      className="absolute top-1 right-1 px-3 py-1 text-xs font-semibold rounded-full shadow-md bg-cyan-500 text-white"
    >
      {label}
    </span>
  );
};

// |===============================| Export Badge |===============================|
export default Badge;
