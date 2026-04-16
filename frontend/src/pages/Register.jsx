import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Shield } from 'lucide-react';
import './Login.css';

const API_URL = 'http://localhost:5000/api';
const initialFormData = {
    name: '',
    email: '',
    phone: '',
    password: '',
    platform: 'Zomato',
    platformId: '',
    city: 'Mumbai',
    averageWeeklyIncome: 4000
};

const Register = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((current) => ({
            ...current,
            [name]: value ?? ''
        }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/register`, formData);
            toast.success(res.data.message);
            // DEBUG OTP REMOVED AS REQUESTED
            navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
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

            <div className="auth-split auth-split-register">
                <div className="auth-visual-panel">
                    <span className="auth-kicker">Start Protected</span>
                    <h1>Build your safety net before the next disruption.</h1>
                    <p>Create your worker profile so DeliveryShield can estimate risk, activate coverage, and route approved payouts to your wallet.</p>
                </div>
                <div className="auth-form-panel">
                    <h2>Register Worker</h2>
                    <p className="auth-subtitle">Tell us the basics to create your protection profile.</p>
                    <form onSubmit={handleRegister}>
                        <input type="text" name="name" placeholder="Full Name" value={formData.name ?? ''} onChange={handleChange} required />
                        <input type="email" name="email" placeholder="Email Address" value={formData.email ?? ''} onChange={handleChange} required />
                        <input type="text" name="phone" placeholder="Phone Number" value={formData.phone ?? ''} onChange={handleChange} required />
                        <input type="password" name="password" placeholder="Password" value={formData.password ?? ''} onChange={handleChange} required />
                        <select name="platform" value={formData.platform ?? initialFormData.platform} onChange={handleChange}>
                            <option value="Zomato">Zomato</option>
                            <option value="Swiggy">Swiggy</option>
                            <option value="Blinkit">Blinkit</option>
                            <option value="Zepto">Zepto</option>
                            <option value="Amazon">Amazon</option>
                        </select>
                        <input type="text" name="platformId" placeholder="Platform Rider ID (e.g. ZOM-123)" value={formData.platformId ?? ''} onChange={handleChange} required />
                        <select name="city" value={formData.city ?? initialFormData.city} onChange={handleChange}>
                            <option value="Mumbai">Mumbai</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Bangalore">Bangalore</option>
                            <option value="Chennai">Chennai</option>
                        </select>
                        <input type="number" name="averageWeeklyIncome" placeholder="Avg Weekly Income" value={formData.averageWeeklyIncome ?? ''} onChange={handleChange} required />

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <div className="blinking-logo">
                                    <Shield size={20} fill="white" />
                                    <span>Processing...</span>
                                </div>
                            ) : "Register"}
                        </button>

                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px', fontStyle: 'italic', textAlign: 'center' }}>
                            Note: Use mobile data incase of otp not generation
                        </p>
                    </form>
                    <p>Already have an account? <Link to="/login">Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
