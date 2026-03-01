// |===============================| Import React and Components |===============================|
import React from "react";
import Badge from "../../components/Badge/ProductCardBadge";

// |===============================| ProductCard Component |===============================|
const ProductCard = ({ image, brand, title, description, badge }) => {
  return (
    <div className="max-w-sm w-full h-[350px] flex flex-col justify-between rounded-2xl shadow-xl bg-white/10 backdrop-blur-lg border border-white/20 p-5 transition-transform hover:scale-105 hover:shadow-2xl duration-300">
      {/* |===============================| Product Image Section |===============================| */}
      <div className="relative h-1/2">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover rounded-xl"
        />
        {/* |===============================| Badge Component |===============================| */}
        <Badge label={badge} />
      </div>

      {/* |===============================| Product Details Section |===============================| */}
      <div className="mt-4 space-y-2 h-1/2 flex flex-col justify-between">
        <div>
          <h3 className="text-sm uppercase tracking-wide text-white/90">
            {brand}
          </h3>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-white/90 text-sm leading-snug line-clamp-3">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

// |===============================| Export ProductCard |===============================|
export default ProductCard;
