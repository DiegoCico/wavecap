import React, { useState } from "react";
import StockGraph from "../components/StockGraph"; // Import the StockGraph component

function Temp() {
  const [stockSymbol, setStockSymbol] = useState("AAPL"); // Default stock symbol

  return (
    <div className="temp-container">
      <h1 className="temp-title">Interactive Stock Viewer</h1>
      <div className="stock-input-container">
        <input
          type="text"
          placeholder="Enter stock symbol (e.g., AAPL)"
          value={stockSymbol}
          onChange={(e) => setStockSymbol(e.target.value)}
          className="stock-input"
        />
      </div>
      <StockGraph stockSymbol={stockSymbol} />
    </div>
  );
}

export default Temp;
