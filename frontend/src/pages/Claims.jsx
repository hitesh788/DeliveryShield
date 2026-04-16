import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShieldCheck, ShieldAlert, History } from 'lucide-react';
import './Claims.css';

const API_URL = 'http://localhost:5000/api';

const Claims = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');

    // 🔹 Fetch Claims
    const fetchClaims = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/claim`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClaims(res.data);
        } catch (err) {
            console.error("Fetch claims error:", err);
            toast.error("Failed to load claims history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, []);

    // 🔥 CLAIM FUNCTION
    const handleClaim = async (type) => {
        const toastId = toast.loading(`Triggering ${type} claim...`);
        try {
            let lat = null;
            let lon = null;

            if (navigator.geolocation) {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                }).catch(() => null);

                if (pos) {
                    lat = pos.coords.latitude;
                    lon = pos.coords.longitude;
                }
            }

            const res = await axios.post(
                `${API_URL}/claim/auto-trigger`,
                { disruptionType: type, lat, lon },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast.update(toastId, { render: res.data.message, type: "success", isLoading: false, autoClose: 3000 });
            fetchClaims();
        } catch (err) {
            const reason = err.response?.data?.reason || "Check disruption conditions";
            toast.update(toastId, { render: `❌ Claim Rejected: ${reason}`, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    return (
        <div className="claims-container">
            <div className="dashboard-header" style={{ marginBottom: '20px' }}>
                <div className="welcome-text">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <History color="var(--primary)" /> Claims Dashboard
                    </h2>
                    <p>Trigger claims and view AI-processed payout history</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '15px', color: 'var(--dark)' }}>Quick Claim Triggers</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="btn btn-warning" onClick={() => handleClaim("Heavy Rain")}>
                        🌧 Heavy Rain
                    </button>
                    <button className="btn btn-danger" onClick={() => handleClaim("Extreme Heat")}>
                        🌡 Extreme Heat
                    </button>
                    <button className="btn btn-dark" onClick={() => handleClaim("Pollution")}>
                        🌫 Pollution
                    </button>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '15px', color: 'var(--dark)' }}>Claim History</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="claims-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Event</th>
                                <th>Payout</th>
                                <th>Status</th>
                                <th>Fraud Check</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>
                                        <div className="loading-spinner"></div> Loading your history...
                                    </td>
                                </tr>
                            ) : claims.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                                        <div style={{ opacity: 0.6 }}>
                                            <ShieldCheck size={48} style={{ marginBottom: '10px' }} />
                                            <p style={{ fontWeight: 600 }}>No claims history found.</p>
                                            <p style={{ fontSize: '0.9rem' }}>Trigger an event above to start your first claim.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                claims.map((claim) => (
                                    <tr key={claim._id}>
                                        <td>{new Date(claim.dateOfDisruption).toLocaleDateString()}</td>
                                        <td><b>{claim.disruptionType}</b></td>
                                        <td style={{ fontWeight: 'bold', color: claim.amountPayout > 0 ? 'var(--success)' : 'var(--text-light)' }}>
                                            ₹{claim.amountPayout}
                                        </td>
                                        <td>
                                            <span className={`badge ${claim.status}`}>
                                                {claim.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            {claim.isFraudulent ? (
                                                <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <ShieldAlert size={14} /> REJECTED ({claim.fraudScore}%)
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <ShieldCheck size={14} /> OK ({claim.fraudScore}%)
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '13px', color: claim.rejectionReason ? 'var(--danger)' : 'var(--text-light)' }}>
                                                {claim.rejectionReason || "Claim processed successfully"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


export default Claims;
