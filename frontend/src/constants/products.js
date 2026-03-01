
// Material UI icons
import LaptopIcon from "@mui/icons-material/Laptop";
import HomeIcon from "@mui/icons-material/Home";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import ElectricBikeIcon from "@mui/icons-material/ElectricBike";
import DevicesOtherIcon from "@mui/icons-material/DevicesOther";

const categories = [
  {
    title: "Mobiles & Laptops",
    description: "Latest smartphones, tablets, and laptops for work and play.",
    icon: LaptopIcon,
    gradient: "from-blue-500 to-purple-500",
  },
  {
    title: "Home Appliances",
    description:
      "Washing machines, ovens, blenders, juicers, and more for your home.",
    icon: HomeIcon,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    title: "Power & Batteries",
    description: "Solar panels, UPS, batteries, and generators for backup.",
    icon: SolarPowerIcon,
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    title: "Cooling & Air",
    description: "Air conditioners and all kinds of pedestal, wall & ceiling fans.",
    icon: AcUnitIcon,
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    title: "Bikes & E-Scooters",
    description: "Electric bikes and scooties for modern, eco-friendly travel.",
    icon: ElectricBikeIcon,
    gradient: "from-pink-500 to-rose-500",
  },
  {
    title: "Others & Accessories",
    description: "All other premium electronics and accessories.",
    icon: DevicesOtherIcon,
    gradient: "from-gray-400 to-gray-600",
  },
];

export default categories;
