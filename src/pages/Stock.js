import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import StockGraph from "../components/StockGraph";
import News from "../components/News";
import "../css/Stock.css"; // Assuming the CSS is saved in Stock.css

const Stock = ({ stockSymbol }) => {
    const { uid } = useParams(); // Extract uid from the URL
    const [stockDetails, setStockDetails] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);

    const imagePath = `${process.env.PUBLIC_URL}/ticker_icons/${stockSymbol}.png`;

    // Check if the stock is saved whenever the stockSymbol changes
    useEffect(() => {
        const checkIfSaved = async () => {
            if (!uid) return;

            try {
                const response = await fetch(
                    `http://127.0.0.1:5000/is-saved`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            uid,
                            symbol: stockSymbol,
                        }),
                    }
                );

                if (!response.ok) {
                    throw new Error(`Error checking saved status: ${response.statusText}`);
                }

                const data = await response.json();
                setIsSaved(data.isSaved); // Backend should return { isSaved: true/false }
            } catch (err) {
                console.error("Error fetching saved status:", err);
                setIsSaved(false); // Assume not saved if an error occurs
            }
        };

        checkIfSaved();
    }, [stockSymbol, uid]);

    // Fetch stock details
    useEffect(() => {
        const fetchStockDetails = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://127.0.0.1:5000/stock-name/${stockSymbol}`);
                if (!response.ok) {
                    throw new Error(`Server responded with status ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                setStockDetails(data);
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
            

            {/* Stock Details */}
            <div className="stock-details">
                {isLoading ? (
                    <p>Loading stock details...</p>
                ) : error ? (
                    <p style={{ color: "red" }}>{error}</p>
                ) : stockDetails ? (
                    <table className="metrics-table">
                        <tbody>
                            {/* Centered First Row */}
                            <tr>
                                <th colSpan="5" style={{ textAlign: "center" }}>Symbol</th>
                                <td colSpan="5" style={{ textAlign: "center" }}>{stockSymbol}</td>
                            </tr>
                            {/* Second Row */}
                            <tr>
                                <th>Market Cap</th>
                                <td>{stockDetails.marketCap || "N/A"}</td>
                                <th>Sector</th>
                                <td>{stockDetails.sector || "N/A"}</td>
                                <th>Industry</th>
                                <td>{stockDetails.industry || "N/A"}</td>
                                <th>EPS</th>
                                <td>{stockDetails.eps || "N/A"}</td>
                                <th>Volume</th>
                                <td>{stockDetails.volume || "N/A"}</td>
                            </tr>
                            {/* Third Row */}
                            <tr>
                                <th>Today's High</th>
                                <td>{stockDetails.highToday || "N/A"}</td>
                                <th>Today's Low</th>
                                <td>{stockDetails.lowToday || "N/A"}</td>
                                <th>Dividend Yield</th>
                                <td>{stockDetails.dividendYield || "N/A"}</td>
                                <th>52-Week High</th>
                                <td>{stockDetails.yearHigh || "N/A"}</td>
                                <th>52-Week Low</th>
                                <td>{stockDetails.yearLow || "N/A"}</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <p>No stock details available.</p>
                )}
            </div>
            </div>

            {/* News Section */}
            <News companyName={stockSymbol} />
        </div>
    );
};

export default Stock;
