import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BuyPolicy from './pages/BuyPolicy';
import Claims from './pages/Claims';
import Withdrawals from './pages/Withdrawals';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Navbar />
            <div className="container main-content-body">
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/buy-policy" element={<ProtectedRoute><BuyPolicy /></ProtectedRoute>} />
                    <Route path="/claims" element={<ProtectedRoute><Claims /></ProtectedRoute>} />
                    <Route path="/withdrawals" element={<ProtectedRoute><Withdrawals /></ProtectedRoute>} />
                </Routes>
            </div>
            <Footer />
            <ToastContainer position="top-right" autoClose={3000} />
        </Router>
    );
}

export default App;
