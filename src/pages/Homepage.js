import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StockGraph from "../components/StockGraph";
import Stock from './Stock';
import Dashboard from "./Dashboard";
import "../css/Homepage.css";

const Homepage = () => {
    const [userPortfolio, setUserPortfolio] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [stockSymbol, setStockSymbol] = useState("");
    const [showGraph, setShowGraph] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showDash, setShowDash] = useState(true);
    const [topGainer, setTopGainer] = useState(null);
    const { uid } = useParams();
    const navigate = useNavigate();
    const inputRef = useRef(null);

    useEffect(() => {
        // fetchTopGainer();
    }, []);

    const fetchTopGainer = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/top-gainer`);
            if (response.ok) {
                const data = await response.json();
                setTopGainer(data);
            } else {
                console.error("Failed to fetch top gainer data");
            }
        } catch (error) {
            console.error("Error fetching top gainer data:", error);
        }
    };

    const handleInputChange = (event) => {
        const value = event.target.value.toUpperCase();
        setInputValue(value);

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
                setSuggestions(data.suggestions);
            } else {
                console.error("Failed to fetch stock suggestions");
            }
        } catch (error) {
            console.error("Error fetching stock suggestions:", error);
        }
    };

    const handleSearch = (event) => {
        if (event.key === "Enter") {
            const trimmedValue = inputValue.trim();
            if (trimmedValue === "") {
                setShowGraph(false);
                setShowDash(true);
            } else {
                setStockSymbol(trimmedValue);
                setShowGraph(true);
                setShowDash(false);
            }
            inputRef.current?.focus(); // Refocus input after search
        }
    };

    const handleSuggestionClick = (symbol) => {
        setStockSymbol(symbol);
        setInputValue(symbol);
        setShowGraph(true);
        setSuggestions([]);
        inputRef.current?.focus(); // Refocus input
    };

    const handleOpenDash = () => {
        setShowDash(true);
        setShowGraph(false);
    };

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
                        ref={inputRef}
                        className="search-box"
                        placeholder="Search Stock"
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleSearch}
                        aria-label="Search Stock Input"
                    />
                    {suggestions.length > 0 && (
                        <ul className="suggestions-list" role="listbox">
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion.symbol)}
                                    className="suggestion-item"
                                    role="option"
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
                        <p onClick={handleOpenDash} className="portfolio-dashboard-btn">
                            Dashboard
                        </p>
                    </div>
                    <div className="portfolio-body">
                        {userPortfolio.length === 0 ? (
                            <p>Nothing here....yet</p>
                        ) : (
                            <button className="add-stocks-btn">Add Stocks</button>
                        )}
                    </div>
                </div>
                <div className="movers-cont">
                    <div className="movers-header">
                        <p className="movers-title">Top Gainer</p>
                        <p className="movers-date">As of today</p>
                    </div>
                    <div className="movers-body">
                        {topGainer ? (
                            <div className="gainer-item">
                                <p>
                                    <strong>{topGainer.symbol}</strong> - {topGainer.name}
                                </p>
                                <p>High: {topGainer.high} | Low: {topGainer.low}</p>
                                <p style={{ color: "green" }}>
                                    Change: {topGainer.percentChange}%
                                </p>
                            </div>
                        ) : (
                            <p>Loading...</p>
                        )}
                    </div>
                </div>
                <div className="signout-cont">
                    <button onClick={() => navigate("/")}>
                        <i className="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>
            </div>
        <div className="home-main">
            {showGraph ? (
                    <Stock stockSymbol={stockSymbol} />
            ) : showDash ? (
                <div className="dashboard-container">
                    <Dashboard uid={uid}/>
                </div>
            ) : (
                <h1 className="home-title">Search for a stock to view its details</h1>
            )}
        </div>

        </div>
    );
};

export default Homepage;
