// |===============================| Imports |===============================|
import React from "react";
import { motion } from "framer-motion";
import services from "../../constants/services";

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

// |===============================| Services Component |===============================|
const Services = () => {
  return (
    <motion.section
      id="services"
      className="relative py-30 overflow-hidden"
      style={{ fontFamily: "Poppins, sans-serif" }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative z-10">

          {/* |===============================| Section Title |===============================| */}
          <div className="text-center mb-16">
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our Services
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-white/90 max-w-3xl mx-auto">
              We provide comprehensive solutions to make electronics shopping convenient and affordable for everyone.
            </motion.p>
          </div>

          {/* |===============================| Services Grid |===============================| */}
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" variants={staggerContainer}>
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                  variants={cardVariant}
                  whileHover={{ y: -2 }}
                >
                  {/* Icon */}
                  <div className={`inline-flex p-2 rounded-xl bg-gradient-to-r ${service.color} mb-6 text-white`}>
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-white mb-4">{service.title}</h3>

                  {/* Description */}
                  <p className="text-white/90 leading-relaxed">{service.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

// |===============================| Export Component |===============================|
export default Services;
