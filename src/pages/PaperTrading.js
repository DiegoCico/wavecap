import React from "react";
import TradingViewChart from "../components/TradingViewChart";
import "../css/PaperTrading.css";
import PlaceOrder from "../components/PlaceOrder";

export default function PaperTrading({ sim, setShowSims, setShowSim }) {
    const handleBack = () => {
        setShowSims(true);
        setShowSim(false);
    };

    return (
        <div className="paper-trading">
            {/* Simulation Header */}
            <div className="sim-header">
                <button onClick={handleBack} className="back-btn">
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <h1>{sim.name}</h1>
            </div>

            {/* Main Content Container */}
            <div className="paper-trading-main">
                {/* TradingView Chart */}
                <div className="chart-container">
                    <TradingViewChart ticker={sim.startingTicker} /> {/* Example ticker */}
                </div>

                {/* Account Details */}
                <div className="account-details">
                    <table>
                        <thead>
                            <tr>
                                <th>Balance</th>
                                <th>P&L</th>
                                <th>Win Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{sim.currentBalance}</td>
                                <td className="positive">{sim.profitLoss}</td>
                                <td className="positive">{sim.winRate}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="order-section">
                        <PlaceOrder ticker={sim.startingTicker} />
                    </div>
                </div>
            </div>
        </div>
    );
}
