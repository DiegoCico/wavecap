import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
} from "chart.js";
import "../css/StockGraph.css";

// Register required components
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip);

function StockGraph({ stockSymbol }) {
  const [chartData, setChartData] = useState(null);
  const [interval, setInterval] = useState("days"); // Default interval
  const [error, setError] = useState("");
  const [hoverIndex, setHoverIndex] = useState(null); // Index of the hovered element

  // Fetch stock data when interval or stockSymbol changes
  useEffect(() => {
    if (stockSymbol && interval) {
      fetchChartData();
    }
  }, [interval, stockSymbol]);

  const fetchChartData = async () => {
    try {
      setError(""); // Clear previous errors
      const response = await fetch(
        `http://127.0.0.1:5000/stock-graph/${stockSymbol}/${interval}`
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();

      // Calculate price change percentage
      const priceChangePercentage =
        ((data.data[data.data.length - 1] - data.data[0]) / data.data[0]) * 100;

      // Dynamically set the line color
      const lineColor =
        priceChangePercentage >= 0
          ? "rgba(0, 255, 0, 1)" // Green for positive change
          : "rgba(255, 0, 0, 1)"; // Red for negative change

      setChartData({
        labels: data.labels,
        datasets: [
          {
            label: stockSymbol,
            data: data.data,
            borderColor: lineColor,
            tension: 0.1, // Smooth line
          },
        ],
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
          color: "white", // Make x-axis title white
        },
        ticks: {
          color: "white", // Make x-axis labels white
        },
        grid: {
          drawOnChartArea: true,
          color: (context) =>
            hoverIndex !== null && context.tick.index === hoverIndex
              ? "rgba(255, 255, 255, 0.5)" // Highlighted line
              : "rgba(0, 0, 0, 0.1)", // Default grid line color
        },
      },
      y: {
        title: {
          display: true,
          text: "Price ($)",
          color: "white", // Make y-axis title white
        },
        ticks: {
          color: "white", // Make y-axis labels white
        },
        grid: {
          display: false, // Remove y-axis grid lines
        },
      },
    },
    layout: {
      padding: 20,
    },
    onHover: (event, chartElement) => {
      if (chartElement.length > 0) {
        setHoverIndex(chartElement[0].index); // Set the hover index
      } else {
        setHoverIndex(null); // Clear hover index
      }
    },
  };

  return (
    <div className="stock-graph-container">
      {/* Header */}
      <header className="stock-graph-header">
      </header>

      {/* Interval buttons */}
      <div className="stock-graph-interval-buttons">
        <button
          onClick={() => setInterval("days")}
          className={`stock-graph-button ${
            interval === "days" ? "selected" : ""
          }`}
        >
          1D
        </button>
        <button
          onClick={() => setInterval("months")}
          className={`stock-graph-button ${
            interval === "months" ? "selected" : ""
          }`}
        >
          1M
        </button>
        <button
          onClick={() => setInterval("years")}
          className={`stock-graph-button ${
            interval === "years" ? "selected" : ""
          }`}
        >
          1Y
        </button>
      </div>

      {/* Graph */}
      <div className="stock-graph-wrapper">
        {chartData ? (
          <Line data={chartData} options={options} />
        ) : (
          <p>Loading chart...</p>
        )}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default StockGraph;
