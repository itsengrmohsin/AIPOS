import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const CategoryChart = () => {
  // Get real category data from products
  const getCategoryData = () => {
    try {
      const products = JSON.parse(localStorage.getItem("products")) || [];

      const categoryData = products.reduce((acc, product) => {
        const category = product.category || "Uncategorized";
        const value =
          (parseInt(product.quantity) || 0) * (parseFloat(product.price) || 0);

        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += value;

        return acc;
      }, {});

      // Convert to array format for chart
      const data = Object.entries(categoryData).map(([name, value]) => ({
        name,
        value: Math.round(value),
      }));

      return data.length > 0 ? data : [{ name: "No Data", value: 1 }];
    } catch (error) {
      console.error("Error generating category chart data:", error);
      return [{ name: "No Data", value: 1 }];
    }
  };

  const data = getCategoryData();

  // Match colors with DailySalesChart
  const COLORS = ["#35F3D4", "#E4B944", "#BFE444", "#44BFE4", "#6944E4"];

  // Custom Tooltip with matching color text
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const color = payload[0].payload.color;
      const name = payload[0].name;
      const value = payload[0].value;

      return (
        <div
          className="p-3 rounded-lg shadow-md"
          style={{
            backgroundColor: "#1E293B",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p className="text-sm text-gray-300 mb-1">{name}</p>
          <p className="text-base font-semibold" style={{ color }}>
            Rs {value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  // Add color field to each data point
  const dataWithColors = data.map((d, i) => ({
    ...d,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="rounded-lg p-6 backdrop-blur-md bg-black/50 shadow-md">
      <h3 className="text-xl font-semibold text-white mb-4">
        Inventory by Category
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              outerRadius={90}
              dataKey="value"
            >
              {dataWithColors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                color: "#F3F4F6",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CategoryChart;
