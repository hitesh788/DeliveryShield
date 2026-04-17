import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config';
import { ShieldAlert } from 'lucide-react';

const ChangePasswordModal = ({ user }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!user || user.role === 'admin' || !user.needsPasswordChange) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error('New passwords do not match');
        }
        if (newPassword.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/auth/change-password`, {
                currentPassword,
                newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(res.data.message || 'Password changed successfully');

            // Update local storage
            const updatedUser = { ...user, needsPasswordChange: false };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Reload page to dismiss modal and sync state cleanly
            window.location.reload();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <ShieldAlert size={48} color="var(--primary)" style={{ marginBottom: '15px', margin: '0 auto' }} />
                <h2 style={{ marginBottom: '10px', color: '#1f2937' }}>Update Required</h2>
                <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '0.95rem' }}>
                    You are logged in with a temporary recovery password. Please create a new secure password to continue.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563', marginBottom: '5px' }}>Recovery password:</label>
                        <input
                            type="text"
                            placeholder="Enter current recovery password"
                            className="modal-input"
                            style={{ margin: 0, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', boxSizing: 'border-box' }}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563', marginBottom: '5px' }}>New password:</label>
                        <input
                            type="password"
                            placeholder="Enter new secure password"
                            className="modal-input"
                            style={{ margin: 0, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', boxSizing: 'border-box' }}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563', marginBottom: '5px' }}>Re-enter new password:</label>
                        <input
                            type="password"
                            placeholder="Re-enter new password"
                            className="modal-input"
                            style={{ margin: 0, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', boxSizing: 'border-box' }}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '14px', marginTop: '5px' }} disabled={loading}>
                        {loading ? 'Updating...' : 'Set New Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
