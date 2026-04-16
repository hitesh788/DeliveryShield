import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Shield, LogOut, HeartPulse, User as UserIcon } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const [location, setLocation] = useState('Detecting Location...');
    const [digitalHealth, setDigitalHealth] = useState({ label: 'Excellent', color: '#10B981' });
    const [storedPlan, setStoredPlan] = useState(localStorage.getItem('userPlan') || 'BASIC PLAN');

    let planBadge = user?.role === 'admin' ? 'ADMIN' : 'BASIC';
    if (user?.role !== 'admin') {
        if (storedPlan === 'BETA PLAN') planBadge = 'BETA';
        if (storedPlan === 'PRO LEVEL') planBadge = 'PRO';
        if (storedPlan === 'ELITE CORP') planBadge = 'ELITE';
    }

    useEffect(() => {
        const syncPlan = () => setStoredPlan(localStorage.getItem('userPlan') || 'BASIC PLAN');
        window.addEventListener('planChanged', syncPlan);
        window.addEventListener('storage', syncPlan);

        if (user?.role === 'admin') {
            return () => {
                window.removeEventListener('planChanged', syncPlan);
                window.removeEventListener('storage', syncPlan);
            };
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                        const data = await res.json();
                        setLocation(`${data.city || data.locality}, ${data.countryName}`);
                    } catch (err) {
                        setLocation('Location Access Error');
                    }
                },
                () => setLocation('Location Disabled')
            );
        }

        const fetchHealthScore = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/claim`, { headers: { Authorization: `Bearer ${token}` } });
                const rejectedCount = res.data.filter(c => c.isFraudulent).length;
                if (rejectedCount === 0) setDigitalHealth({ label: 'Excellent', color: '#10B981' });
                else if (rejectedCount <= 1) setDigitalHealth({ label: 'Average', color: '#F59E0B' });
                else setDigitalHealth({ label: 'Poor (False Claims)', color: '#EF4444' });
            } catch (err) { }
        };
        fetchHealthScore();

        return () => {
            window.removeEventListener('planChanged', syncPlan);
            window.removeEventListener('storage', syncPlan);
        };
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userPlan');
        navigate(user?.role === 'admin' ? '/admin-login' : '/login');
    };

    if (!token) return null;

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <Shield className="brand-icon" /> <span>DeliveryShield <span className="brand-pro" style={{
                    background: planBadge === 'ELITE' ? '#0F172A' : planBadge === 'PRO' ? '#3B82F6' : planBadge === 'BETA' ? '#F59E0B' : '#64748B'
                }}>{planBadge}</span></span>
            </div>

            {user?.role !== 'admin' && (
                <div className="nav-location" style={{ background: '#F1F5F9', color: digitalHealth.color }}>
                    <HeartPulse size={18} color={digitalHealth.color} />
                    <span style={{ marginRight: '15px' }}>Digital Health: {digitalHealth.label}</span>
                    <MapPin size={18} color="#EF4444" />
                    <span style={{ color: '#B91C1C' }}>Live: {location}</span>
                </div>
            )}

            <div className="nav-links">
                {user?.role === 'admin' ? (
                    <Link to="/admin" className="nav-item">Admin Dashboard</Link>
                ) : (
                    <>
                        <Link to="/dashboard" className="nav-item">Dashboard</Link>
                        <Link to="/withdrawals" className="nav-item">Payout History</Link>
                        <Link to="/claims" className="nav-item">All Claims</Link>
                        <Link to="/profile" className="nav-item" title="My Profile" style={{ display: 'flex', alignItems: 'center', padding: '5px' }}>
                            <UserIcon size={24} strokeWidth={2} />
                        </Link>
                    </>
                )}
                <button onClick={handleLogout} className="btn-logout"><LogOut size={16} /> Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;
