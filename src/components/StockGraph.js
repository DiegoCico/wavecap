import React, { useState, useEffect, useRef } from "react";
import { Line, Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  TimeScale,
} from "chart.js";
import {
  CandlestickElement,
  CandlestickController,
} from "chartjs-chart-financial"; // Import candlestick chart components
import { registerables } from "chart.js"; // Registerables include all chart components
import "chartjs-adapter-date-fns"; // Import the date adapter
import "../css/StockGraph.css";

// Register necessary components
ChartJS.register(
  ...registerables, // Register all chart components including TimeScale
  CandlestickElement,
  CandlestickController
);

function StockGraph({ stockSymbol }) {
  const [chartData, setChartData] = useState(null);
  const [interval, setInterval] = useState("days"); // Default interval
  const [chartType, setChartType] = useState("line"); // Default chart type
  const [error, setError] = useState("");

  // Create a ref to store the chart instance and clean up
  const chartRef = useRef(null);

  // Fetch stock data when interval or stockSymbol changes
  useEffect(() => {
    if (stockSymbol && interval) {
      fetchChartData();
    }
  }, [interval, stockSymbol]);

  useEffect(() => {
    // Destroy the old chart before rendering a new one when switching types
    const chartInstance = chartRef.current?.chartInstance;
    if (chartInstance) {
      chartInstance.destroy();
    }
  }, [chartType]);

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

      // Clean data and ensure valid numeric values
      const cleanedData = data.candleData.map((candle) => ({
        x: new Date(candle.x).getTime(), // Convert date to timestamp
        o: candle.o,
        h: candle.h,
        l: candle.l,
        c: candle.c,
      }));

      // Calculate price change percentage for line chart
      const priceChangePercentage =
        ((data.data[data.data.length - 1] - data.data[0]) /
          data.data[0]) *
        100;

      const lineColor =
        priceChangePercentage >= 0
          ? "rgba(0, 255, 0, 1)"
          : "rgba(255, 0, 0, 1)";

      const lineChartData = {
        labels: data.labels,
        datasets: [
          {
            label: stockSymbol,
            data: data.data,
            borderColor: lineColor,
            tension: 0.1,
          },
        ],
      };

      const candleChartData = {
        labels: data.labels,
        datasets: [
          {
            label: stockSymbol,
            data: cleanedData, // Now using cleaned OHLC data
            borderColor: lineColor,
          },
        ],
      };

      setChartData(chartType === "line" ? lineChartData : candleChartData);
    } catch (err) {
      setError("Error fetching data");
    }
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
      },
      legend: {
        display: false, // Hide the legend
      },
    },
    scales: {
      x: {
        type: "time", // Set the x scale to time
        title: {
          display: true,
          text: "Date",
          color: "white",
        },
        ticks: {
          color: "white",
        },
        grid: {
          drawOnChartArea: true,
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Price ($)",
          color: "white",
        },
        ticks: {
          color: "white",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="stock-graph-container">
      {/* Header */}
      <header className="stock-graph-header">
        <h1>Stock Graph: {stockSymbol}</h1>
        {error && <p>{error}</p>}
        <div className="stock-graph-interval-type-buttons">
          {/* Interval Buttons */}
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

          {/* Chart Type Buttons */}
          <div className="stock-graph-type-buttons">
            <div
              className="stock-graph-type-switch"
              onClick={() => setChartType(chartType === "line" ? "candle" : "line")}
            >
              {/* Line icon - only visible when chartType is "line" */}
              {chartType === "line" && (
                <i className="fa-solid fa-arrow-trend-up selected"></i>
              )}
              {/* Candle icon - only visible when chartType is "candle" */}
              {chartType === "candle" && (
                <i className="fa-solid fa-grip-lines-vertical selected"></i>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Graph */}
      <div className="stock-graph-wrapper">
        {chartData ? (
          chartType === "line" ? (
            <Line ref={chartRef} data={chartData} options={options} />
          ) : (
            <Chart ref={chartRef} type="candlestick" data={chartData} options={options} />
          )
        ) : (
          <p>Loading chart...</p>
        )}
      </div>
    </div>
  );
}

export default StockGraph;
