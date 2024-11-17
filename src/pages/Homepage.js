import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import '../css/Homepage.css';

const Homepage = () => {
    const [userPortfolio, setUserPortfolio] = useState([])
    const { uid } = useParams()
    const navigate = useNavigate()

    const today = new Date();
    const formattedDate = `${String(
        today.getMonth() + 1
    ).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${String(today.getFullYear()).slice(-2)}`

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

    return (
        <div className="homepage">
            <div className="home-sidenav">
                <div className="logo-cont">
                    <img className="logo-image" src={`${process.env.PUBLIC_URL}/logo-sidenav.png`} alt="WaveCap Logo" />
                </div>
                <div className="search-cont">
                    <input className="search-box" placeholder="Search Stock" type="text"/>
                </div>
                <div className="custom-line"></div>
                <div className="portfolio-cont">
                    <div className="portfolio-header">
                        <p className="portfolio-title">Portfolio</p>
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
                        <p className="movers-date">As of {formattedDate}</p>
                    </div>
                    <div className="movers-body">
                        
                    </div>
                </div>
                <div className="signout-cont">
                    <button onClick={handleSignout}><i className="fa-solid fa-right-from-bracket"></i></button>
                </div>
            </div>
            <div className="home-main">
                <h1>Main</h1>
            </div>
        </div>
    )
}

export default Homepage;