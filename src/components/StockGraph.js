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
  const [stockName, setStockName] = useState("");

  useEffect(() => {
    const fetchStockName = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/stock-name/${stockSymbol}`);
        const data = await response.json();
  
        if (response.ok) {
          setStockName(data.stockName);
        } else {
          console.error("Error fetching stock name:", data.message);
          setStockName("Unknown Stock");
        }
      } catch (err) {
        console.error("Error fetching stock name:", err);
        setStockName("Unknown Stock");
      }
    };
  
    if (stockSymbol) {
      fetchStockName();
    }
  }, [stockSymbol]);
  


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
  
    // Add a small delay when switching to candlestick chart type
    if (chartType === "candle") {
      setTimeout(() => {
        fetchChartData();
      }, 400); // Delay of 200ms
    } else {
      fetchChartData();
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
  
      const cleanedData = data.candleData.map((candle) => ({
        x: new Date(candle.x).getTime(),
        o: candle.o,
        h: candle.h,
        l: candle.l,
        c: candle.c,
      }));
  
      const priceChangePercentage =
        ((data.data[data.data.length - 1] - data.data[0]) / data.data[0]) * 100;
  
      const lineColor =
        priceChangePercentage >= 0
          ? "rgba(0, 128, 0, 1)" // Softer green
          : "rgba(128, 0, 0, 1)"; // Softer red
  
      // Create gradient for the background fill
      const chart = chartRef.current?.ctx;
      let gradient = null;
      if (chart) {
        gradient = chart.createLinearGradient(0, 0, 0, chart.canvas.height);
  
        if (priceChangePercentage >= 0) {
          // Green gradient for positive change
          gradient.addColorStop(0, "rgba(0, 128, 0, 0.4)"); // Softer green, semi-transparent
          gradient.addColorStop(1, "rgba(0, 128, 0, 0)");   // Transparent
        } else {
          // Red gradient for negative change
          gradient.addColorStop(0, "rgba(128, 0, 0, 0.4)"); // Softer red, semi-transparent
          gradient.addColorStop(1, "rgba(128, 0, 0, 0)");   // Transparent
        }
      }
  
      const lineChartData = {
        labels: data.labels,
        datasets: [
          {
            label: stockSymbol,
            data: data.data,
            borderColor: lineColor,
            backgroundColor: gradient, // Apply gradient fill
            tension: 0.1,
            fill: true, // Enable area under the line
          },
        ],
      };
  
      const candleChartData = {
        labels: data.labels,
        datasets: [
          {
            label: stockSymbol,
            data: cleanedData,
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
        enabled: true,
        mode: "nearest",
        intersect: false,
        callbacks: {
          label: (tooltipItem) => {
            if (chartType === "candle") {
              const { o, h, l, c } = tooltipItem.raw; // Extract OHLC values
              return [
                `Open: ${o}`,
                `High: ${h}`,
                `Low: ${l}`,
                `Close: ${c}`,
              ]; // Display OHLC values
            }
            return `Price: ${tooltipItem.raw}`; // Default for line chart
          },
        },
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
          display: false, // Completely remove grid lines on the X-axis
          drawOnChartArea: false, // Prevent drawing grid lines on the chart
          drawBorder: false, // Remove the border line on the X-axis
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
          display: false, // Remove grid lines on the Y-axis
          drawOnChartArea: false,
          drawBorder: false,
        },
      },
    },
  };
  
  
  

  return (
    <div className="stock-graph-container">
      {/* Header */}
      <header className="stock-graph-header">
      <h1>{`${stockName} (${stockSymbol})`}</h1>
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
