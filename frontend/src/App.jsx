import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
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

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return token && user?.role === 'admin' ? children : <Navigate to="/admin-login" />;
};

function App() {
    return (
        <Router>
            <Navbar />
            <div className="container main-content-body">
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin-login" element={<AdminLogin />} />
                    <Route path="/register" element={<Register />} />
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
        </Router>
    );
}

export default App;
