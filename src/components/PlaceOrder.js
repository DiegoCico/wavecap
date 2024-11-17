import React, { useState } from 'react';
import '../css/PlaceOrder.css'

export default function PlaceOrder({ ticker }) {
    const [dollarAmount, setDollarAmount] = useState('');
    const [orderType, setOrderType] = useState('market');
    const [side, setSide] = useState('buy'); // New state for order side
    const [message, setMessage] = useState('');

    const handlePlaceOrder = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/place-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ticker,
                    dollarAmount,
                    orderType,
                    side // Pass the side ('buy' or 'sell')
                }),
            });

            const result = await response.json();
            if (response.ok) {
                setMessage(`Order placed successfully: ${result.order.id}`);
            } else {
                setMessage(`Error placing order: ${result.error}`);
            }
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div className="place-order">
            <h3>Place Order</h3>
            <label>
                Dollar Amount ($):
                <input
                    type="number"
                    value={dollarAmount}
                    onChange={(e) => setDollarAmount(e.target.value)}
                />
            </label>
            <label>
                Order Type:
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                    <option value="market">Market</option>
                    <option value="limit">Limit</option>
                </select>
            </label>
            <label>
                Order Side:
                <select value={side} onChange={(e) => setSide(e.target.value)}>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                </select>
            </label>
            <button onClick={handlePlaceOrder}>Place Order</button>
            {message && <p>{message}</p>}
        </div>
    );
}
