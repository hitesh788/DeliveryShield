import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { User, Save, MapPin, Briefcase, IndianRupee, CreditCard, ShieldCheck, Activity } from 'lucide-react';
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
    const [stats, setStats] = useState({
        totalClaims: 0,
        approvedClaims: 0,
        totalPayout: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [userRes, claimsRes] = await Promise.all([
                    axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/claim`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                setForm({
                    name: userRes.data.name || '',
                    city: userRes.data.city || 'Mumbai',
                    platform: userRes.data.platform || 'Zomato',
                    averageWeeklyIncome: userRes.data.averageWeeklyIncome || 4000,
                    upiId: userRes.data.upiId || ''
                });

                const claims = claimsRes.data;
                const approved = claims.filter(c => c.status === 'approved' || c.status === 'auto-approved');
                setStats({
                    totalClaims: claims.length,
                    approvedClaims: approved.length,
                    totalPayout: approved.reduce((sum, c) => sum + c.amountPayout, 0)
                });

            } catch (err) {
                toast.error('Failed to load profile data');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Updating your secure profile...");
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/auth/profile`, form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.update(toastId, { render: "Profile synchronized effectively!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (err) {
            toast.update(toastId, { render: err.response?.data?.error || 'Update failed', type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    if (loading) return <div className="container" style={{ textAlign: 'center', padding: '100px' }}>Loading Profile Engine...</div>;

    return (
        <div className="claims-container">
            <div className="dashboard-header" style={{ marginBottom: '30px' }}>
                <div className="welcome-text">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <User color="var(--primary)" size={32} /> Worker Profile
                    </h2>
                    <p>Manage your identity, regional risk factors, and payout credentials.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '25px', alignItems: 'start' }}>
                {/* Main Form */}
                <form className="card" onSubmit={handleSubmit} style={{ padding: '40px' }}>
                    <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={20} color="var(--primary)" /> Basic Information
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Full Name</label>
                            <input className="modal-input" style={{ margin: 0, textAlign: 'left' }} name="name" value={form.name} onChange={handleChange} placeholder="Full name" />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Primary Platform</label>
                            <select className="modal-input" style={{ margin: 0, textAlign: 'left' }} name="platform" value={form.platform} onChange={handleChange}>
                                <option value="Zomato">Zomato</option>
                                <option value="Swiggy">Swiggy</option>
                                <option value="Amazon">Amazon</option>
                                <option value="Zepto">Zepto</option>
                                <option value="Blinkit">Blinkit</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Operational City</label>
                            <select className="modal-input" style={{ margin: 0, textAlign: 'left' }} name="city" value={form.city} onChange={handleChange}>
                                <option value="Mumbai">Mumbai</option>
                                <option value="Delhi">Delhi</option>
                                <option value="Bangalore">Bangalore</option>
                                <option value="Chennai">Chennai</option>
                                <option value="Hyderabad">Hyderabad</option>
                                <option value="Pune">Pune</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Avg. Weekly Income (₹)</label>
                            <input className="modal-input" style={{ margin: 0, textAlign: 'left' }} type="number" name="averageWeeklyIncome" value={form.averageWeeklyIncome} onChange={handleChange} placeholder="e.g. 5000" />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Settlement UPI ID</label>
                        <input className="modal-input" style={{ margin: 0, textAlign: 'left' }} name="upiId" value={form.upiId} onChange={handleChange} placeholder="9876543210@paytm" />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '5px' }}>This ID will be used for all automated claim payouts.</p>
                    </div>

                    <button className="btn btn-primary" type="submit" style={{ marginTop: '20px', padding: '15px 30px' }}>
                        <Save size={18} /> Update Secure Profile
                    </button>
                </form>

                {/* Sidebar Stats */}
                <div style={{ display: 'grid', gap: '20px' }}>
                    <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'var(--primary)', color: 'white' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                            <ShieldCheck size={30} />
                        </div>
                        <h4 style={{ opacity: 0.9, fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '5px' }}>Risk Status</h4>
                        <h2 style={{ fontSize: '1.8rem' }}>Verified</h2>
                    </div>

                    <div className="card" style={{ padding: '20px' }}>
                        <h4 style={{ color: 'var(--text-light)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '15px' }}>Platform Analytics</h4>
                        <div style={{ display: 'grid', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Total Claims</span>
                                <span style={{ fontWeight: 700 }}>{stats.totalClaims}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Approved</span>
                                <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{stats.approvedClaims}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Total Payouts</span>
                                <span style={{ fontWeight: 700 }}>₹{stats.totalPayout}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '20px', background: '#F8FAFC' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Need Help?</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '15px' }}>Contact our 24/7 delivery support for policy or payout issues.</p>
                        <a
                            href="https://mail.google.com/mail/?view=cm&fs=1&to=softgridtechnologies@gmail.com&su=DeliveryShield Support Request&body=Hi Support Team,%0D%0A%0D%0AI need assistance with my policy/payout. %0D%0A%0D%0AMy Registered Name: [Enter Name]%0D%0AMy Registered Phone: [Enter Phone]%0D%0AProblem Description: "
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-logout"
                            style={{ width: '100%', fontSize: '0.8rem', textDecoration: 'none' }}
                        >
                            Support Center
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;
