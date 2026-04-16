import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    User, Save, MapPin, Briefcase, IndianRupee, CreditCard,
    ShieldCheck, Activity, Star, MessageSquare, AlertCircle,
    Camera, Mail, Award, CheckCircle2
} from 'lucide-react';
import './Claims.css';

const API_URL = 'http://localhost:5000/api';

const Profile = () => {
    const [form, setForm] = useState({
        name: '',
        city: 'Mumbai',
        platform: 'Zomato',
        averageWeeklyIncome: 4000,
        upiId: '',
        platformId: ''
    });
    const [user, setUser] = useState(null);
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

                setUser(userRes.data);
                setForm({
                    name: userRes.data.name || '',
                    city: userRes.data.city || 'Mumbai',
                    platform: userRes.data.platform || 'Zomato',
                    platformId: userRes.data.platformId || '',
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
        const toastId = toast.loading("Syncing profile with secure vault...");
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/auth/profile`, form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.update(toastId, { render: "Identity updated successfully!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (err) {
            toast.update(toastId, { render: err.response?.data?.error || 'Update failed', type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'DS';
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '20px', color: 'var(--text-light)', fontWeight: 500 }}>Decrypting Profile Data...</p>
        </div>
    );

    return (
        <div className="claims-container">
            {/* Header Hero Section */}
            <div className="card" style={{
                padding: '40px',
                marginBottom: '30px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                color: 'white',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Pattern */}
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.1 }}>
                    <ShieldCheck size={260} />
                </div>

                {/* Round Profile Avatar */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{
                        width: '130px',
                        height: '130px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        padding: '5px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'linear-gradient(45deg, #3b82f6, #60a5fa)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '42px',
                            fontWeight: 'bold',
                            color: 'white'
                        }}>
                            {getInitials(user?.name)}
                        </div>
                    </div>
                    {/* Verified Badge */}
                    <div style={{
                        position: 'absolute',
                        bottom: '25px',
                        right: '5px',
                        background: '#10b981',
                        border: '3px solid white',
                        borderRadius: '50%',
                        padding: '4px',
                        display: 'flex'
                    }}>
                        <CheckCircle2 size={18} color="white" fill="#10b981" />
                    </div>
                </div>

                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 5px' }}>{user?.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', color: '#bfdbfe' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                        <MapPin size={14} /> {user?.city}
                    </span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#60a5fa' }}></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                        <Briefcase size={14} /> {user?.platform}
                    </span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#60a5fa' }}></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                        <Star size={14} fill="#fbbf24" color="#fbbf24" style={{ marginTop: '-2px' }} /> {user?.rating || '4.8'} Reputation
                    </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '6px 12px' }}>
                        ID: {user?.platformId || 'UNASSIGNED'}
                    </span>
                    <span className="badge" style={{ background: '#fbbf24', color: '#92400e', border: 'none', padding: '6px 12px', fontWeight: 'bold' }}>
                        {user?.role?.toUpperCase() || 'USER'}
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px' }}>
                {/* Left Column: Editable Form */}
                <div>
                    <form onSubmit={handleSubmit} className="card" style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                                <Award size={20} color="var(--primary)" /> Secure Identity Details
                            </h3>
                            <button className="btn btn-primary" type="submit" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                                <Save size={16} /> Save Changes
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem', color: '#64748b' }}>Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                                    <input className="modal-input" style={{ paddingLeft: '40px', margin: 0, textAlign: 'left' }} name="name" value={form.name} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem', color: '#64748b' }}>Platform Provider</label>
                                <select className="modal-input" style={{ margin: 0, textAlign: 'left' }} name="platform" value={form.platform} onChange={handleChange}>
                                    <option value="Zomato">Zomato</option>
                                    <option value="Swiggy">Swiggy</option>
                                    <option value="Blinkit">Blinkit</option>
                                    <option value="Zepto">Zepto</option>
                                    <option value="Amazon">Amazon</option>
                                    <option value="Uber">Uber</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem', color: '#64748b' }}>Operational Hub (City)</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                                    <select className="modal-input" style={{ paddingLeft: '40px', margin: 0, textAlign: 'left' }} name="city" value={form.city} onChange={handleChange}>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Bangalore">Bangalore</option>
                                        <option value="Chennai">Chennai</option>
                                        <option value="Hyderabad">Hyderabad</option>
                                        <option value="Pune">Pune</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem', color: '#64748b' }}>Rider Platform ID</label>
                                <div style={{ position: 'relative' }}>
                                    <Activity size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                                    <input className="modal-input" style={{ paddingLeft: '40px', margin: 0, textAlign: 'left' }} name="platformId" value={form.platformId} onChange={handleChange} placeholder="e.g. ZM-10293" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem', color: '#64748b' }}>Avg. Weekly Income (₹)</label>
                                <div style={{ position: 'relative' }}>
                                    <IndianRupee size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                                    <input className="modal-input" style={{ paddingLeft: '40px', margin: 0, textAlign: 'left' }} type="number" name="averageWeeklyIncome" value={form.averageWeeklyIncome} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem', color: '#64748b' }}>Payout UPI ID</label>
                                <div style={{ position: 'relative' }}>
                                    <CreditCard size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                                    <input className="modal-input" style={{ paddingLeft: '40px', margin: 0, textAlign: 'left' }} name="upiId" value={form.upiId} onChange={handleChange} placeholder="9988776655@paytm" />
                                </div>
                            </div>
                        </div>
                    </form>

                    <div className="card" style={{ marginTop: '30px', padding: '30px', background: '#f8fafc' }}>
                        <h4 style={{ marginBottom: '15px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Mail size={18} color="var(--primary)" /> Communication Preferences
                        </h4>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                            Registered Email: <strong>{user?.email}</strong>
                        </p>
                        <div style={{ padding: '15px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ background: '#3b82f6', borderRadius: '50%', pading: '8px', display: 'flex', width: '32px', height: '32px', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle2 size={16} color="white" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: '#1e40af', fontSize: '0.9rem' }}>Email Verified</div>
                                <div style={{ fontSize: '0.8rem', color: '#60a5fa' }}>You are receiving claim alerts and OTPs.</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Performance & Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    {/* Coverage Stats */}
                    <div className="card" style={{ padding: '25px', background: 'var(--dark)', color: 'white' }}>
                        <h4 style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>Platform Metrics</h4>

                        <div style={{ display: 'grid', gap: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Total Claims</span>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{stats.totalClaims}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Approved</span>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#10b981' }}>{stats.approvedClaims}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Total Payouts</span>
                                <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>₹{stats.totalPayout}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '10px', height: '10px', borderRadius: '50%', background: '#10b981'
                                }}></div>
                                <span style={{ fontSize: '0.85rem' }}>Account Status: <strong>EXCELLENT</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Social Hub */}
                    <div className="card" style={{ padding: '25px' }}>
                        <h4 style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '20px' }}>Reputation Hub</h4>

                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                            <div style={{ flex: 1, padding: '15px', background: '#fffbeb', borderRadius: '12px', textAlign: 'center', border: '1px solid #fef3c7' }}>
                                <Star size={20} fill="#f59e0b" color="#f59e0b" style={{ margin: '0 auto 8px' }} />
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#92400e' }}>{user?.rating || '4.8'}</div>
                                <div style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 600 }}>RATING</div>
                            </div>
                            <div style={{ flex: 1, padding: '15px', background: '#f0fdf4', borderRadius: '12px', textAlign: 'center', border: '1px solid #dcfce7' }}>
                                <MessageSquare size={20} color="#10b981" style={{ margin: '0 auto 8px' }} />
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534' }}>{user?.feedbackCount || '12'}</div>
                                <div style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: 600 }}>FEEDBACK</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 15px', borderRadius: '10px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <AlertCircle size={14} color="#f43f5e" /> Complaints
                            </span>
                            <span style={{ fontWeight: 700, color: '#f43f5e' }}>0</span>
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="card" style={{
                        padding: '25px',
                        background: '#1e293b',
                        color: 'white',
                        background: 'linear-gradient(to bottom, #1e293b, #0f172a)'
                    }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Premium Support</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '20px' }}>Elite & Pro riders get 24/7 priority assistance.</p>
                        <a
                            href="https://mail.google.com/mail/?view=cm&fs=1&to=softgridtechnologies@gmail.com&su=Priority Support&body=Rider ID: "
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ width: '100%', fontSize: '0.85rem', textDecoration: 'none', textAlign: 'center', background: '#3b82f6' }}
                        >
                            Open Support Ticket
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
