import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const API_URL = 'http://localhost:5000/api';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '', phone: '', password: '', platform: 'Zomato', city: 'Mumbai', averageWeeklyIncome: 4000
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/auth/register`, formData);
            alert('Registration successful!');
            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.error || 'Registration failed');
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
                <form onSubmit={handleRegister}>
                    <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required />
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
                    <p>Already have an account? <Link to="/login">Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
