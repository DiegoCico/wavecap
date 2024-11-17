import React, { useState, useEffect } from "react";
import "../css/News2.css";

const News = ({ companyName }) => {
    const [newsData, setNewsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNews = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://127.0.0.1:5000/news/${companyName}`);
                if (!response.ok) throw new Error(`Failed to fetch news: ${response.statusText}`);
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
        <div>
            <h4 className="news-heading">News About {companyName}</h4>
            <div className="news-container">
                {isLoading ? (
                    <div className="status-message">Fetching latest news...</div>
                ) : error ? (
                    <div className="status-message error">{error}</div>
                ) : newsData.length ? (
                    newsData.map((item, index) => (
                        <div key={index} className="news-item">
                            <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="news-title"
                            >
                                {item.title}
                            </a>
                            <p className="news-description">
                                {item.description || "No description provided."}
                            </p>
                            <small className="news-meta">
                                <span>{item.source || "Unknown source"}</span> •{" "}
                                {new Date(item.published).toLocaleDateString()}
                            </small>
                        </div>
                    ))
                ) : (
                    <div className="status-message">No news found.</div>
                )}
            </div>
        </div>
    );
    
};

export default News;
