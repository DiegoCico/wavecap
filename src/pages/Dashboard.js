import React, { useEffect, useState } from 'react';
import '../css/Dashboard.css';
import PaperTrading from './PaperTrading.js'

export default function Dashboard({ uid }) {
    const [sims, setSims] = useState([])
    const [showSim, setShowSim] = useState(false)
    const [currentSim, setCurrentSim] = useState({})
    const [showSims, setShowSims] = useState(true)
    const [showPopup, setShowPopup] = useState(false)
    const [newSim, setNewSim] = useState({
        name: '',
        startingBalance: '',
        startingTicker: ''
    })

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
        setShowSims(false)
    }

    const createNewSim = async() => {
        try {
            const response = await fetch('http://127.0.0.1:5000/create-new-simulation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid,
                    name: newSim.name,
                    startingBalance: parseFloat(newSim.startingBalance),
                    startingTicker: newSim.startingTicker,
                })
            })

            if (response.ok) {
                const result = await response.json();
                setSims((prevSims) => [...prevSims, result.simulation])
                setShowPopup(false)
                setNewSim({ name: '', startingBalance: '', startingTicker: '' })
            } else {
                const result = await response.json();
                console.log(result.error)
            }
        } catch(error) {
            console.log(error.message)
        }
    }

    function formatDate(dateOpened) {
        if (!dateOpened || typeof dateOpened !== 'object') return 'Invalid date';
    
        const { day, month, year } = dateOpened;
    
        if (typeof day !== 'number' || typeof month !== 'number' || typeof year !== 'number') return 'Invalid date';
    
        const formattedDate = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
        return formattedDate;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-title">
                <h1>Dashboard</h1>
            </div>
            <div className="dashboard-main">
                {showSim && (
                    <PaperTrading sim={currentSim} setShowSims={setShowSims} setShowSim={setShowSim} />
                )}
                {showSims && (
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
                                            <td>{sim.simulatedCash}</td>
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
                            <button className="open-new" onClick={() => setShowPopup(true)}>Open New</button>
                        </div>
                    </>
                )}
            </div>
            {showPopup && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Create New Simulation</h2>
                        <input
                            type="text"
                            placeholder="Simulation Name"
                            value={newSim.name}
                            onChange={(e) => setNewSim({ ...newSim, name: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Starting Balance ($)"
                            value={newSim.startingBalance}
                            onChange={(e) => setNewSim({ ...newSim, startingBalance: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Starting Ticker"
                            value={newSim.startingTicker}
                            onChange={(e) => setNewSim({ ...newSim, startingTicker: e.target.value })}
                        />
                        <button onClick={createNewSim}>Create</button>
                        <button onClick={() => setShowPopup(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}
