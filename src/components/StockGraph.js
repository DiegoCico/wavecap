import React, { useState, useEffect } from "react";
import { Line, Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
} from "chart.js";
import {
  CandlestickElement,
  CandlestickController,
} from "chartjs-chart-financial"; // Correct imports for candlestick chart
import "../css/StockGraph.css";

// Register required components
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  CandlestickElement,
  CandlestickController
);

function StockGraph({ stockSymbol }) {
  const [chartData, setChartData] = useState(null);
  const [interval, setInterval] = useState("days"); // Default interval
  const [chartType, setChartType] = useState("line"); // Default chart type
  const [error, setError] = useState("");

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

      // Calculate price change percentage for line chart
      const priceChangePercentage =
        ((data.data[data.data.length - 1] - data.data[0]) / data.data[0]) * 100;

      // Dynamically set the line color
      const lineColor =
        priceChangePercentage >= 0
          ? "rgba(0, 255, 0, 1)" // Green for positive change
          : "rgba(255, 0, 0, 1)"; // Red for negative change

      // Prepare data for the line chart
      const lineChartData = {
        labels: data.labels,
        datasets: [
          {
            label: stockSymbol,
            data: data.data,
            borderColor: lineColor,
            tension: 0.1, // Smooth line
          },
        ],
      };

      // Prepare data for the candle chart (OHLC)
      const candleChartData = {
        labels: data.labels,
        datasets: [
          {
            label: stockSymbol,
            data: data.candleData, // This should be OHLC data
            borderColor: lineColor,
          },
        ],
      };

      setChartData(chartType === "line" ? lineChartData : candleChartData);
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
        <h1>{stockSymbol} Stock Chart</h1>
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
            <Line data={chartData} options={options} />
          ) : (
            <canvas
              id="candlestick-chart"
              width="400"
              height="200"
              data={chartData}
              options={options}
            ></canvas>
          )
        ) : (
          <p>Loading chart...</p>
        )}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default StockGraph;
