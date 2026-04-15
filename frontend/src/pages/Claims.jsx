import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShieldCheck, ShieldAlert, History } from 'lucide-react';
import './Claims.css';

const API_URL = 'http://localhost:5000/api';

const Claims = () => {
    const [claims, setClaims] = useState([]);

    useEffect(() => {
        const fetchClaims = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/claim`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClaims(res.data);
            } catch (err) {
                toast.error("Failed to load claims history");
            }
        };
        fetchClaims();
    }, []);

    return (
        <div className="claims-container">
            <div className="dashboard-header" style={{ marginBottom: '20px' }}>
                <div className="welcome-text">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><History color="var(--primary)" /> My Payout History</h2>
                    <p>Review all automated claims triggers processed by the AI Risk Engine</p>
                </div>
            </div>

            <div className="card">
                {claims.length === 0 ? <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>No claims history found.</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="claims-table">
                            <thead>
                                <tr>
                                    <th>Date Recorded</th>
                                    <th>Trigger Event</th>
                                    <th>Payout Amount</th>
                                    <th>System Status</th>
                                    <th>AI Fraud Check</th>
                                </tr>
                            </thead>
                            <tbody>
                                {claims.map((claim) => (
                                    <tr key={claim._id}>
                                        <td>
                                            <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                                                {new Date(claim.dateOfDisruption).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td><span style={{ fontWeight: 'bold', color: 'var(--dark)' }}>{claim.disruptionType}</span></td>
                                        <td><span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹{claim.amountPayout}</span></td>
                                        <td>
                                            <span className={`badge ${claim.status}`}>{claim.status.toUpperCase()}</span>
                                        </td>
                                        <td>
                                            {claim.isFraudulent ? (
                                                <span className="text-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <ShieldAlert size={14} /> FLAGGED / {claim.fraudScore}% FALSE
                                                </span>
                                            ) : (
                                                <span className="text-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <ShieldCheck size={14} /> PASSED ({claim.fraudScore} risk)
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Claims;
