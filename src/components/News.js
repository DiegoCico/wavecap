import React, { useEffect, useState } from "react";
import "../css/News.css"; 

const News = ({ companyName }) => {
    const [news, setNews] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch(`/news/${companyName}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch news: ${response.status}`);
                }
                const data = await response.json();
                setNews(data.news);
            } catch (err) {
                console.error(err);
                setError(err.message);
            }
        };

        fetchNews();
    }, [companyName]);

    return (
        <div className="news-container">
            <h3>Recent News About {companyName}</h3>
            {error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : news.length > 0 ? (
                news.map((article, index) => (
                    <div key={index} className="news-item">
                        <a href={article.link} target="_blank" rel="noopener noreferrer">
                            {article.title}
                        </a>
                        <p>{article.description || "No description available."}</p>
                        <small>
                            <span>Source:</span> {article.source}
                        </small>
                        <br />
                        <small>
                            <span>Published:</span> {new Date(article.published).toLocaleString()}
                        </small>
                    </div>
                ))
            ) : (
                <p>No news articles available.</p>
            )}
        </div>
    );
};

export default News;
