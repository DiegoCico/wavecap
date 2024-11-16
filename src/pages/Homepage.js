import React from "react";
import '../css/Homepage.css';

const Homepage = () => {
    return (
        <div className="homepage">
            <div className="home-sidenav">
                <div className="logo-cont">
                    <img className="logo-image" src={`${process.env.PUBLIC_URL}/logo-sidenav.png`} alt="WaveCap Logo" />
                </div>
                <div className="search-cont">
                    <input className="search-box" type="text"/>
                </div>
                <div class="custom-line"></div>
                <div className="portfolio-cont">
                    <div className="portfolio-header">
                        <p>Portfolio</p>
                    </div>
                    <div className="portfolio-body">
                        <p>Nothing here....yet</p>
                    </div>
                </div>
                
            </div>
            <div className="home-main">
                <h1>Main</h1>
            </div>
        </div>
    )
}

export default Homepage;