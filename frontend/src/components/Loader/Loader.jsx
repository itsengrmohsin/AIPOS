// |===============================| Imports |===============================|
import loaderLogo from "../../assets/common-images/logo.webp";

// |===============================| Loader Component |===============================|
const Loader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-cyan-800/30">
      <div className="text-center">

        {/* Glowing Logo Container */}
        <div className="relative flex items-center justify-center mb-6">

          {/* Glowing Circular Background */}
          <div className="absolute w-36 h-36 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 
                          rounded-full blur-xl opacity-50 animate-pulse">
          </div>

          {/* Logo */}
          <div className="relative w-28 h-28 bg-white/10 backdrop-blur-lg border border-white/20 
                          rounded-full flex items-center justify-center">
            <img
              src={loaderLogo}
              alt="Zubi Electronics Logo"
              className="animate-[spin_0.5s_linear_infinite] w-24 h-24 object-contain"
            />
          </div>

        </div>

      </div>
    </div>
  );
};

// |===============================| Export |===============================|
export default Loader;
