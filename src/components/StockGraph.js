import React, { useState } from "react";
import "../css/StockGraph.css"; 

function StockGraph({ stockSymbol }) {
  const [graphUrl, setGraphUrl] = useState("");
  const [interval, setInterval] = useState("days"); // Default interval is 'days'

  const fetchGraph = () => {
    if (!stockSymbol) {
      alert("Please enter a stock symbol.");
      return;
    }
    const url = `http://127.0.0.1:5000/stock-graph/${stockSymbol}/${interval}`;
    setGraphUrl(url);
  };

  return (
    <div className="stock-graph-container">
      <h1 className="stock-graph-title">Stock Graph Viewer</h1>
      <div className="stock-graph-wrapper">
        {graphUrl && (
          <img
            src={graphUrl}
            alt={`${stockSymbol} Stock Graph`}
            className="stock-graph-image"
          />
        )}
        <div className="stock-graph-buttons">
          {["minutes", "days", "months", "years"].map((int) => (
            <button
              key={int}
              onClick={() => setInterval(int)}
              className={`stock-graph-button ${
                interval === int ? "active" : ""
              }`}
            >
              {int.charAt(0).toUpperCase() + int.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <button onClick={fetchGraph} className="fetch-graph-button">
        Fetch Graph
      </button>
    </div>
  );
}

export default StockGraph;
