import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart3, ShieldAlert } from 'lucide-react';
import API_URL from '../config';
import './Claims.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
                setStats(res.data);
            } catch (err) {
                toast.error('Failed to load admin dashboard');
            }
        };
        loadStats();
    }, []);

    if (!stats) return <p>Loading admin dashboard...</p>;

    return (
        <div className="claims-container">
            <div className="dashboard-header" style={{ marginBottom: '20px' }}>
                <div className="welcome-text">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart3 color="var(--primary)" /> Admin Operations</h2>
                    <p>Monitor policies, payouts, fraud signals, and city-level risk for demo review.</p>
                </div>
            </div>

            <div className="overview-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card policy"><div className="stat-title">Users</div><div className="stat-value">{stats.totalUsers}</div></div>
                <div className="stat-card policy"><div className="stat-title">Active Policies</div><div className="stat-value">{stats.activePolicies}</div></div>
                <div className="stat-card policy"><div className="stat-title">Claims</div><div className="stat-value">{stats.totalClaims}</div></div>
                <div className="stat-card policy"><div className="stat-title">Fraud Flags</div><div className="stat-value">{stats.rejectedClaims}</div></div>
            </div>

            <div className="overview-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="card">
                    <h3>City Risk Heatmap</h3>
                    <table className="claims-table">
                        <thead><tr><th>City</th><th>Workers</th><th>Avg Income</th></tr></thead>
                        <tbody>
                            {stats.cityRisk.map(city => (
                                <tr key={city._id}>
                                    <td>{city._id}</td>
                                    <td>{city.users}</td>
                                    <td>₹{Math.round(city.avgIncome || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card">
                    <h3 style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><ShieldAlert color="var(--warning)" /> Recent Claim Review</h3>
                    <table className="claims-table">
                        <thead><tr><th>Worker</th><th>City</th><th>Status</th><th>Amount</th></tr></thead>
                        <tbody>
                            {stats.recentClaims.map(claim => (
                                <tr key={claim._id}>
                                    <td>{claim.user?.name || 'Unknown'}</td>
                                    <td>{claim.user?.city || 'N/A'}</td>
                                    <td><span className={`badge ${claim.status}`}>{claim.status}</span></td>
                                    <td>₹{claim.amountPayout}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
