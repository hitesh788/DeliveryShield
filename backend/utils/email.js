const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const getTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env');
    }

    const emailPass = process.env.EMAIL_PASS.replace(/\s/g, '');

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: emailPass
        }
    });
};

// Send OTP Email
const sendOtpEmail = async (to, otp, name = "User") => {
    const transporter = getTransporter();

    const mailOptions = {
        from: `"DeliveryShield" <${process.env.EMAIL_USER}>`,
        to,
        subject: '🚀 DeliveryShield Email Verification OTP',
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
        
        html: `
        <div style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
                <tr>
                    <td align="center">
                        <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                            
                            <!-- Header -->
                            <tr>
                                <td style="background:#007bff;padding:20px;text-align:center;color:#ffffff;">
                                    <h1 style="margin:0;font-size:24px;">🚀 DeliveryShield</h1>
                                    <p style="margin:5px 0 0;font-size:14px;">Secure Your Income</p>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding:30px;text-align:center;">
                                    <h2 style="margin-bottom:10px;color:#333;">Email Verification</h2>
                                    
                                    <p style="color:#555;font-size:15px;">
                                        Hello <b>${name}</b>,
                                    </p>

                                    <p style="color:#555;font-size:15px;">
                                        Use the OTP below to verify your DeliveryShield account.
                                    </p>

                                    <!-- OTP Box -->
                                    <div style="
                                        margin:25px auto;
                                        padding:15px;
                                        width:220px;
                                        background:#f1f5ff;
                                        border:2px dashed #007bff;
                                        border-radius:8px;
                                        font-size:28px;
                                        font-weight:bold;
                                        letter-spacing:6px;
                                        color:#007bff;
                                    ">
                                        ${otp}
                                    </div>

                                    <p style="color:#777;font-size:13px;">
                                        This OTP is valid for <b>10 minutes</b>.
                                    </p>

                                    <p style="color:#999;font-size:12px;">
                                        Do not share this code with anyone.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background:#f8f9fa;padding:15px;text-align:center;font-size:12px;color:#999;">
                                    If you didn’t request this, you can safely ignore this email.<br/>
                                    © 2026 DeliveryShield. All rights reserved.
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent:", info.response);
        return true;
    } catch (error) {
        console.error("❌ Email sending failed:", error.message);
        throw error;
    }
};

module.exports = { sendOtpEmail };