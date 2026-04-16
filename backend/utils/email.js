const axios = require('axios');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let cachedTransporter = null;

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildOtpMarkup = (otp, name = 'User') => `
<div style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
        <tr>
            <td align="center">
                
                <table width="500" cellpadding="0" cellspacing="0" style="
                    background:#ffffff;
                    border-radius:14px;
                    overflow:hidden;
                    box-shadow:0 10px 25px rgba(0,0,0,0.08);
                ">

                    <!-- Header -->
                    <tr>
                        <td style="
                            background:linear-gradient(135deg,#2563eb,#3b82f6);
                            padding:25px;
                            text-align:center;
                            color:#ffffff;
                        ">
                            <h1 style="margin:0;font-size:22px;font-weight:600;">
                                🚀 DeliveryShield
                            </h1>
                            <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">
                                Secure Your Income
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:35px 30px;text-align:center;">

                            <h2 style="
                                margin-bottom:12px;
                                color:#1f2937;
                                font-size:20px;
                                font-weight:600;
                            ">
                                Email Verification
                            </h2>

                            <p style="
                                color:#4b5563;
                                font-size:14px;
                                margin-bottom:8px;
                            ">
                                Hello <b>${escapeHtml(name)}</b>,
                            </p>

                            <p style="
                                color:#6b7280;
                                font-size:14px;
                                margin-bottom:20px;
                            ">
                                Use the OTP below to verify your DeliveryShield account.
                            </p>

                            <!-- OTP BOX -->
                            <div style="
                                margin:20px auto;
                                padding:16px 0;
                                width:220px;
                                background:#eef2ff;
                                border-radius:10px;
                                border:1px solid #c7d2fe;
                                font-size:28px;
                                font-weight:700;
                                letter-spacing:6px;
                                color:#2563eb;
                            ">
                                ${escapeHtml(otp)}
                            </div>

                            <p style="
                                color:#9ca3af;
                                font-size:12px;
                                margin-top:10px;
                            ">
                                This OTP is valid for <b>10 minutes</b>.
                            </p>

                            <p style="
                                color:#9ca3af;
                                font-size:12px;
                                margin-top:5px;
                            ">
                                Do not share this code with anyone.
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="
                            background:#f9fafb;
                            padding:18px;
                            text-align:center;
                            font-size:11px;
                            color:#9ca3af;
                            border-top:1px solid #e5e7eb;
                        ">
                            If you did not request this, you can safely ignore this email.<br/>
                            © 2026 DeliveryShield. All rights reserved.
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</div>
`;
const readEmailConfig = () => {
    const emailProvider = (process.env.EMAIL_PROVIDER || 'smtp').trim().toLowerCase();
    console.log(`📡 Active Email Provider: ${emailProvider}`);
    const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
    const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s/g, '') : '';
    const emailHost = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
    const emailPort = Number(process.env.EMAIL_PORT || 587);
    const emailSecure = process.env.EMAIL_SECURE === 'true' || emailPort === 465;
    const emailService = process.env.EMAIL_SERVICE ? process.env.EMAIL_SERVICE.trim() : '';
    const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
    const resendAudience = process.env.RESEND_AUDIENCE ? process.env.RESEND_AUDIENCE.trim().toLowerCase() : '';
    let emailFrom = process.env.EMAIL_FROM ? process.env.EMAIL_FROM.trim() : '';

    if (emailProvider === 'resend') {
        // Resend requires onboarding@resend.dev for unverified domains
        if (!emailFrom || emailFrom.includes('gmail.com')) {
            emailFrom = 'onboarding@resend.dev';
        }
    } else if (!emailFrom) {
        emailFrom = `"DeliveryShield" <${emailUser}>`;
    }

    if (emailProvider === 'resend') {
        if (!resendApiKey) {
            throw new Error('Resend email service not configured. Set RESEND_API_KEY in backend/.env');
        }
    } else if (!emailUser || !emailPass) {
        throw new Error('Email service not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env');
    }

    return {
        emailProvider,
        emailUser,
        emailPass,
        emailHost,
        emailPort,
        emailSecure,
        emailService,
        emailFrom,
        resendApiKey,
        resendAudience
    };
};

// Create transporter
const getTransporter = () => {
    if (cachedTransporter) {
        return cachedTransporter;
    }

    const config = readEmailConfig();

    // Only initialize SMTP if we are NOT using Resend
    if (config.emailProvider === 'resend') {
        return null;
    }

    // Use manual host/port to bypass service-default port blocks (like 465)
    const transportConfig = {
        host: config.emailHost || 'smtp.gmail.com',
        port: config.emailPort || 587,
        secure: config.emailPort === 465, // true only for 465
        auth: {
            user: config.emailUser,
            pass: config.emailPass
        },
        tls: {
            rejectUnauthorized: false
        }
    };

    console.log(`📡 Connecting to SMTP ${transportConfig.host}:${transportConfig.port}...`);
    cachedTransporter = nodemailer.createTransport(transportConfig);
    return cachedTransporter;
};

const sendWithResend = async ({ to, subject, text, html, from, config }) => {
    console.log(`📡 Sending via Resend API (Axios) to ${to}...`);
    try {
        const response = await axios.post('https://api.resend.com/emails', {
            from,
            to: [to],
            subject,
            text,
            html
        }, {
            headers: {
                Authorization: `Bearer ${config.resendApiKey}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Email sent with Resend:', response.data.id || 'ok');
        return true;
    } catch (error) {
        const details = error.response?.data?.message || error.response?.data?.error || error.message;
        const axiosError = new Error(details);
        axiosError.code = 'ERESEND';
        throw axiosError;
    }
};

// Send OTP Email
const sendOtpEmail = async (to, otp, name = 'User') => {
    const config = readEmailConfig();
    const subject = 'DeliveryShield Email Verification OTP';
    const text = `Your OTP is ${otp}. It expires in 10 minutes.`;
    const html = buildOtpMarkup(otp, name);

    console.log(`📧 Attempting to send OTP to ${to}...`);

    try {
        if (config.emailProvider === 'resend') {
            return await sendWithResend({
                to,
                from: config.emailFrom,
                subject,
                text,
                html,
                config
            });
        }

        const transporter = getTransporter();

        if (!transporter) {
            // If we're here, it means we're likely using Resend and it already finished
            // or there's a serious configuration error.
            if (config.emailProvider === 'resend') return true;
            throw new Error('No email transporter available. Check EMAIL_PROVIDER.');
        }

        const mailOptions = {
            from: config.emailFrom,
            to,
            subject,
            text,
            html
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.response);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message || error);
        if (error.stack) console.error(error.stack);
        if (error && (error.code === 'EAUTH' || error.responseCode === 535)) {
            console.error('Check EMAIL_USER / EMAIL_PASS in backend/.env and confirm the Gmail app password is still valid.');
        }
        if (error && error.code === 'ESOCKET') {
            console.error('SMTP socket connection failed. Check EMAIL_HOST / EMAIL_PORT / EMAIL_SECURE and any firewall restrictions.');
        }
        if (error && error.code === 'ETIMEDOUT') {
            console.error('SMTP connection timed out. This usually means the server cannot reach Gmail SMTP from the current network.');
        }
        if (error && error.code === 'ERESEND') {
            console.error('Resend rejected the email request. Check RESEND_API_KEY and EMAIL_FROM in backend/.env.');
        }
        throw error;
    }
};

module.exports = { sendOtpEmail };
