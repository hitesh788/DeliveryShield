import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../config';
import './Login.css';

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

    const handleForgotPassword = async () => {
        if (!loginId || !loginId.includes('@')) {
            toast.warn('Please enter your registered email address in the Phone/Email field, and click Forgot Password again.', { autoClose: 6000 });
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/auth/forgot-password`, { email: loginId });
            toast.success(res.data.message || 'A temporary password has been sent to your email.');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Unable to reset password. Check if your email is registered.');
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
                        <div className="form-group" style={{ marginBottom: '10px' }}>
                            <label>Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                            <span
                                onClick={handleForgotPassword}
                                style={{ color: '#3B82F6', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
                            >
                                Forgot Password?
                            </span>
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
