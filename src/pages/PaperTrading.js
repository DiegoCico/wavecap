import React from "react";
import { useParams } from "react-router-dom";
import TradingViewChart from '../components/TradingViewChart'
import '../css/PaperTrading.css'

export default function PaperTrading({ sim }) {
    return (
        <div className="paper-trading">
            {/* Simulation Header */}
            <div className="sim-header">
                <h1>{sim.name}</h1>
            </div>

            {/* Main Content Container */}
            <div className="paper-trading-main">
                {/* TradingView Chart */}
                <div className="chart-container">
                    <TradingViewChart ticker="AAPL" /> {/* Example ticker */}
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
                </div>
            </div>
        </div>
    );
}
