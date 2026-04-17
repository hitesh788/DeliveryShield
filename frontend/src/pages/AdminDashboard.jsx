import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart3, ShieldAlert, Users, Search, UserMinus, FileText, Settings, X, SearchX } from 'lucide-react';
import API_URL from '../config';
import './Claims.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [usersData, setUsersData] = useState({ users: [], removedUsers: [] });
    const [searchQuery, setSearchQuery] = useState('');
    const [tab, setTab] = useState('overview');
    const [selectedUser, setSelectedUser] = useState(null);
    const [removalReason, setRemovalReason] = useState('');
    const [showRemoveModal, setShowRemoveModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [statsRes, usersRes] = await Promise.all([
                axios.get(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setStats(statsRes.data);
            setUsersData(usersRes.data);
        } catch (err) {
            toast.error('Failed to load admin dashboard');
        }
    };

    const handleRemoveUser = async () => {
        if (!removalReason.trim()) return toast.warning('Please provide a removal reason');
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/admin/users/${selectedUser._id}`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { reason: removalReason }
            });
            toast.success('User removed successfully');
            setShowRemoveModal(false);
            setRemovalReason('');
            setSelectedUser(null);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to remove user');
        }
    };

    const filterData = (list) => {
        if (!searchQuery) return list;
        return list.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    };

    if (!stats) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0F172A', color: 'white' }}>
            <h2><ShieldAlert className="spinner" /> Loading Enterprise Matrix...</h2>
        </div>
    );

    // Fallback adapter for older backend responses where it just returned an Array
    const safeUsers = Array.isArray(usersData) ? usersData.filter(u => !u.isRemoved) : (usersData?.users || []);
    const safeRemoved = Array.isArray(usersData) ? usersData.filter(u => u.isRemoved) : (usersData?.removedUsers || []);

    const filteredUsers = filterData(safeUsers);
    const filteredRemoved = filterData(safeRemoved);

    return (
        <div style={{ background: '#0F172A', minHeight: '100vh', color: '#F8FAFC', paddingBottom: '40px' }}>
            {/* Enterprise Top Navbar */}
            <div style={{ background: '#1E293B', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <ShieldAlert color="#3B82F6" size={28} />
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '1px' }}>DeliveryShield <span style={{ color: '#3B82F6' }}>Command Center</span></h2>
                </div>

                <div style={{ position: 'relative', width: '350px' }}>
                    <Search color="#94A3B8" size={18} style={{ position: 'absolute', left: '15px', top: '12px' }} />
                    <input
                        type="text"
                        placeholder="Search users, emails, phones, cities..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '8px', background: '#0F172A', border: '1px solid #334155', color: 'white', outline: 'none' }}
                    />
                </div>
            </div>

            <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
                    <button onClick={() => setTab('overview')} style={{ padding: '10px 20px', background: tab === 'overview' ? '#3B82F6' : 'transparent', color: tab === 'overview' ? 'white' : '#94A3B8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={18} /> Overview
                    </button>
                    <button onClick={() => setTab('users')} style={{ padding: '10px 20px', background: tab === 'users' ? '#10B981' : 'transparent', color: tab === 'users' ? 'white' : '#94A3B8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} /> Active Users ({filteredUsers.length})
                    </button>
                    <button onClick={() => setTab('removed')} style={{ padding: '10px 20px', background: tab === 'removed' ? '#EF4444' : 'transparent', color: tab === 'removed' ? 'white' : '#94A3B8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserMinus size={18} /> Banned Accounts ({filteredRemoved.length})
                    </button>
                </div>

                {/* OVERVIEW TAB */}
                {tab === 'overview' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                            <div style={{ background: '#1E293B', padding: '25px', borderRadius: '15px', borderLeft: '4px solid #3B82F6' }}>
                                <div style={{ color: '#94A3B8', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '10px' }}>Total Workers</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{stats.totalUsers}</div>
                            </div>
                            <div style={{ background: '#1E293B', padding: '25px', borderRadius: '15px', borderLeft: '4px solid #10B981' }}>
                                <div style={{ color: '#94A3B8', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '10px' }}>Active Policies</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{stats.activePolicies}</div>
                            </div>
                            <div style={{ background: '#1E293B', padding: '25px', borderRadius: '15px', borderLeft: '4px solid #F59E0B' }}>
                                <div style={{ color: '#94A3B8', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '10px' }}>Processed Claims</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{stats.totalClaims}</div>
                            </div>
                            <div style={{ background: '#1E293B', padding: '25px', borderRadius: '15px', borderLeft: '4px solid #EF4444' }}>
                                <div style={{ color: '#94A3B8', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '10px' }}>Fraud Flags</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{stats.rejectedClaims}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ background: '#1E293B', padding: '25px', borderRadius: '15px' }}>
                                <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '15px' }}>Geographic Risk Matrix</h3>
                                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ color: '#94A3B8', fontSize: '0.9rem' }}><th style={{ padding: '10px 0' }}>City</th><th>Workers</th><th>Avg Income</th></tr></thead>
                                    <tbody>
                                        {stats.cityRisk.map(city => (
                                            <tr key={city._id} style={{ borderBottom: '1px solid #334155' }}>
                                                <td style={{ padding: '12px 0', fontWeight: 'bold' }}>{city._id}</td>
                                                <td><span style={{ background: 'rgba(59,130,246,0.2)', color: '#60A5FA', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>{city.users} slots</span></td>
                                                <td>₹{Math.round(city.avgIncome || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ background: '#1E293B', padding: '25px', borderRadius: '15px' }}>
                                <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '15px' }}>Recent Payout Triggers</h3>
                                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ color: '#94A3B8', fontSize: '0.9rem' }}><th style={{ padding: '10px 0' }}>Worker</th><th>Status</th><th>Amount</th></tr></thead>
                                    <tbody>
                                        {stats.recentClaims.map(claim => (
                                            <tr key={claim._id} style={{ borderBottom: '1px solid #334155' }}>
                                                <td style={{ padding: '12px 0' }}>{claim.user?.name || 'Unknown'}<br /><span style={{ fontSize: '0.8rem', color: '#64748B' }}>{claim.user?.city}</span></td>
                                                <td><span style={{ background: claim.status === 'approved' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: claim.status === 'approved' ? '#34D399' : '#FCA5A5', padding: '4px 10px', borderRadius: '5px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{claim.status}</span></td>
                                                <td style={{ fontWeight: 'bold' }}>₹{claim.amountPayout}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* USERS TAB */}
                {tab === 'users' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {filteredUsers.length === 0 ? <p style={{ color: '#94A3B8' }}><SearchX /> No users match your search limit.</p> : null}
                        {filteredUsers.map(u => (
                            <div key={u._id} onClick={() => setSelectedUser(u)} style={{ background: '#1E293B', padding: '20px', borderRadius: '15px', cursor: 'pointer', border: '1px solid #334155', transition: 'all 0.2s', ':hover': { borderColor: '#3B82F6' } }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', color: 'white' }}>{u.name}</h3>
                                        <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.9rem' }}>{u.email}</p>
                                    </div>
                                    <span style={{ background: 'rgba(59,130,246,0.2)', color: '#60A5FA', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>{u.platform}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '15px', marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '15px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>Plan</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{u.currentPlan}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>Wallet</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>₹{u.walletBalance}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* REMOVED USERS TAB */}
                {tab === 'removed' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {filteredRemoved.length === 0 ? <p style={{ color: '#94A3B8' }}>No banned accounts found.</p> : null}
                        {filteredRemoved.map(u => (
                            <div key={u._id} onClick={() => setSelectedUser(u)} style={{ background: '#1E293B', padding: '20px', borderRadius: '15px', cursor: 'pointer', border: '1px solid #7F1D1D', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 10, right: -25, background: '#DC2626', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '5px 30px', transform: 'rotate(45deg)' }}>BANNED</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', color: 'white' }}>{u.name}</h3>
                                        <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.9rem' }}>{u.email}</p>
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#FCA5A5', fontWeight: 'bold' }}>Reason: {u.removalReason}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '5px' }}>Date: {new Date(u.removedAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* USER DETAILS MODAL */}
            {selectedUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#1E293B', width: '100%', maxWidth: '600px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', background: selectedUser.isRemoved ? 'rgba(220,38,38,0.1)' : 'transparent' }}>
                            <div>
                                <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {selectedUser.name} {selectedUser.isRemoved && <span style={{ background: '#DC2626', color: 'white', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '5px', verticalAlign: 'middle' }}>BANNED</span>}
                                </h2>
                                <p style={{ margin: 0, color: '#94A3B8', display: 'flex', gap: '15px' }}>
                                    <span>📧 {selectedUser.email}</span>
                                    <span>📱 {selectedUser.phone}</span>
                                </p>
                            </div>
                            <button onClick={() => { setSelectedUser(null); setShowRemoveModal(false); }} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ padding: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ background: '#0F172A', padding: '15px', borderRadius: '10px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 'bold' }}>Platform ID</div>
                                <div style={{ fontSize: '1.1rem', color: 'white' }}>{selectedUser.platform} - {selectedUser.platformId || 'N/A'}</div>
                            </div>
                            <div style={{ background: '#0F172A', padding: '15px', borderRadius: '10px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 'bold' }}>City / Location</div>
                                <div style={{ fontSize: '1.1rem', color: 'white' }}>{selectedUser.city}</div>
                            </div>
                            <div style={{ background: '#0F172A', padding: '15px', borderRadius: '10px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 'bold' }}>Current Plan</div>
                                <div style={{ fontSize: '1.1rem', color: '#10B981', fontWeight: 'bold' }}>{selectedUser.currentPlan}</div>
                            </div>
                            <div style={{ background: '#0F172A', padding: '15px', borderRadius: '10px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 'bold' }}>Wallet Escrow</div>
                                <div style={{ fontSize: '1.1rem', color: 'white' }}>₹{selectedUser.walletBalance}</div>
                            </div>
                        </div>

                        {selectedUser.isRemoved && (
                            <div style={{ padding: '0 25px 25px 25px' }}>
                                <div style={{ background: 'rgba(220,38,38,0.1)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(220,38,38,0.3)' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#FCA5A5', fontWeight: 'bold', marginBottom: '5px' }}>Removal Record ({new Date(selectedUser.removedAt).toLocaleString()})</div>
                                    <div style={{ color: 'white' }}>{selectedUser.removalReason}</div>
                                </div>
                            </div>
                        )}

                        {!selectedUser.isRemoved && (
                            <div style={{ padding: '25px', borderTop: '1px solid #334155', background: '#0F172A' }}>
                                {!showRemoveModal ? (
                                    <button onClick={() => setShowRemoveModal(true)} style={{ width: '100%', background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                        <UserMinus size={18} /> Expel User from Platform
                                    </button>
                                ) : (
                                    <div style={{ background: '#1E293B', padding: '20px', borderRadius: '10px', border: '1px solid #EF4444' }}>
                                        <h4 style={{ color: '#FCA5A5', margin: '0 0 10px 0' }}>Warning: Destructive Action</h4>
                                        <input
                                            type="text"
                                            placeholder="Reason for removal (e.g. Fraudulent claims, TOS violation)"
                                            value={removalReason}
                                            onChange={e => setRemovalReason(e.target.value)}
                                            style={{ width: '100%', padding: '10px', background: '#0F172A', border: '1px solid #334155', color: 'white', borderRadius: '5px', outline: 'none', marginBottom: '15px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => setShowRemoveModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', color: 'white', border: '1px solid #334155', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
                                            <button onClick={handleRemoveUser} style={{ flex: 1, padding: '10px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm Ban</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedUser.isRemoved && (
                            <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid #334155', background: '#0F172A' }}>
                                <button onClick={() => { setSelectedUser(null); setShowRemoveModal(false); }} style={{ padding: '10px 30px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Close Protocol</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
