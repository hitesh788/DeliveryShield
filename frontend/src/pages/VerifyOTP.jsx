import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Shield } from 'lucide-react';
import './Login.css';

const API_URL = 'http://localhost:5000/api';

const VerifyOTP = () => {
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const emailParam = queryParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        } else {
            toast.error('Email not found in URL');
            navigate('/register');
        }
    }, [location, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
            toast.success(res.data.message);
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            const res = await axios.post(`${API_URL}/auth/resend-otp`, { email });
            toast.success(res.data.message);
            // DEBUG OTP REMOVED
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="auth-container auth-page">
            <style>{`
                @keyframes blink {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.9); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .blinking-logo {
                    animation: blink 1s infinite ease-in-out;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
            `}</style>

            <div className="auth-split">
                <div className="auth-form-panel">
                    <h2>Verify Your Email</h2>
                    <p className="auth-subtitle">We've sent a 6-digit OTP to <strong>{email}</strong>. It expires in 5 minutes.</p>
                    <form onSubmit={handleVerify}>
                        <div className="form-group">
                            <label>One-Time Password (OTP)</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit code"
                                maxLength="6"
                                required
                                style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <div className="blinking-logo">
                                    <Shield size={20} fill="white" />
                                    <span>Verifying...</span>
                                </div>
                            ) : 'Verify OTP'}
                        </button>
                    </form>
                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <p>Didn't receive code?</p>
                        <button
                            onClick={handleResend}
                            className="btn btn-secondary"
                            disabled={resending}
                            style={{ background: 'transparent', color: '#007bff', border: 'none', padding: '0', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            {resending ? (
                                <div className="blinking-logo" style={{ color: '#007bff' }}>
                                    <span>Sending...</span>
                                </div>
                            ) : 'Resend OTP'}
                        </button>
                    </div>
                    <p style={{ marginTop: '2rem' }}>Want to try another account? <Link to="/register">Register</Link></p>
                </div>
                <div className="auth-visual-panel">
                    <span className="auth-kicker">Security First</span>
                    <h1>Simple verification for total peace of mind.</h1>
                    <p>Verify your identity to ensure only you can access your insurance claims and wallet funds.</p>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
