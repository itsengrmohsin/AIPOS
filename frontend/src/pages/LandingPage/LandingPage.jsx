// |===============================| Imports |===============================|
import { motion } from "framer-motion";
import Hero from "../../components/LandingPage/Hero";
import Services from "../../components/LandingPage/Services";
import Products from "../../components/LandingPage/Products";
import WhyChooseUs from "../../components/LandingPage/WhyChooseUs";
import Contact from "../../components/LandingPage/Contact";
// QR APP Component
import QRCard from "../../components/Card/QRCard";

// |===============================| LandingPage Component |===============================|
const LandingPage = () => {
  return (
    <>
      {/* |===============================| Hero Section |===============================| */}
      <Hero />

      {/* |===============================| Products Section |===============================| */}
      <Products />

      {/* |===============================| Services Section |===============================| */}
      <Services />

      {/* |===============================| Why Choose Us Section |===============================| */}
      <WhyChooseUs />

      {/* |===============================| Contact Section |===============================| */}
      <Contact />

      {/* |===============================| QR Card (Desktop only) |===============================| */}
      <div className="hidden md:block">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <QRCard />
        </motion.div>
      </div>
    </>
  );
};

// |===============================| Export Component |===============================|
export default LandingPage;
