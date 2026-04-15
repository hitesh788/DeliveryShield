import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './BuyPolicy.css';

const API_URL = 'http://localhost:5000/api';

const BuyPolicy = () => {
    const [quote, setQuote] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/policy/quote`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setQuote(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchQuote();
    }, []);

    const handleBuy = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/policy/buy`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Policy Purchased Successfully! Payment simulated via Razorpay test mode.');
            navigate('/dashboard');
        } catch (err) {
            alert('Purchase failed');
        }
    };

    return (
        <div className="buy-policy-container">
            <h2>AI Dynamic Premium Quote</h2>
            {quote ? (
                <div className="quote-card">
                    <div className="price-tag">₹{quote.weeklyPremium} <span>/ week</span></div>
                    <ul className="features">
                        <li>✅ Loss of Income Protection</li>
                        <li>✅ Covers up to ₹{quote.incomeCovered} per week</li>
                        <li>✅ Weather & Curfew Disruptions</li>
                        <li>✅ Fully Automated Zero-Touch Claims</li>
                    </ul>
                    <p className="risk-text">AI Risk Multiplier: {quote.riskFactor}x (Based on your location)</p>
                    <button onClick={handleBuy} className="btn btn-success btn-large">Pay with Razorpay (Simulated)</button>
                </div>
            ) : (
                <p>Loading AI quote...</p>
            )}
        </div>
    );
};

export default BuyPolicy;
