import React from "react";

const LoadingSpinner = ({ size = "md", message = "Loading..." }) => {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-12 h-12 border-4",
    lg: "w-16 h-16 border-4",
    xl: "w-24 h-24 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        className={`${sizeClasses[size]} border-cyan-500 border-t-transparent rounded-full animate-spin`}
      ></div>
      {message && (
        <p className="mt-4 text-white text-lg font-medium">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
