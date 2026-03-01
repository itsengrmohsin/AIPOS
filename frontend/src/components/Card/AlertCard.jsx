// |===============================| Import React and Components |===============================|
import React from "react";
import BackButton from "../../components/Button/BackButton"; // import your BackButton

// |===============================| AlertCard Component |===============================|
const AlertCard = ({ icon, title, message, onBackClick }) => {
  return (
    <div
      className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-7"
    >
      {/* |===============================| Card Container |===============================| */}
      <div className="flex flex-col items-center justify-center w-full max-w-md p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg text-center h-auto">
        
        {/* |===============================| Icon Section |===============================| */}
        {icon}

        {/* |===============================| Title Section |===============================| */}
        <h1 className="text-3xl font-extrabold text-white mb-4 tracking-widest">
          {title}
        </h1>

        {/* |===============================| Message Section |===============================| */}
        <p className="text-white/90 text-md mb-6 text-center">{message}</p>

        {/* |===============================| Actions Section (Back Button) |===============================| */}
        <div className="flex flex-wrap justify-center gap-4">
          {onBackClick && <BackButton />}
        </div>
      </div>
    </div>
  );
};

// |===============================| Export AlertCard |===============================|
export default AlertCard;
