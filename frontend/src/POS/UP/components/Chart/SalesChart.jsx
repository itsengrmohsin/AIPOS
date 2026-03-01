import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const SalesChart = () => {
  // Get real sales data from localStorage
  const getSalesData = () => {
    try {
      const salesHistory =
        JSON.parse(localStorage.getItem("salesHistory")) || [];

      // Group by month
      const monthlyData = salesHistory.reduce((acc, sale) => {
        const date = new Date(sale.timestamp || sale.savedOn);
        const monthYear = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });

        if (!acc[monthYear]) {
          acc[monthYear] = { month: monthYear, sales: 0, installments: 0 };
        }

        const amount = parseFloat(sale.finalTotal) || 0;
        if (
          sale.type === "installment-sale" ||
          sale.invoiceId?.startsWith("INST-")
        ) {
          acc[monthYear].installments += amount;
        } else {
          acc[monthYear].sales += amount;
        }

        return acc;
      }, {});

      // Convert to array and get last 6 months
      const data = Object.values(monthlyData)
        .sort((a, b) => new Date(a.month) - new Date(b.month))
        .slice(-6);

      return data.length > 0
        ? data
        : [
            { month: "Jan", sales: 0, installments: 0 },
            { month: "Feb", sales: 0, installments: 0 },
            { month: "Mar", sales: 0, installments: 0 },
            { month: "Apr", sales: 0, installments: 0 },
            { month: "May", sales: 0, installments: 0 },
            { month: "Jun", sales: 0, installments: 0 },
          ];
    } catch (error) {
      console.error("Error generating sales chart data:", error);
      return [
        { month: "Jan", sales: 0, installments: 0 },
        { month: "Feb", sales: 0, installments: 0 },
        { month: "Mar", sales: 0, installments: 0 },
        { month: "Apr", sales: 0, installments: 0 },
        { month: "May", sales: 0, installments: 0 },
        { month: "Jun", sales: 0, installments: 0 },
      ];
    }
  };

  const data = getSalesData();

  // Unified color palette
  const COLORS = {
    sales: "#35F3A1",        // Orange
    installments: "#E2FF29", // Aqua Blue
  };

  // Custom tooltip that uses line colors for text
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="p-3 rounded-lg shadow-md"
          style={{
            backgroundColor: "#1E293B",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p className="text-sm text-gray-300 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p
              key={`tooltip-${index}`}
              className="text-base font-semibold"
              style={{ color: entry.color }}
            >
              {entry.name}: Rs {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom legend with color-coded labels
  const renderColorfulLegendText = (value, entry) => {
    const { color } = entry;
    return <span style={{ color }}>{value}</span>;
  };

  return (
    <div className="rounded-lg p-6 backdrop-blur-md bg-black/50 shadow-md">
      <h3 className="text-xl font-semibold text-white mb-4">
        Sales Overview
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F1" />
            <XAxis
              dataKey="month"
              stroke="#E5E7EB"
              fontSize={12}
            />
            <YAxis
              stroke="#E5E7EB"
              fontSize={12}
              tickFormatter={(value) => `Rs ${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ color: "#F3F4F6" }}
              formatter={renderColorfulLegendText}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke={COLORS.sales}
              strokeWidth={2.5}
              name="Cash Sales"
              dot={{ fill: COLORS.sales }}
            />
            <Line
              type="monotone"
              dataKey="installments"
              stroke={COLORS.installments}
              strokeWidth={2.5}
              name="Installment Sales"
              dot={{ fill: COLORS.installments }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;
