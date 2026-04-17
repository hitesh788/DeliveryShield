import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ShieldAlert, CloudRain, ThermometerSun, Wind, Banknote, Info, RefreshCw, Sun, Cloud, Droplets, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import API_URL from '../config';
import './Claims.css';
import './Dashboard.css';
const PLAN_PRICES = {
    'BETA PLAN': 45,
    'PRO LEVEL': 95,
    'ELITE CORP': 150
};

const Dashboard = () => {
    const [policy, setPolicy] = useState(null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [currentPlan, setCurrentPlan] = useState(localStorage.getItem('userPlan') || 'BASIC PLAN');
    const [quote, setQuote] = useState(null);
    const [upiId, setUpiId] = useState('');
    const [payoutAmount, setPayoutAmount] = useState('');
    const [topUpAmount, setTopUpAmount] = useState('');
    const [stats, setStats] = useState({ totalClaims: 0, approvedClaims: 0, totalPayout: 0 });

    useEffect(() => {
        fetchPolicy();
        fetchQuote();
        refreshUserData();
        fetchStats();
    }, []);

    const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

    const refreshUserData = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/me`, { headers: authHeaders() });
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            if (res.data.currentPlan) {
                setCurrentPlan(res.data.currentPlan);
                localStorage.setItem('userPlan', res.data.currentPlan);
                window.dispatchEvent(new Event('planChanged'));
            }
        } catch (err) {
            console.log('Error fetching user', err);
        }
    };

    const fetchPolicy = async () => {
        try {
            const res = await axios.get(`${API_URL}/policy/active`, {
                headers: authHeaders()
            });
            setPolicy(res.data);
        } catch (err) {
            console.log('Error fetching policy', err);
        }
    };

    const fetchQuote = async () => {
        try {
            const res = await axios.get(`${API_URL}/policy/quote`, { headers: authHeaders() });
            setQuote(res.data);
        } catch (err) {
            console.log('Error fetching quote', err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_URL}/claim`, { headers: authHeaders() });
            const approved = res.data.filter(c => c.status === 'approved' || c.status === 'auto-approved');
            setStats({
                totalClaims: res.data.length,
                approvedClaims: approved.length,
                totalPayout: approved.reduce((sum, c) => sum + c.amountPayout, 0)
            });
        } catch (err) {
            console.log('Error fetching stats', err);
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

            const res = await axios.post(`${API_URL}/claim/auto-trigger`, { disruptionType: type, lat, lon }, {
                headers: authHeaders()
            });
            toast.update(toastId, { render: res.data.message, type: "success", isLoading: false, autoClose: 5000 });
            refreshUserData();
            fetchStats();
        } catch (err) {
            const reason = err.response?.data?.reason || err.response?.data?.message || err.response?.data?.error || 'Claim rejected dynamically';
            toast.update(toastId, { render: `❌ Claim Rejected: ${reason}`, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    const handleWithdraw = async () => {
        try {
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
                headers: authHeaders()
            });

            toast.info(`RazorpayX Transfer Successful: ₹${res.data.amount} sent to ${res.data.upiId}`);
            setShowPayoutModal(false);
            refreshUserData();
            setUpiId('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Withdrawal failed');
        }
    }

    const handleTopUp = async () => {
        try {
            const amount = Number(topUpAmount);
            if (!amount || amount <= 0) {
                toast.warning('Enter a valid top-up amount');
                return;
            }

            const res = await axios.post(`${API_URL}/auth/wallet/topup`, { amount }, { headers: authHeaders() });
            const updatedUser = { ...user, walletBalance: res.data.walletBalance };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            toast.success(res.data.message);
            setShowTopUpModal(false);
            setTopUpAmount('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Wallet top-up failed');
        }
    };

    const toggleAutoRenew = async () => {
        try {
            const res = await axios.post(`${API_URL}/policy/auto-renew`, { enabled: !user?.autoRenew }, { headers: authHeaders() });
            const updatedUser = { ...user, autoRenew: res.data.autoRenew };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            toast.success(res.data.message);
            fetchPolicy();
        } catch (err) {
            toast.error('Auto-renew update failed');
        }
    };

    const handleUpgrade = (planName) => {
        if (currentPlan === planName) {
            toast.info(`You are already on the ${planName}`);
            return;
        }
        setSelectedPlan(planName);
        // Scroll to payment section
        setTimeout(() => {
            document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handlePlanPayment = async (paymentMethod) => {
        if (!selectedPlan) return;

        try {
            const res = await axios.post(`${API_URL}/policy/change-plan`, {
                planName: selectedPlan,
                paymentMethod
            }, {
                headers: authHeaders()
            });

            const updatedUser = {
                ...user,
                walletBalance: res.data.walletBalance,
                currentPlan: res.data.currentPlan
            };

            setUser(updatedUser);
            setCurrentPlan(res.data.currentPlan);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('userPlan', res.data.currentPlan);
            window.dispatchEvent(new Event('planChanged'));

            toast.success(res.data.message);
            setSelectedPlan(null);
            setShowUpgradeModal(false);
            fetchPolicy();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Plan change failed');
        }
    };

    return (
        <div>
            <div className="dashboard-header">
                <div className="welcome-text">
                    <h2>Welcome back, {user?.name}</h2>
                    <p>Monitor your active coverage and wallet payouts</p>
                </div>
            </div>

            {quote && (
                <div className="card" style={{ marginBottom: '20px', padding: '18px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Info size={18} /> Smart Protection Insights</h3>
                    <p style={{ color: 'var(--text-light)', marginBottom: '10px' }}>Recommended plan: <strong>{quote.recommendedPlan}</strong></p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {quote.explanation?.map(item => <span key={item} className="badge pending">{item}</span>)}
                        {quote.predictiveAlerts?.map(item => <span key={item} className="badge active">{item}</span>)}
                    </div>
                </div>
            )}

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
                        <button
                            className="btn btn-success"
                            style={{ background: 'rgba(255,255,255,0.25)', width: '100%', marginTop: '10px' }}
                            onClick={() => setShowTopUpModal(true)}
                        >
                            Add Money
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
                    <div className="stat-action" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {!policy && <Link to="/buy-policy" className="btn btn-primary" style={{ flex: 1 }}>Buy Policy</Link>}
                        {policy && (
                            <button onClick={() => setShowUpgradeModal(true)} className="btn btn-warning" style={{ flex: 1, boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.4)' }}>
                                Upgrade Plan 🚀
                            </button>
                        )}
                        {policy && <button onClick={() => setShowPolicyModal(true)} className="btn btn-primary" style={{ flex: 1 }}><Info size={16} /> Details</button>}
                        {policy && <button onClick={toggleAutoRenew} className="btn btn-dark" style={{ flex: 1 }}><RefreshCw size={16} /> {user?.autoRenew ? 'Auto Renew On' : 'Auto Renew Off'}</button>}
                    </div>
                </div>

                <div className="stat-card" style={{ background: '#F8FAFC', color: 'var(--text)', border: '1px solid #E2E8F0' }}>
                    <div className="stat-title" style={{ color: 'var(--text-light)' }}>Platform Analytics</div>
                    <div style={{ marginTop: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Total Claims</span>
                            <span style={{ fontWeight: 700 }}>{stats.totalClaims}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Approved</span>
                            <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{stats.approvedClaims}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Total Payouts</span>
                            <span style={{ fontWeight: 700 }}>₹{stats.totalPayout}</span>
                        </div>
                    </div>
                    <div className="stat-action" style={{ marginTop: '20px' }}>
                        <Link to="/claims" className="btn btn-outline" style={{ width: '100%', fontSize: '0.8rem', border: '1px solid #CBD5E1' }}>View Full History</Link>
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

            {showTopUpModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">Wallet Top-Up</h3>
                        <p style={{ color: 'var(--text-light)', marginBottom: '15px' }}>Add money using simulated Razorpay checkout</p>
                        <input
                            type="number"
                            value={topUpAmount}
                            onChange={e => setTopUpAmount(e.target.value)}
                            className="modal-input"
                            placeholder="Amount"
                        />
                        <div className="modal-actions">
                            <button className="btn btn-logout" onClick={() => setShowTopUpModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleTopUp}>Pay with Razorpay</button>
                        </div>
                    </div>
                </div>
            )}

            {showPolicyModal && policy && (
                <div className="modal-overlay">
                    <div className="modal-content policy-modal" style={{ maxWidth: '800px', textAlign: 'left', padding: '30px' }}>
                        <h3 className="modal-title" style={{ color: '#fff', marginBottom: '25px', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <ShieldAlert size={28} color="#60a5fa" /> Active Policy Details
                        </h3>
                        <div className="policy-modal-hero">
                            <div>
                                <p className="policy-modal-eyebrow">Current Protection Level</p>
                                <h4>{policy.planName || currentPlan}</h4>
                                <span>
                                    Coverage Window: {new Date(policy.startDate).toLocaleDateString('en-IN')} to {new Date(policy.endDate).toLocaleDateString('en-IN')}
                                </span>
                            </div>
                            <div className={`policy-status-chip ${policy.autoRenew ? 'enabled' : 'disabled'}`}>
                                Auto-renew {policy.autoRenew ? 'Enabled' : 'Disabled'}
                            </div>
                        </div>

                        <div className="policy-details-grid">
                            <div className="policy-detail-card accent-blue">
                                <span>Start Date</span>
                                <strong>{new Date(policy.startDate).toLocaleDateString('en-IN')}</strong>
                            </div>
                            <div className="policy-detail-card accent-violet">
                                <span>End Date</span>
                                <strong>{new Date(policy.endDate).toLocaleDateString('en-IN')}</strong>
                            </div>
                            <div className="policy-detail-card accent-green">
                                <span>Weekly Premium</span>
                                <strong>₹{policy.weeklyPremium}</strong>
                            </div>
                            <div className="policy-detail-card accent-gold">
                                <span>Income Covered</span>
                                <strong>₹{policy.incomeCovered}</strong>
                            </div>
                            <div className="policy-detail-card accent-slate">
                                <span>Risk Factor</span>
                                <strong>{policy.riskFactor}x</strong>
                            </div>
                            <div className="policy-detail-card accent-emerald">
                                <span>Plan Name</span>
                                <strong>{policy.planName || currentPlan}</strong>
                            </div>
                        </div>

                        <div className="policy-disruptions-panel">
                            <div className="policy-disruptions-header">
                                <span>Covered Disruptions</span>
                                <strong>{(policy.coveredDisruptions || []).length || 1} Protections Active</strong>
                            </div>
                            <div className="policy-disruptions-list">
                                {((policy.coveredDisruptions && policy.coveredDisruptions.length > 0)
                                    ? policy.coveredDisruptions
                                    : ['Standard Coverage']
                                ).map((item) => (
                                    <span key={item} className="policy-disruption-badge">
                                        {item === 'Heavy Rain' && <CloudRain size={16} color="#60a5fa" />}
                                        {item === 'Extreme Heat' && <ThermometerSun size={16} color="#fca5a5" />}
                                        {item === 'Pollution' && <Wind size={16} color="#cbd5e1" />}
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button className="btn btn-outline" style={{ marginTop: '25px', width: '100%', borderColor: 'rgba(255,255,255,0.2)', color: 'white', background: 'rgba(255,255,255,0.05)', fontSize: '1rem', padding: '12px' }} onClick={() => setShowPolicyModal(false)}>Close Overview</button>
                    </div>
                </div>
            )}

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
                    <div className="modal-content modal-lg">
                        <h3 className="modal-title" style={{ fontSize: '2rem' }}>Upgrade Your Protection Layer</h3>
                        <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>Select an enterprise-tier policy matrix to cover wider disruption margins.</p>

                        <div className="plan-grid">
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

                        {quote?.plans && (
                            <div className="card" style={{ padding: '18px', marginBottom: '20px', textAlign: 'left' }}>
                                <h4 style={{ marginBottom: '10px' }}>Plan Comparison</h4>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="claims-table" style={{ marginTop: 0 }}>
                                        <thead>
                                            <tr><th>Plan</th><th>Price</th><th>Payout Speed</th><th>Claim Limit</th><th>Coverage</th></tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(quote.plans).map(([name, plan]) => (
                                                <tr key={name}>
                                                    <td>{name} {quote.recommendedPlan === name && <span className="badge active">Recommended</span>}</td>
                                                    <td>₹{plan.price}/week</td>
                                                    <td>{plan.payoutSpeed}</td>
                                                    <td>{plan.claimLimit}/week</td>
                                                    <td>{plan.coveredDisruptions.join(', ')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {selectedPlan && (
                            <div id="payment-section" className="card" style={{ marginBottom: '20px', padding: '20px', textAlign: 'left', border: '2px solid var(--primary)', animation: 'fadeIn 0.5s ease-out' }}>
                                <h4 style={{ color: 'var(--dark)', marginBottom: '8px' }}>Pay for {selectedPlan}</h4>
                                <p style={{ color: 'var(--text-light)', marginBottom: '15px' }}>
                                    Amount due: <strong>₹{PLAN_PRICES[selectedPlan]}</strong>. Choose wallet balance or Razorpay to activate this plan.
                                </p>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button className="btn btn-success" onClick={() => handlePlanPayment('wallet')}>
                                        Pay from Wallet
                                    </button>
                                    <button className="btn btn-primary" onClick={() => handlePlanPayment('razorpay')}>
                                        Pay with Razorpay
                                    </button>
                                    <button className="btn btn-logout" onClick={() => setSelectedPlan(null)}>
                                        Cancel
                                    </button>
                                </div>
                                <p style={{ color: 'var(--text-light)', marginTop: '10px', fontSize: '0.9rem' }}>
                                    Wallet balance: ₹{user?.walletBalance || 0}
                                </p>
                            </div>
                        )}

                        <button className="btn btn-logout" onClick={() => {
                            setSelectedPlan(null);
                            setShowUpgradeModal(false);
                        }}>Close Window</button>
                    </div>
                </div>
            )}
            <div className="card" style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                <div>
                    <h4 style={{ marginBottom: '5px' }}>Need assistance with your coverage?</h4>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Our 24/7 support team is ready to help with any claim or payout issues.</p>
                </div>
                <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=softgridtechnologies@gmail.com&su=Dashboard Support Help&body=Help ID: [TRANS-582]%0D%0AI encountered an issue while using the dashboard: "
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-logout"
                    style={{ textDecoration: 'none' }}
                >
                    Email Support Center
                </a>
            </div>
        </div>

    );
};

export default Dashboard;
