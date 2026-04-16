import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../config';
import './Login.css';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/auth/admin-login`, { username, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.admin));
            localStorage.removeItem('userPlan');
            toast.success('Admin login successful');
            navigate('/admin');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Admin login failed');
        }
    };

    return (
        <div className="auth-container auth-page">
            <div className="auth-split auth-split-admin">
                <div className="auth-form-panel">
                    <h2>Admin Login</h2>
                    <p className="auth-subtitle">Access operations, claims review, city risk, and platform-wide metrics.</p>
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>Admin Username</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary">Login as Admin</button>
                    </form>
                    <p>Worker login? <Link to="/login">Go to user login</Link></p>
                </div>
                <div className="auth-visual-panel">
                    <span className="auth-kicker">Admin Console</span>
                    <h1>Control room for protection operations.</h1>
                    <p>Review fraud signals, active policies, claim trends, city risk, and payout performance from one secure console.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
