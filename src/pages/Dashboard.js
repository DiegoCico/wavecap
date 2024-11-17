import React, { useEffect, useState } from 'react';
import '../css/Dashboard.css';
import {useParams} from 'react-router-dom'
import PaperTrading from './PaperTrading.js'

export default function Dashboard({ uid }) {
    const [sims, setSims] = useState([])
    const [showSim, setShowSim] = useState(false)
    const [currentSim, setCurrentSim] = useState({})

    useEffect(() => {
        const fetchUserSims = async() => {
            try {
                const response = await fetch('http://127.0.0.1:5000/fetch-user-sims', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({uid:uid})
                })

                if (response.ok) {
                    const result = await response.json()
                    setSims(result.sims)
                    console.log(result.sims)
                } else {
                    const result = await response.json()
                    console.log(result.error)
                }
            } catch(error) {
                console.log(error.message)
            }
        }

        fetchUserSims()
    }, [uid])

    const openSim = (sim) => {
        setShowSim(true)
        setCurrentSim(sim)
    }

    function formatDate(dateOpened) {
        // Check if dateOpened is valid and has the expected properties
        if (!dateOpened || typeof dateOpened !== 'object') return 'Invalid date';
    
        const { day, month, year } = dateOpened;
    
        // Ensure all parts are valid numbers
        if (typeof day !== 'number' || typeof month !== 'number' || typeof year !== 'number') return 'Invalid date';
    
        // Format the date to mm/dd/yyyy
        const formattedDate = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
        return formattedDate;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-title">
                <h1>Dashboard</h1>
            </div>
            <div className="dashboard-main">
                {showSim ? (
                    <PaperTrading sim={currentSim} />
                ) : (
                    <>
                        <div className="sims-title">
                            <h2>Your Simulations</h2>
                        </div>
                        <div className="sims-cont">
                            <table className="simulations-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Balance</th>
                                        <th>P&L</th>
                                        <th>Win Rate</th>
                                        <th>Date Opened</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sims.map((sim, index) => (
                                        <tr key={index}>
                                            <td>{sim.name}</td>
                                            <td>{sim.currentBalance}</td>
                                            <td className="positive">{sim.profitLoss}</td>
                                            <td className="positive">{sim.winRate}</td>
                                            <td>{formatDate(sim.dateOpened)}</td>
                                            <td><button onClick={() => openSim(sim)} >Enter</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="buttons-cont">
                            <button className="open-new">Open New</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
