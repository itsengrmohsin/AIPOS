// StatCard Component
const StatCard = ({ icon: Icon, title, value, change, color, description }) => {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${color}`}>
          <Icon className="text-white text-2xl" />
        </div>
        {change && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            change.startsWith('+') 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {change}
          </span>
        )}
      </div>
      
      <h3 className="text-white/80 text-sm font-medium mb-2">{title}</h3>
      <p className="text-2xl font-bold text-white mb-2">{value}</p>
      
      {description && (
        <p className="text-white/60 text-xs">{description}</p>
      )}
    </div>
  );
};