import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Forgot from './pages/Forgot';
import Dashboard from './pages/Dashboard';
import BuyPolicy from './pages/BuyPolicy';

import Claims from './pages/Claims';
import Withdrawals from './pages/Withdrawals';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import ChangePasswordModal from './components/ChangePasswordModal';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return token && user?.role === 'admin' ? children : <Navigate to="/admin-login" />;
};

const PublicOnlyRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token) return children;

    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
};

const AppLayout = () => {
    const location = useLocation();
    const hideNavbarOnRoutes = ['/login', '/admin-login', '/register', '/verify-otp', '/forgot-password'];
    const shouldShowNavbar = !hideNavbarOnRoutes.includes(location.pathname);
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    return (
        <>
            {shouldShowNavbar && <Navbar />}
            <div className="container main-content-body">
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                    <Route path="/admin-login" element={<PublicOnlyRoute><AdminLogin /></PublicOnlyRoute>} />
                    <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
                    <Route path="/verify-otp" element={<PublicOnlyRoute><VerifyOTP /></PublicOnlyRoute>} />
                    <Route path="/forgot-password" element={<PublicOnlyRoute><Forgot /></PublicOnlyRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/buy-policy" element={<ProtectedRoute><BuyPolicy /></ProtectedRoute>} />
                    <Route path="/claims" element={<ProtectedRoute><Claims /></ProtectedRoute>} />
                    <Route path="/withdrawals" element={<ProtectedRoute><Withdrawals /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                </Routes>
            </div>
            <Footer />
            <ToastContainer position="top-right" autoClose={3000} pauseOnHover={false} />
            <ChangePasswordModal user={user} />
        </>
    );
};

function App() {
    return (
        <Router>
            <AppLayout />
        </Router>
    );
}

export default App;
