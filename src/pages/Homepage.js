import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StockGraph from "../components/StockGraph";
import Dashboard from "./Dashboard";
import "../css/Homepage.css";

const Homepage = () => {
    const [userPortfolio, setUserPortfolio] = useState([]);
    const [inputValue, setInputValue] = useState("")
    const [stockSymbol, setStockSymbol] = useState("")
    const [showGraph, setShowGraph] = useState(false)
    const [suggestions, setSuggestions] = useState([])
    const [showDash, setShowDash] = useState(false)
    const { uid } = useParams()
    const navigate = useNavigate()

    const handleInputChange = (event) => {
        const value = event.target.value.toUpperCase();
        setInputValue(value);

        // Fetch suggestions if input is not empty
        if (value.trim()) {
            fetchSuggestions(value);
        } else {
            setSuggestions([]);
        }
    };

    const fetchSuggestions = async (query) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/autocomplete?query=${query}`);
            if (response.ok) {
                const data = await response.json();
                console.log("Suggestions received:", data.suggestions); // Debugging
                setSuggestions(data.suggestions);
            } else {
                console.error("Failed to fetch stock suggestions");
            }
        } catch (error) {
            console.error("Error fetching stock suggestions:", error);
        }
    };
    
    
    const handleSearch = (event) => {
        if (event.key === "Enter" && inputValue.trim()) {
            setStockSymbol(inputValue.trim());
            setShowGraph(true);
            setSuggestions([]); // Clear suggestions on search
        }
    };

    const handleSuggestionClick = (symbol) => {
        setStockSymbol(symbol);
        setInputValue(symbol);
        setShowGraph(true);
        setSuggestions([]);
    };

    const handleOpenDash = () => {
        setShowDash(true)
        setShowGraph(false)
    }

    return (
        <div className="homepage">
            <div className="home-sidenav">
                <div className="logo-cont">
                    <img
                        className="logo-image"
                        src={`${process.env.PUBLIC_URL}/logo-sidenav.png`}
                        alt="WaveCap Logo"
                    />
                </div>
                <div className="search-cont">
                    <input
                        className="search-box"
                        placeholder="Search Stock"
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleSearch}
                    />
                    {suggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion.symbol)}
                                    className="suggestion-item"
                                >
                                    <span>{suggestion.symbol}</span> - <span>{suggestion.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="custom-line"></div>
                <div className="portfolio-cont">
                    <div className="portfolio-header">
                        <p className="portfolio-title">Portfolio</p>
                        <p onClick={handleOpenDash} className="portfolio-dashboard-btn">Dashboard</p>
                    </div>
                    <div className="portfolio-body">
                        {userPortfolio.length === 0 ? (
                            <p>Nothing here....yet</p>
                        ) : (
                            <p>Display stocks</p>
                        )}
                    </div>
                </div>
                <div className="movers-cont">
                    <div className="movers-header">
                        <p className="movers-title">Top Movers</p>
                        <p className="movers-date">As of today</p>
                    </div>
                    <div className="movers-body"></div>
                </div>
                <div className="signout-cont">
                    <button onClick={() => navigate("/")}>
                        <i className="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>
            </div>
            <div className="home-main">
                {showGraph ? (
                    <>
                        <div className="graph-container">
                            <StockGraph stockSymbol={stockSymbol} /> {/* Display graph */}
                        </div>
                        <div className="stock-data">
                            <h2>{stockSymbol}</h2>
                            <p>Ticker</p>
                        </div>
                    </>
                ) : !showGraph && showDash ? (
                    <h1 className="home-title">Search for a stock to view its graph</h1>
                ) : (
                    <h1>Data</h1>
                )}
                {showDash && (
                    <Dashboard />
                )}
            </div>
        </div>
    );
};

export default Homepage;
