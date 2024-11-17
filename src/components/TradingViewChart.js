import React, { useEffect, useRef } from 'react'

export default function TradingViewChart({ ticker }) {
    const containerRef = useRef(null);

    useEffect(() => {
        // Clear the previous chart if it exists
        containerRef.current.innerHTML = "";

        // Load the TradingView widget
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;
        script.onload = () => {
            if (window.TradingView) {
                new window.TradingView.widget({
                    symbol: ticker, // Pass the stock ticker (e.g., AAPL)
                    container_id: "tradingview_chart", // Matches the container ID
                    width: "100%",
                    height: 500, // Customize chart height
                    theme: "dark",
                    style: "1", // Candlestick style
                    locale: "en",
                    toolbar_bg: "#323232",
                    enable_publishing: false,
                    allow_symbol_change: true,
                });
            }
        };

        containerRef.current.appendChild(script);
    }, [ticker])
    
    return (
        <div
            id="tradingview_chart"
            ref={containerRef}
            style={{
                width: "100%",
                height: "500px",
                border: "1px solid #323232",
                borderRadius: "10px",
                overflow: "hidden",
            }}
        ></div>
    )
}