import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import StockGraph from "../components/StockGraph";
import News from "../components/News";
import "../css/Stock.css";

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
                const response = await fetch(`http://127.0.0.1:5000/stock-name/${stockSymbol}`);
                if (!response.ok) {
                    throw new Error(`Server responded with status ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                setStockDetails(data); // Set stock details with summary
                console.log(data);
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
            alert("User ID is required to manage stocks.");
            return;
        }

        try {
            const url = isSaved 
                ? "http://127.0.0.1:5000/remove-stock" 
                : "http://127.0.0.1:5000/save-stock";

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid,
                    symbol: stockSymbol,
                    name: stockDetails?.stockName || "Unknown Stock",
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${isSaved ? "remove" : "save"} stock.`);
            }

            setIsSaved(!isSaved);
        } catch (error) {
            console.error("Error managing stock:", error);
            alert(`Failed to ${isSaved ? "remove" : "save"} the stock. Please try again.`);
        }
    };

    return (
        <div className="stock-container">
            {/* Graph and Save Button */}
            <div className="graph-container">
                <img 
                    src={imagePath} 
                    alt={`${stockSymbol} logo`} 
                    className="company-logo" 
                />
                <button 
                    className={`save-button ${isSaved ? "saved" : ""}`}
                    onClick={handleSaveStock}
                    title={isSaved ? "Remove from Portfolio" : "Save to Portfolio"}
                >
                    <i className={`fa-solid fa-heart ${isSaved ? "heart-saved" : ""}`}></i>
                </button>
                <StockGraph stockSymbol={stockSymbol} />
                {/* Display the stock summary below the graph */}
                {!isLoading && stockDetails?.summary && (
                    <p className="stock-summary">{stockDetails.summary}</p>
                )}
            </div>

            {/* News Section */}
            <News companyName={stockSymbol} />
        </div>
    );
};

export default Stock;
