import React, { useState, useEffect } from "react";
import "../css/News.css"; // Assuming the CSS is in the same directory

const News = ({ companyName }) => {
    const [newsData, setNewsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNews = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://127.0.0.1:5000/news/${companyName}`);
                if (!response.ok) {
                    throw new Error(`Error fetching news: ${response.statusText}`);
                }
                const data = await response.json();
                setNewsData(data.news || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNews();
    }, [companyName]);

    return (
        <div className="news-container">
            <h4>Latest News on {companyName}</h4>
            {isLoading ? (
                <p>Loading news...</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : newsData.length > 0 ? (
                newsData.map((item, index) => (
                    <div key={index} className="news-item">
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                            {item.title}
                        </a>
                        <p>{item.description || "No description available."}</p>
                        <small>
                            Source: <span>{item.source || "Unknown"}</span> | Published:{" "}
                            <span>{new Date(item.published).toLocaleDateString()}</span>
                        </small>
                    </div>
                ))
            ) : (
                <p>No news articles found.</p>
            )}
        </div>
    );
};

export default News;
