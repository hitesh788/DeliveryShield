import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShieldCheck, ShieldAlert, History } from 'lucide-react';
import './Claims.css';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const Claims = () => {
const [claims, setClaims] = useState([]);

const token = localStorage.getItem('token');

// 🔹 Fetch Claims
const fetchClaims = async () => {
    try {
        const res = await axios.get(`${API_URL}/claim`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setClaims(res.data);
    } catch {
        toast.error("Failed to load claims history");
    }
};

useEffect(() => {
    fetchClaims();
}, []);

// 🔥 CLAIM FUNCTION (IMPORTANT)
const handleClaim = async (type) => {
    try {
        const res = await axios.post(
            `${API_URL}/claim/auto-trigger`,
            { disruptionType: type },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        toast.success(res.data.message);

        // Refresh claims after success
        fetchClaims();

    } catch (err) {
        console.log("ERROR:", err.response?.data);

        const msg = err.response?.data?.message || "Claim failed";
        const reason = err.response?.data?.reason || "";

        toast.error(`${msg} - ${reason}`);
    }
};

return (
    <div className="claims-container">

        {/* HEADER */}
        <div className="dashboard-header" style={{ marginBottom: '20px' }}>
            <div className="welcome-text">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <History color="var(--primary)" /> Claims Dashboard
                </h2>
                <p>Trigger claims and view AI-processed payout history</p>
            </div>
        </div>

        {/* 🔥 CLAIM BUTTONS */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button onClick={() => handleClaim("Heavy Rain")}>
                🌧 Claim Rain
            </button>

            <button onClick={() => handleClaim("Extreme Heat")}>
                🌡 Claim Heat
            </button>

            <button onClick={() => handleClaim("Pollution")}>
                🌫 Claim Pollution
            </button>
        </div>

        {/* CLAIM HISTORY */}
        <div className="card">
            {claims.length === 0 ? (
                <p style={{ textAlign: 'center' }}>No claims history found.</p>
            ) : (
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
                            {claims.map((claim) => (
                                <tr key={claim._id}>

                                    <td>
                                        {new Date(claim.dateOfDisruption).toLocaleDateString()}
                                    </td>

                                    <td>
                                        <b>{claim.disruptionType}</b>
                                    </td>

                                    <td style={{ fontWeight: 'bold', color: 'green' }}>
                                        ₹{claim.amountPayout}
                                    </td>

                                    <td>
                                        <span className={`badge ${claim.status}`}>
                                            {claim.status.toUpperCase()}
                                        </span>
                                    </td>

                                    <td>
                                        {claim.isFraudulent ? (
                                            <span style={{ color: 'red' }}>
                                                <ShieldAlert size={14} /> REJECTED ({claim.fraudScore}%)
                                            </span>
                                        ) : (
                                            <span style={{ color: 'green' }}>
                                                <ShieldCheck size={14} /> OK ({claim.fraudScore})
                                            </span>
                                        )}
                                    </td>

                                    <td>
                                        {/* 🔥 SHOW REJECTION REASON */}
                                        {claim.rejectionReason ? (
                                            <span style={{ color: 'red', fontSize: '12px' }}>
                                                {claim.rejectionReason}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'gray' }}>
                                                Claim processed successfully
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
