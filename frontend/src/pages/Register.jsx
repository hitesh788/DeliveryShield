import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Login.css';

const API_URL = 'http://localhost:5000/api';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '', platform: 'Zomato', city: 'Mumbai', averageWeeklyIncome: 4000
    });
    const [pendingEmail, setPendingEmail] = useState('');
    const [otp, setOtp] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/auth/register`, formData);
            setPendingEmail(res.data.email);
            if (res.data.devOtp) setOtp(res.data.devOtp);
            toast[res.status === 202 ? 'warning' : 'success'](res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/auth/verify-email`, { email: pendingEmail, otp });
            toast.success(res.data.message);
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.error || 'OTP verification failed');
        }
    };

    const handleResendOtp = async () => {
        try {
            const res = await axios.post(`${API_URL}/auth/resend-otp`, { email: pendingEmail });
            if (res.data.devOtp) setOtp(res.data.devOtp);
            toast[res.status === 202 ? 'warning' : 'info'](res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to resend OTP');
        }
    };

    return (
        <div className="auth-container auth-page">
            <div className="auth-split auth-split-register">
                <div className="auth-visual-panel">
                    <span className="auth-kicker">Start Protected</span>
                    <h1>Build your safety net before the next disruption.</h1>
                    <p>Create your worker profile so DeliveryShield can estimate risk, activate coverage, and route approved payouts to your wallet.</p>
                </div>
                <div className="auth-form-panel">
                    <h2>Register Worker</h2>
                    <p className="auth-subtitle">Tell us the basics to create your protection profile.</p>
                    {!pendingEmail ? (
                        <form onSubmit={handleRegister}>
                            <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required />
                            <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required />
                            <input type="text" name="phone" placeholder="Phone Number" onChange={handleChange} required />
                            <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                            <select name="platform" onChange={handleChange}>
                                <option value="Zomato">Zomato</option>
                                <option value="Swiggy">Swiggy</option>
                                <option value="Amazon">Amazon</option>
                                <option value="Zepto">Zepto</option>
                            </select>
                            <select name="city" onChange={handleChange}>
                                <option value="Mumbai">Mumbai</option>
                                <option value="Delhi">Delhi</option>
                                <option value="Bangalore">Bangalore</option>
                                <option value="Chennai">Chennai</option>
                            </select>
                            <input type="number" name="averageWeeklyIncome" placeholder="Avg Weekly Income" onChange={handleChange} required />
                            <button type="submit" className="btn btn-primary">Register</button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp}>
                            <p className="auth-subtitle" style={{ marginBottom: 0 }}>
                                OTP sent to <strong>{pendingEmail}</strong> from softgridtechnologies@gmail.com.
                            </p>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                maxLength="6"
                                required
                            />
                            <button type="submit" className="btn btn-primary">Verify Email</button>
                            <button type="button" className="btn btn-dark" onClick={handleResendOtp}>Resend OTP</button>
                        </form>
                    )}
                    <p>Already have an account? <Link to="/login">Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
