import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../config';
import './Forgot.css';

const Forgot = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
            toast.success(res.data.message || 'A temporary password has been sent to your email.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Unable to reset password. Check if your email is registered.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container forgot-page">
            <div className="forgot-split">
                <div className="forgot-form-panel">
                    <div className="forgot-logo">
                        <span className="logo-sparkles">✦</span> DeliveryShield
                    </div>

                    <div className="forgot-form-center">
                        <div className="forgot-icon-container">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-key-round">
                                <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
                                <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                            </svg>
                        </div>
                        <h2>Forgot password?</h2>
                        <p className="forgot-subtitle">No worries, we'll send you reset instructions.</p>

                        <form onSubmit={handleReset}>
                            <div className="form-group-forgot">
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-dark" disabled={loading}>
                                {loading ? 'Sending...' : 'Reset password'}
                            </button>
                        </form>

                        <div className="back-to-login">
                            <Link to="/login">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-arrow-left">
                                    <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
                                </svg>
                                Back to log in
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="forgot-visual-panel">
                    <div className="visual-gradient-overlay"></div>
                    <div className="forgot-visual-text">
                        <h3>Income protection for every shift. Track policy status, claim payouts, and wallet funds securely.</h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Forgot;
