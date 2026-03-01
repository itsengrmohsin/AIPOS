// |===============================| Imports |===============================|
import React from "react";
import { motion } from "framer-motion";
import categories from "../../constants/products";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";

// |===============================| Animation Variants |===============================|
const fadeInUp = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};
const cardVariant = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

// |===============================| Products Component |===============================|
const Products = () => {
  return (
    <>
      <motion.section
        id="products"
        className="relative py-30 overflow-hidden "
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="relative z-10">
            {/* |===============================| Section Title |===============================| */}
            <div className="text-center mb-16">
              <motion.h2
                variants={fadeInUp}
                className="text-4xl md:text-5xl font-bold text-white mb-6"
              >
                Products
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-xl text-white/90 max-w-3xl mx-auto"
              >
                Explore our wide range of premium electronics, all available
                with flexible payment options.
              </motion.p>
            </div>

            {/* |===============================| Products Grid |===============================| */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
            >
              {categories.map((category, index) => {
                const Icon = category.icon;
                const slug = category.title.toLowerCase().replace(/\s+/g, "-");

                return (
                  <Link
                    to={`/pages/products/${slug}`}
                    key={index}
                    className="group relative overflow-hidden bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 hover:scale-105 cursor-pointer block"
                    variants={cardVariant}
                    whileHover={{ y: -2 }}
                  >
                    {/* |===============================| Gradient Background Hover |===============================| */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${category.gradient} opacity-10`}
                      ></div>
                    </div>

                    {/* |===============================| Card Content |===============================| */}
                    <div className="relative z-10">
                      <div
                        className={`inline-flex p-2 rounded-xl bg-gradient-to-r ${category.gradient} mb-6 text-white`}
                      >
                        <Icon className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-2">
                        {category.title}
                      </h3>
                      <p className="text-white/90 text-lg">
                        {category.description}
                      </p>
                    </div>

                    {/* |===============================| Explore CTA |===============================| */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowForwardIcon className="w-7 h-7 text-white" />
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          </div>
        </div>
      </motion.section>
    </>
  );
};

// |===============================| Export Component |===============================|
export default Products;
