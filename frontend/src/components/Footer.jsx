import React from 'react';

const Footer = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    return (
        <footer className="footer">
            <div className="footer-content">
                <p>&copy; 2026 DeliveryShield Parametric Platform. All Rights Reserved.</p>
                <p className="footer-subtext">Powered by AI Risk Engine & Automated OpenWeather Disruptions</p>
            </div>
        </footer>
    );
};

export default Footer;
