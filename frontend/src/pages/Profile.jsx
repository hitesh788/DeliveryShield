import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { User, Save } from 'lucide-react';
import './Claims.css';

const API_URL = 'http://localhost:5000/api';

const Profile = () => {
    const [form, setForm] = useState({
        name: '',
        city: 'Mumbai',
        platform: 'Zomato',
        averageWeeklyIncome: 4000,
        upiId: ''
    });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
                setForm({
                    name: res.data.name || '',
                    city: res.data.city || 'Mumbai',
                    platform: res.data.platform || 'Zomato',
                    averageWeeklyIncome: res.data.averageWeeklyIncome || 4000,
                    upiId: res.data.upiId || ''
                });
            } catch (err) {
                toast.error('Failed to load profile');
            }
        };
        loadProfile();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/auth/profile`, form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Profile update failed');
        }
    };

    return (
        <div className="claims-container">
            <div className="dashboard-header" style={{ marginBottom: '20px' }}>
                <div className="welcome-text">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><User color="var(--primary)" /> Profile Settings</h2>
                    <p>Update worker details, default UPI, city, and income inputs used for risk pricing.</p>
                </div>
            </div>

            <form className="card" onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', maxWidth: '700px' }}>
                <input className="modal-input" style={{ margin: 0, textAlign: 'left' }} name="name" value={form.name} onChange={handleChange} placeholder="Full name" />
                <select className="modal-input" style={{ margin: 0, textAlign: 'left' }} name="platform" value={form.platform} onChange={handleChange}>
                    <option value="Zomato">Zomato</option>
                    <option value="Swiggy">Swiggy</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Zepto">Zepto</option>
                    <option value="Other">Other</option>
                </select>
                <select className="modal-input" style={{ margin: 0, textAlign: 'left' }} name="city" value={form.city} onChange={handleChange}>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Chennai">Chennai</option>
                </select>
                <input className="modal-input" style={{ margin: 0, textAlign: 'left' }} type="number" name="averageWeeklyIncome" value={form.averageWeeklyIncome} onChange={handleChange} placeholder="Average weekly income" />
                <input className="modal-input" style={{ margin: 0, textAlign: 'left' }} name="upiId" value={form.upiId} onChange={handleChange} placeholder="Default UPI ID" />
                <button className="btn btn-primary" type="submit" style={{ width: 'fit-content' }}><Save size={16} /> Save Profile</button>
            </form>
        </div>
    );
};

export default Profile;
