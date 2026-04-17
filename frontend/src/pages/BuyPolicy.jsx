import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../config';
import './BuyPolicy.css';
import './Claims.css';

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

    const handleBuy = async (paymentMethod) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/policy/buy`, { paymentMethod }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Policy Purchased Successfully! Paid via ${paymentMethod === 'wallet' ? 'wallet' : 'Razorpay test mode'}.`);
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Purchase failed');
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
                        <li>✅ Weather & Pollution Disruptions</li>
                        <li>✅ Fully Automated Zero-Touch Claims</li>
                    </ul>
                    <p className="risk-text">AI Risk Multiplier: {quote.riskFactor}x (Based on your location)</p>
                    {quote.explanation && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '15px' }}>
                            {quote.explanation.map(item => <span key={item} className="badge pending">{item}</span>)}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => handleBuy('wallet')} className="btn btn-dark btn-large">Pay from Wallet</button>
                        <button onClick={() => handleBuy('razorpay')} className="btn btn-success btn-large">Pay with Razorpay (Simulated)</button>
                    </div>
                </div>
            ) : (
                <p>Loading AI quote...</p>
            )}
        </div>
    );
};

export default BuyPolicy;
