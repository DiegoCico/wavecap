import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import StockGraph from "../components/StockGraph";
import News from "../components/News";

const Stock = ({ stockSymbol }) => {
    const { uid } = useParams(); // Extract uid from the URL
    const [stockDetails, setStockDetails] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);

    const imagePath = `${process.env.PUBLIC_URL}/ticker_icons/${stockSymbol}.png`;

    useEffect(() => {
        const fetchStockDetails = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/stock-name/${stockSymbol}`);
                if (!response.ok) {
                    throw new Error(`Server responded with status ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                setStockDetails(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStockDetails();
    }, [stockSymbol]);

    const handleSaveStock = async () => {
        if (!uid) {
            alert("User ID is required to save stocks.");
            return;
        }

        try {
            const response = await fetch("/save-stock", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid, // Pass the UID to the backend
                    symbol: stockSymbol,
                    name: stockDetails?.stockName || "Unknown Stock",
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save stock.");
            }

            setIsSaved(true);
            alert(`${stockSymbol} saved successfully to your portfolio.`);
        } catch (error) {
            console.error("Error saving stock:", error);
            alert("Failed to save the stock. Please try again.");
        }
    };

    return (
        <div className="graph-container" style={{ position: "relative", padding: "20px" }}>
            <img 
                src={imagePath} 
                alt={`${stockSymbol} logo`} 
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "50px",
                    height: "50px",
                    margin: "10px",
                }} 
            />
            <button 
                style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "24px",
                    color: isSaved ? "red" : "black",
                }}
                onClick={handleSaveStock}
                title="Save to Portfolio"
            >
                <i className="fa-regular fa-heart"></i>
            </button>
            <StockGraph stockSymbol={stockSymbol} />
            <div className="stock-details" style={{ marginTop: "20px", textAlign: "center" }}>
                {isLoading ? (
                    <p>Loading stock details...</p>
                ) : error ? (
                    <p style={{ color: "red" }}>{error}</p>
                ) : stockDetails ? (
                    <div style={{ background: "#f9f9f9", padding: "10px", borderRadius: "5px" }}>
                        <h3>{stockDetails.stockName || "Unknown Stock"}</h3>
                        <p><strong>Symbol:</strong> {stockSymbol}</p>
                        <p><strong>Market Cap:</strong> {stockDetails.marketCap || "N/A"}</p>
                        <p><strong>Sector:</strong> {stockDetails.sector || "N/A"}</p>
                        <p><strong>Industry:</strong> {stockDetails.industry || "N/A"}</p>
                        <p><strong>EPS:</strong> {stockDetails.eps || "N/A"}</p>
                    </div>
                ) : (
                    <p>No stock details available.</p>
                )}
            </div>

            {/* Use the News Component */}
            <News companyName={stockSymbol} />
        </div>
    );
};

export default Stock;
