import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StockGraph from "../components/StockGraph";
import Stock from "./Stock";
import Dashboard from "./Dashboard";
import "../css/Homepage.css";

const Homepage = () => {
    const [userPortfolio, setUserPortfolio] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [stockSymbol, setStockSymbol] = useState("");
    const [showGraph, setShowGraph] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showDash, setShowDash] = useState(true);
    const [topGainers, setTopGainers] = useState([]); // Support for multiple gainers
    const { uid } = useParams();
    const inputRef = useRef(null);
    const imagePath = `${process.env.PUBLIC_URL}/ticker_icons/${stockSymbol}.png`
    const navigate = useNavigate()

    useEffect(() => {
        fetchPortfolio();
        fetchTopGainers(); // Fetch top gainers
    }, []);

    // Fetch user's portfolio
    const fetchPortfolio = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/get-portfolio?uid=${uid}`);
            if (response.ok) {
                const data = await response.json();
                setUserPortfolio(data.portfolio || []);
            } else {
                console.error("Failed to fetch portfolio");
            }
        } catch (error) {
            console.error("Error fetching portfolio:", error);
        }
    };

    // Fetch top gainers
    const fetchTopGainers = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/top-gainers", {
                method:'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                console.log(data.top_gainers)
                // setTopGainers(data.list); // Set all top gainers
            } else {
                console.error("Failed to fetch top gainers");
            }
        } catch (error) {
            console.error("Error fetching top gainers:", error);
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

    const handleInputChange = (event) => {
        const value = event.target.value.toUpperCase();
        setInputValue(value);

        if (value.trim()) {
            fetchSuggestions(value);
        } else {
            setSuggestions([]);
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

    const handlePortfolioItemClick = (symbol) => {
        setStockSymbol(symbol); // Set the selected stock symbol
        setShowGraph(true); // Show the graph view
        setShowDash(false); // Hide the dashboard
    };

    const handleOpenDash = () => {
        setShowDash(true);
        setShowGraph(false);
        setStockSymbol(""); // Clear any selected stock
    };

    useEffect(() => {
        // Mock static data for top gainers
        const staticData = [
            {
                symbol: "AAPL",
                imagePath: `${process.env.PUBLIC_URL}/ticker_icons/AAPL.png`,
                high: 250,
                low: 130,
            },
            {
                symbol: "AMZN",
                imagePath: `${process.env.PUBLIC_URL}/ticker_icons/AMZN.png`,
                high: 350,
                low: 280,
            },
            {
                symbol: "GOOGL",
                imagePath: `${process.env.PUBLIC_URL}/ticker_icons/GOOGL.png`,
                high: 2900,
                low: 2700,
            },
        ];
        setTopGainers(staticData);
    }, []);

    const handleSignout = async() => {
        try {
            const response = await fetch('http://127.0.0.1:5000/logout', {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ uid }),
            })
            const data = await response.json()
            if (response.ok) {
                console.log(data.message)
                navigate('/')
            } else {
                console.log(data.error)
            }
        } catch (error) {
            console.log(error.message)
        }
    }


console.log(topGainers)
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
                        <p
                            onClick={handleOpenDash}
                            className="portfolio-dashboard-btn"
                        >
                            Dashboard
                        </p>
                    </div>
                    <div className="portfolio-body">
                        {userPortfolio.length === 0 ? (
                            <p className="no-stocks-message">No stocks saved yet</p>
                        ) : (
                            userPortfolio.map((stock, index) => (
                                <div
                                    key={index}
                                    className="portfolio-item"
                                    onClick={() => handlePortfolioItemClick(stock.symbol)} // Switch to stock view
                                >
                                    <img
                                        className="portfolio-stock-image"
                                        src={`${process.env.PUBLIC_URL}/ticker_icons/${stock.symbol}.png`}
                                        alt={`${stock.name} logo`}
                                    />
                                    <p className="portfolio-stock-name">{stock.name}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="movers-cont">
                    <div className="movers-header">
                        <p>Top Movers</p>
                    </div>
                    {topGainers.length > 0 ? (
                        topGainers.map((gainer, index) => (
                            <div key={index} className="gainer-item">
                                <div className="gainer-content">
                                    {/* Stock Logo */}
                                    {/* Stock Information */}
                                    <div className="gainer-info">
                                        <p className="gainer-symbol">{gainer.symbol}</p>
                                        <div className="gainer-high-low">
                                            <p>High: {gainer.high}</p>
                                            <p>Low: {gainer.low}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Loading...</p>
                    )}
            </div>
                <div className="signout-cont">
                    <button onClick={handleSignout}>
                        <i className="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>
            </div>
            <div className="home-main">
                {showGraph ? (
                    <Stock stockSymbol={stockSymbol} />
                ) : showDash ? (
                    <div className="dashboard-container">
                        <Dashboard uid={uid} />
                    </div>
                ) : (
                    <h1 className="home-title">Search for a stock to view its details</h1>
                )}
            </div>
        </div>
    );
};

export default Homepage;
