// |===============================| Imports |===============================|
import React from "react";
import { motion } from "framer-motion";
import features from "../../constants/features";

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
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
};

// |===============================| WhyChooseUs Component |===============================|
const WhyChooseUs = () => {
  return (
    <motion.section
      id="about"
      className="relative py-30 overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative z-10">

          {/* |===============================| Section Header |===============================| */}
          <div className="text-center mb-16">
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose Zubi Electronics?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-white/90 max-w-3xl mx-auto">
              We're not just another electronics store. Here's what makes us different and why customers keep coming back.
            </motion.p>
          </div>

          {/* |===============================| Features Grid |===============================| */}
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16" variants={staggerContainer}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="flex items-start space-x-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300"
                  variants={cardVariant}
                  whileHover={{ y: -2 }}
                >
                  {/* Icon */}
                  <div className="hidden sm:flex flex-shrink-0">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white flex items-center justify-center">
                      <Icon sx={{ width: 30, height: 30 }} />
                    </div>
                  </div>

                  {/* Feature content */}
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-4">{feature.title}</h3>
                    <p className="text-white/90 text-lg leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* |===============================| Stats Section |===============================| */}
          <motion.div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8" variants={staggerContainer}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "10K+", label: "Happy Customers", gradient: "from-blue-400 to-purple-400" },
                { value: "5+", label: "Years Experience", gradient: "from-green-400 to-teal-400" },
                { value: "50+", label: "Brand Partners", gradient: "from-orange-400 to-red-400" },
                { value: "24/7", label: "Customer Support", gradient: "from-pink-400 to-rose-400" },
              ].map((stat, idx) => (
                <motion.div key={idx} variants={cardVariant}>
                  <div className={`text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${stat.gradient} mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-white/90 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
};

// |===============================| Export Component |===============================|
export default WhyChooseUs;
