import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ShieldAlert, CloudRain, ThermometerSun, Wind, Banknote } from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000/api';

const Dashboard = () => {
    const [policy, setPolicy] = useState(null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(localStorage.getItem('userPlan') || 'BASIC PLAN');
    const [upiId, setUpiId] = useState('');
    const [payoutAmount, setPayoutAmount] = useState('');

    useEffect(() => {
        fetchPolicy();
        refreshUserData();
    }, []);

    const refreshUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
            console.log('Error fetching user', err);
        }
    };

    const fetchPolicy = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/policy/active`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPolicy(res.data);
        } catch (err) {
            console.log('Error fetching policy', err);
        }
    };

    const triggerMockClaim = async (type) => {
        const toastId = toast.loading("Acquiring live GPS coordinates & passing to satellite...");
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

            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/claim/auto-trigger`, { disruptionType: type, lat, lon }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.update(toastId, { render: res.data.message, type: "success", isLoading: false, autoClose: 5000 });
            refreshUserData();
        } catch (err) {
            toast.update(toastId, { render: err.response?.data?.message || err.response?.data?.error || 'Claim rejected dynamically', type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    const handleWithdraw = async () => {
        try {
            const token = localStorage.getItem('token');
            const payout = parseFloat(payoutAmount);

            if (!upiId.includes('@')) {
                toast.warning('Please enter a valid UPI ID');
                return;
            }

            if (payout <= 0 || payout > user.walletBalance) {
                toast.warning('Invalid payout amount');
                return;
            }

            const res = await axios.post(`${API_URL}/auth/withdraw`, { upiId, amount: payout }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.info(`RazorpayX Transfer Successful: ₹${res.data.amount} sent to ${res.data.upiId}`);
            setShowPayoutModal(false);
            refreshUserData();
            setUpiId('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Withdrawal failed');
        }
    }

    const handleUpgrade = (planName) => {
        setCurrentPlan(planName);
        localStorage.setItem('userPlan', planName);
        let color = planName === 'PRO LEVEL' ? '#3B82F6' : '#10B981';
        toast.success(`Successfully Upgraded to ${planName} via Simulated Razorpay Subscriptions.`);
        setShowUpgradeModal(false);
    };

    return (
        <div>
            <div className="dashboard-header">
                <div className="welcome-text">
                    <h2>Welcome back, {user?.name}</h2>
                    <p>Monitor your active coverage and wallet payouts</p>
                </div>
            </div>

            <div className="overview-cards">
                <div className="stat-card wallet">
                    <div className="stat-title">Wallet</div>
                    <div className="stat-value">₹{user?.walletBalance || 0}</div>
                    <div className="stat-action">
                        <button
                            className="btn btn-dark"
                            style={{ background: 'rgba(0,0,0,0.3)', width: '100%' }}
                            onClick={() => {
                                setPayoutAmount(user?.walletBalance);
                                setShowPayoutModal(true);
                            }}
                        >
                            <Banknote size={16} /> Withdraw Funds
                        </button>
                    </div>
                </div>

                <div className="stat-card policy">
                    <div className="stat-title">Weekly Income Covered</div>
                    <div className="stat-value" style={{ color: 'var(--primary)' }}>
                        {policy ? `₹${policy.incomeCovered}` : '₹0'}
                    </div>
                    <div className="stat-action">
                        <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Max guaranteed payout per week</span>
                    </div>
                </div>

                <div className="stat-card policy">
                    <div className="stat-title">Current Policy Status</div>
                    <div className="stat-value" style={{ fontSize: '1.8rem', marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {policy ? (
                            <>
                                <span className="badge active">🛡️ ACTIVE</span>
                                <span className="badge" style={{
                                    background: currentPlan === 'BASIC PLAN' ? '#FDE68A' : currentPlan === 'PRO LEVEL' ? '#DBEAFE' : '#D1FAE5',
                                    color: currentPlan === 'BASIC PLAN' ? '#92400E' : currentPlan === 'PRO LEVEL' ? '#1E40AF' : '#065F46',
                                    border: 'none',
                                    fontWeight: 'bold'
                                }}>
                                    {currentPlan}
                                </span>
                            </>
                        ) : <span className="badge rejected">NO POLICY</span>}
                    </div>
                    <div className="stat-action" style={{ display: 'flex', gap: '10px' }}>
                        {!policy && <Link to="/buy-policy" className="btn btn-primary" style={{ flex: 1 }}>Buy Policy</Link>}
                        {policy && (
                            <button onClick={() => setShowUpgradeModal(true)} className="btn btn-warning" style={{ flex: 1, boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.4)' }}>
                                Upgrade Plan 🚀
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '30px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--dark)' }}>
                    <ShieldAlert color="var(--warning)" /> Auto-Claim Simulator (Demo)
                </h3>
                <p style={{ marginBottom: '20px', color: 'var(--text-light)' }}>
                    Trigger automated API signals representing external parametric triggers. The AI risk engine will instantly process and credit your wallet.
                </p>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <button onClick={() => triggerMockClaim('Heavy Rain')} className="btn btn-warning" style={{ flex: 1 }}>
                        <CloudRain size={18} /> Heavy Rain Warning
                    </button>
                    <button onClick={() => triggerMockClaim('Extreme Heat')} className="btn btn-danger" style={{ flex: 1 }}>
                        <ThermometerSun size={18} /> Extreme Heat Alert
                    </button>
                    <button onClick={() => triggerMockClaim('Pollution')} className="btn btn-dark" style={{ flex: 1 }}>
                        <Wind size={18} /> High AQI Alert
                    </button>
                </div>
            </div>

            {showPayoutModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">RazorpayX Payout</h3>
                        <p style={{ color: 'var(--text-light)', marginBottom: '10px' }}>Instant withdrawal using UPI</p>

                        <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '5px', color: 'var(--dark)' }}>Enter UPI ID</label>
                            <input
                                type="text"
                                value={upiId}
                                onChange={e => setUpiId(e.target.value)}
                                className="modal-input"
                                style={{ margin: 0 }}
                                placeholder="e.g. 9876543210@paytm"
                            />
                        </div>

                        <div style={{ textAlign: 'left', marginBottom: '25px' }}>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '5px', color: 'var(--dark)' }}>Amount (₹)</label>
                            <input
                                type="number"
                                value={payoutAmount}
                                onChange={e => setPayoutAmount(e.target.value)}
                                className="modal-input"
                                style={{ margin: 0 }}
                                max={user?.walletBalance}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-logout" onClick={() => setShowPayoutModal(false)}>Cancel</button>
                            <button className="btn btn-success" onClick={handleWithdraw}>
                                ⚡ Transfer to Bank
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUpgradeModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px' }}>
                        <h3 className="modal-title" style={{ fontSize: '2rem' }}>Upgrade Your Protection Layer</h3>
                        <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>Select an enterprise-tier policy matrix to cover wider disruption margins.</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'left', marginBottom: '30px' }}>
                            <div className="card" style={{ border: '2px solid #E2E8F0', padding: '20px' }}>
                                <h4 style={{ color: 'var(--text-light)', textTransform: 'uppercase' }}>Beta Plan</h4>
                                <h2 style={{ margin: '10px 0', color: 'var(--dark)' }}>₹45 <span style={{ fontSize: '1rem', color: 'gray' }}>/week</span></h2>
                                <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                    <li style={{ marginBottom: '8px' }}>✅ Rain & Extreme Heat</li>
                                    <li style={{ marginBottom: '8px' }}>✅ High AQI (+4) Coverage</li>
                                    <li style={{ marginBottom: '8px' }}>❌ Geofencing Protection</li>
                                    <li style={{ marginBottom: '8px' }}>❌ Priority Withdrawals</li>
                                </ul>
                                <button className={currentPlan === 'BETA PLAN' ? "btn btn-logout" : "btn btn-primary"} style={{ width: '100%' }} onClick={() => handleUpgrade('BETA PLAN')}>{currentPlan === 'BETA PLAN' ? 'Current Plan' : 'Select Beta'}</button>
                            </div>

                            <div className="card" style={{ border: '2px solid var(--primary)', padding: '20px', boxShadow: '0 10px 15px -3px rgba(30, 58, 138, 0.2)', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: -10, right: 10, background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>RECOMMENDED</div>
                                <h4 style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>Pro Level</h4>
                                <h2 style={{ margin: '10px 0', color: 'var(--dark)' }}>₹95 <span style={{ fontSize: '1rem', color: 'gray' }}>/week</span></h2>
                                <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                    <li style={{ marginBottom: '8px' }}>✅ 100% Parameter Guarantee</li>
                                    <li style={{ marginBottom: '8px' }}>✅ Severe Waterlogging Compensation</li>
                                    <li style={{ marginBottom: '8px' }}>✅ Instant UPI Escrow Transfer</li>
                                    <li style={{ marginBottom: '8px' }}>❌ Extended Traffic Gridlock Coverage</li>
                                </ul>
                                <button className={currentPlan === 'PRO LEVEL' ? "btn btn-logout" : "btn btn-primary"} style={{ width: '100%' }} onClick={() => handleUpgrade('PRO LEVEL')}>{currentPlan === 'PRO LEVEL' ? 'Current Plan' : 'Select Pro'}</button>
                            </div>

                            <div className="card" style={{ border: '2px solid #0F172A', padding: '20px', background: '#0F172A', color: 'white' }}>
                                <h4 style={{ color: '#94A3B8', textTransform: 'uppercase' }}>Elite Corp</h4>
                                <h2 style={{ margin: '10px 0', color: 'white' }}>₹150 <span style={{ fontSize: '1rem', color: '#94A3B8' }}>/week</span></h2>
                                <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', fontSize: '0.9rem', color: '#CBD5E1' }}>
                                    <li style={{ marginBottom: '8px' }}>✅ Unlimited Auto-Claims</li>
                                    <li style={{ marginBottom: '8px' }}>✅ 0% Fraud Delay Buffers</li>
                                    <li style={{ marginBottom: '8px' }}>✅ Dedicated Fleet API Keys</li>
                                    <li style={{ marginBottom: '8px' }}>✅ Extended Traffic Gridlock Coverage</li>
                                </ul>
                                <button className={currentPlan === 'ELITE CORP' ? "btn btn-logout" : "btn btn-success"} style={{ width: '100%' }} onClick={() => handleUpgrade('ELITE CORP')}>{currentPlan === 'ELITE CORP' ? 'Current Plan' : 'Subscribe to Elite'}</button>
                            </div>
                        </div>

                        <button className="btn btn-logout" onClick={() => setShowUpgradeModal(false)}>Close Window</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
