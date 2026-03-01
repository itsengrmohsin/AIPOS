// |===============================| Import React and Components |===============================|
import React from "react";
import BackButton from "../../components/Button/BackButton";

// |===============================| ProductBanner Component |===============================|
const ProductBanner = ({ title, description }) => {
  return (
    <div className="w-full sm:px-10 ">
      
      {/* |===============================| Back Button Section |===============================| */}
      <div className="flex items-center mb-6">
        <BackButton />
      </div>

      {/* |===============================| Heading and Description Section |===============================| */}
      <div className="text-center ">
        <h1 className="text-5xl sm:text-5xl font-extrabold text-white drop-shadow-md">
          {title}
        </h1>
        <p className="mt-3 text-lg text-white/90">{description}</p>
        <div className="mt-4 mx-auto h-[2px] w-36 bg-white/90 rounded-full"></div>
      </div>
    </div>
  );
};

// |===============================| Export ProductBanner |===============================|
export default ProductBanner;
