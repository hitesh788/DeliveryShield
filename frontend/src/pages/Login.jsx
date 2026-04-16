import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Login.css';

const API_URL = 'http://localhost:5000/api';

const Login = () => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const payload = { password };
            if (loginId.includes('@')) {
                payload.email = loginId;
            } else {
                payload.phone = loginId;
            }
            const res = await axios.post(`${API_URL}/auth/login`, payload);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            localStorage.setItem('userPlan', res.data.user.currentPlan || 'BASIC PLAN');
            toast.success('Login successful');
            navigate('/dashboard');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Login failed';

            if (err.response?.status === 403 && err.response?.data?.unverified) {
                toast.info('Please verify your email before logging in.');
                navigate(`/verify-otp?email=${encodeURIComponent(err.response.data.email)}`);
            } else {
                toast.error(errorMsg);
            }
        }
    };

    return (
        <div className="auth-container auth-page">
            <div className="auth-split">
                <div className="auth-form-panel">
                    <h2>Welcome Back</h2>
                    <p className="auth-subtitle">Sign in to manage your coverage, wallet, and claims.</p>
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>Phone or Email</label>
                            <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary">Login</button>
                    </form>
                    <p>Don't have an account? <Link to="/register">Register</Link></p>
                    <p>Admin? <Link to="/admin-login">Use admin login</Link></p>
                </div>
                <div className="auth-visual-panel">
                    <span className="auth-kicker">DeliveryShield</span>
                    <h1>Income protection for every shift.</h1>
                    <p>Track policy status, claim payouts, wallet funds, and plan upgrades from one secure worker dashboard.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
