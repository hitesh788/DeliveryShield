import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    ArrowRightLeft,
    Banknote,
    CreditCard,
    Download,
    FileText,
    Landmark,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import API_URL from '../config';
import './Claims.css';
import './Withdrawals.css';

const FILTER_LABELS = {
    all: 'All transactions',
    claim_payout: 'Claim payouts',
    wallet_topup: 'Wallet top-ups',
    wallet_withdrawal: 'Wallet withdrawals',
    plan_upgrade: 'Plan payments',
    premium_payment: 'Policy premiums'
};

const Withdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [filter, setFilter] = useState('all');
    const [isDownloading, setIsDownloading] = useState(false);

    const formatType = (tx) => {
        if (tx.type === 'plan_upgrade') return `PLAN CHANGE - ${tx.planName || 'PLAN'}`;
        if (tx.type === 'premium_payment') return 'POLICY PREMIUM';
        if (tx.type === 'wallet_topup') return 'WALLET TOP-UP';
        if (tx.type === 'claim_payout') return 'CLAIM PAYOUT';
        return tx.type.replace(/_/g, ' ').toUpperCase();
    };

    const isDebitTransaction = (tx) =>
        tx.type === 'wallet_withdrawal' || (tx.type === 'plan_upgrade' && tx.paymentMethod === 'wallet');

    const formatAmount = (tx) =>
        `${isDebitTransaction(tx) ? '-' : '+'}Rs. ${Number(tx.amount || 0).toFixed(2)}`;

    const formatDateTime = (value) =>
        new Date(value).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });

    const summary = useMemo(() => {
        return withdrawals.reduce((acc, tx) => {
            const amount = Number(tx.amount || 0);

            if (isDebitTransaction(tx)) {
                acc.totalDebits += amount;
            } else {
                acc.totalCredits += amount;
            }

            if (tx.type === 'claim_payout') {
                acc.claimPayouts += amount;
            }

            return acc;
        }, {
            totalCredits: 0,
            totalDebits: 0,
            claimPayouts: 0
        });
    }, [withdrawals]);

    const fetchWithdrawals = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/auth/transactions?type=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWithdrawals(res.data);
        } catch (err) {
            toast.error('Failed to load payment history');
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, [filter]);

    const downloadHistoryPdf = () => {
        if (!withdrawals.length) {
            toast.info('There is no payout history available to export yet.');
            return;
        }

        try {
            setIsDownloading(true);

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'pt',
                format: 'a4'
            });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const generatedOn = new Date();
            const filenameDate = generatedOn.toISOString().slice(0, 10);
            const netFlow = summary.totalCredits - summary.totalDebits;

            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, pageWidth, 118, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.text('DeliveryShield Payout History', 40, 48);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text('Transaction export with wallet movement, payouts, and payment references.', 40, 70);
            doc.text(`Generated on ${formatDateTime(generatedOn)}`, 40, 88);

            doc.setFillColor(239, 246, 255);
            doc.roundedRect(40, 138, 220, 72, 16, 16, 'F');
            doc.roundedRect(278, 138, 220, 72, 16, 16, 'F');
            doc.roundedRect(516, 138, 260, 72, 16, 16, 'F');

            doc.setTextColor(100, 116, 139);
            doc.setFontSize(10);
            doc.text('Filter applied', 56, 160);
            doc.text('Records included', 294, 160);
            doc.text('Net wallet flow', 532, 160);

            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text(FILTER_LABELS[filter], 56, 186);
            doc.text(String(withdrawals.length), 294, 186);
            doc.text(`Rs. ${netFlow.toFixed(2)}`, 532, 186);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.setFontSize(11);
            doc.text(`Credits: Rs. ${summary.totalCredits.toFixed(2)}`, 56, 202);
            doc.text(`Debits: Rs. ${summary.totalDebits.toFixed(2)}`, 294, 202);
            doc.text(`Claim payouts: Rs. ${summary.claimPayouts.toFixed(2)}`, 532, 202);

            autoTable(doc, {
                startY: 236,
                margin: { left: 40, right: 40, bottom: 42 },
                head: [[
                    'Timestamp',
                    'Transaction Type',
                    'Amount',
                    'Balance After',
                    'Payment / Destination',
                    'Status'
                ]],
                body: withdrawals.map((tx) => ([
                    formatDateTime(tx.transactionDate),
                    formatType(tx),
                    formatAmount(tx),
                    tx.balanceAfter != null ? `Rs. ${Number(tx.balanceAfter).toFixed(2)}` : 'N/A',
                    tx.upiId || tx.paymentMethod?.toUpperCase() || tx.description || 'N/A',
                    tx.status?.toUpperCase() || 'COMPLETED'
                ])),
                theme: 'grid',
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    cellPadding: 8,
                    lineColor: [226, 232, 240],
                    lineWidth: 1,
                    textColor: [15, 23, 42]
                },
                headStyles: {
                    fillColor: [30, 58, 138],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'left'
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                columnStyles: {
                    0: { cellWidth: 118 },
                    1: { cellWidth: 146 },
                    2: { cellWidth: 90 },
                    3: { cellWidth: 96 },
                    4: { cellWidth: 180 },
                    5: { cellWidth: 82 }
                },
                didDrawPage: ({ pageNumber }) => {
                    const footerY = pageHeight - 20;
                    doc.setFontSize(9);
                    doc.setTextColor(100, 116, 139);
                    doc.text('DeliveryShield secure transaction export', 40, footerY);
                    doc.text(`Page ${pageNumber}`, pageWidth - 75, footerY);
                }
            });

            doc.save(`deliveryshield-payout-history-${filter}-${filenameDate}.pdf`);
            toast.success('Payout history PDF downloaded successfully.');
        } catch (error) {
            toast.error('Failed to generate the payout history PDF.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="claims-container">
            <div className="dashboard-header withdrawals-header" style={{ marginBottom: '20px' }}>
                <div className="welcome-text">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Banknote color="#10B981" /> Payout & Payment History
                    </h2>
                    <p>Review wallet withdrawals, policy payments, and claim activity in one place.</p>
                </div>
                <div className="withdrawals-actions">
                    <select className="modal-input withdrawals-filter" value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="all">All transactions</option>
                        <option value="claim_payout">Claim payouts</option>
                        <option value="wallet_topup">Wallet top-ups</option>
                        <option value="wallet_withdrawal">Wallet withdrawals</option>
                        <option value="plan_upgrade">Plan payments</option>
                        <option value="premium_payment">Policy premiums</option>
                    </select>
                    <button
                        type="button"
                        className="btn btn-primary withdrawals-download-btn"
                        onClick={downloadHistoryPdf}
                        disabled={isDownloading || !withdrawals.length}
                    >
                        <Download size={18} />
                        {isDownloading ? 'Preparing PDF...' : 'Download History PDF'}
                    </button>
                </div>
            </div>

            <div className="withdrawals-summary-grid">
                <div className="withdrawals-summary-card">
                    <div className="withdrawals-summary-icon payouts">
                        <FileText size={18} />
                    </div>
                    <div>
                        <p>Records in view</p>
                        <h3>{withdrawals.length}</h3>
                        <span>{FILTER_LABELS[filter]}</span>
                    </div>
                </div>
                <div className="withdrawals-summary-card">
                    <div className="withdrawals-summary-icon credits">
                        <TrendingUp size={18} />
                    </div>
                    <div>
                        <p>Total credits</p>
                        <h3>Rs. {summary.totalCredits.toFixed(2)}</h3>
                        <span>Claim payouts and wallet top-ups</span>
                    </div>
                </div>
                <div className="withdrawals-summary-card">
                    <div className="withdrawals-summary-icon debits">
                        <TrendingDown size={18} />
                    </div>
                    <div>
                        <p>Total debits</p>
                        <h3>Rs. {summary.totalDebits.toFixed(2)}</h3>
                        <span>Withdrawals and wallet-funded plan charges</span>
                    </div>
                </div>
                <div className="withdrawals-summary-card">
                    <div className="withdrawals-summary-icon balance">
                        <Landmark size={18} />
                    </div>
                    <div>
                        <p>Claim payout total</p>
                        <h3>Rs. {summary.claimPayouts.toFixed(2)}</h3>
                        <span>Instant payout value processed so far</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="withdrawals-card-header">
                    <div>
                        <h3>Transaction Timeline</h3>
                        <p>Each export includes the active filter, summary metrics, and the full visible table.</p>
                    </div>
                    <span className="withdrawals-filter-pill">{FILTER_LABELS[filter]}</span>
                </div>
                {withdrawals.length === 0 ? <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>No payment history found.</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="claims-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Transaction Type</th>
                                    <th>Amount</th>
                                    <th>Balance After</th>
                                    <th>Payment / Destination</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.map((tx) => (
                                    <tr key={tx._id}>
                                        <td>
                                            <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                                                {formatDateTime(tx.transactionDate)}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 'bold', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <ArrowRightLeft size={16} /> {formatType(tx)}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontSize: '1.05rem',
                                                fontWeight: 'bold',
                                                color: isDebitTransaction(tx) ? '#EF4444' : '#10B981'
                                            }}>
                                                {formatAmount(tx)}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {tx.balanceAfter != null ? `Rs. ${Number(tx.balanceAfter).toFixed(2)}` : 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <CreditCard size={16} /> {tx.upiId || tx.paymentMethod?.toUpperCase() || tx.description || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${tx.status}`}>{tx.status.toUpperCase()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Withdrawals;
