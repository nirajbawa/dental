import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ReminderPopup from '../components/ReminderPopup';
import './Dashboard.css';

const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (document.getElementById('razorpay-script')) { resolve(true); return; }
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

// Parse date string safely without UTC offset shifting the day
const fmtDate = (d) => {
    if (!d) return '-';
    const s = typeof d === 'string' ? d : new Date(d).toISOString();
    const [year, month, day] = s.substring(0, 10).split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
};

export default function UserDashboard() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('appointments');
    const [payingId, setPayingId] = useState(null);

    const refreshData = async () => {
        try {
            const [apptRes, payRes, remRes] = await Promise.all([
                api.get('/appointments'),
                api.get('/payments'),
                api.get('/reminders')
            ]);
            setAppointments(apptRes.data.appointments || []);
            setPayments(payRes.data.payments || []);
            setReminders(remRes.data.reminders || []);
        } catch (err) {
            setError('Failed to load data. Please refresh.');
        }
    };

    useEffect(() => {
        const fetchAll = async () => {
            await refreshData();
            setLoading(false);
        };
        fetchAll();
    }, []);

    // Allow user to pay online for a pending payment from the dashboard
    const handlePayNow = async (appointment_id, name, email, phone) => {
        setPayingId(appointment_id);
        const loaded = await loadRazorpayScript();
        if (!loaded) { setError('Payment gateway failed to load.'); setPayingId(null); return; }

        try {
            const { data: orderData } = await api.post('/razorpay/create-order', { appointment_id });
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'The Smile Dental Clinic',
                description: 'Consultation Fee',
                order_id: orderData.order_id,
                prefill: { name, email, contact: phone },
                theme: { color: '#1a6b8a' },
                handler: async (response) => {
                    try {
                        await api.post('/razorpay/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            appointment_id
                        });
                        await refreshData();
                        setPayingId(null);
                    } catch {
                        setError('Payment received but verification failed. Contact the clinic.');
                        setPayingId(null);
                    }
                },
                modal: { ondismiss: () => setPayingId(null) }
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (r) => {
                setError(`Payment failed: ${r.error.description}`);
                setPayingId(null);
            });
            rzp.open();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not initiate payment.');
            setPayingId(null);
        }
    };

    const statusBadge = (status) => {
        const map = { pending: 'badge-warning', accepted: 'badge-success', rejected: 'badge-danger' };
        return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
    };

    const paymentBadge = (status) => (
        <span className={`badge ${status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
            {status === 'completed' ? 'Paid' : 'Pay at Clinic'}
        </span>
    );

    const today = new Date().toISOString().split('T')[0];
    const dueUnreadReminders = useMemo(
        () => reminders.filter(r => r.is_read === 0 && r.reminder_date <= today),
        [reminders, today]
    );

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    return (
        <div className="dashboard-page">
            <div className="container">
                <div className="dash-header">
                    <div>
                        <h1>My Dashboard</h1>
                        <p>Welcome back, {user?.name}</p>
                    </div>
                    <Link to="/book" className="btn btn-primary">Book New Appointment</Link>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {dueUnreadReminders.length > 0 && (
                    <ReminderPopup reminders={dueUnreadReminders} onClose={refreshData} />
                )}

                {/* Summary cards */}
                <div className="summary-grid">
                    <div className="summary-card">
                        <span className="summary-num">{appointments.length}</span>
                        <span className="summary-label">Total Appointments</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-num">{appointments.filter(a => a.status === 'accepted').length}</span>
                        <span className="summary-label">Confirmed</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-num">{payments.filter(p => p.status === 'completed').length}</span>
                        <span className="summary-label">Payments Done</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-num">{reminders.filter(r => r.status === 'pending').length}</span>
                        <span className="summary-label">Pending Reminders</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    {['appointments', 'payments', 'reminders'].map(tab => (
                        <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Appointments */}
                {activeTab === 'appointments' && (
                    <div className="card">
                        {appointments.length === 0 ? (
                            <div className="empty-state">
                                <p>No appointments yet.</p>
                                <Link to="/book" className="btn btn-primary btn-sm">Book Now</Link>
                            </div>
                        ) : (
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Treatment</th>
                                            <th>Status</th>
                                            <th>Payment</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.map(a => (
                                            <tr key={a.id}>
                                                <td>{fmtDate(a.date)}</td>
                                                <td>{a.time}</td>
                                                <td>{a.treatment_type}</td>
                                                <td>{statusBadge(a.status)}</td>
                                                <td>{paymentBadge(a.payment_status)}</td>
                                                <td>
                                                    {a.payment_status === 'pending' && a.payment_mode === 'online' ? (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            disabled={payingId === a.id}
                                                            onClick={() => handlePayNow(a.id, a.name, a.email, a.phone)}
                                                        >
                                                            {payingId === a.id ? 'Opening...' : 'Pay Rs. 400'}
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>
                                                            {a.payment_status === 'completed' ? 'Paid' : 'Pay at Clinic'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Payments */}
                {activeTab === 'payments' && (
                    <div className="card">
                        {payments.length === 0 ? (
                            <div className="empty-state"><p>No payment records found.</p></div>
                        ) : (
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Treatment</th>
                                            <th>Amount</th>
                                            <th>Mode</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(p => (
                                            <tr key={p.id}>
                                                <td>{fmtDate(p.appointment_date)}</td>
                                                <td>{p.treatment_type}</td>
                                                <td>Rs. {parseFloat(p.amount).toFixed(0)}</td>
                                                <td><span className="badge badge-info">{p.payment_mode}</span></td>
                                                <td>{paymentBadge(p.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Reminders */}
                {activeTab === 'reminders' && (
                    <div className="card">
                        {reminders.length === 0 ? (
                            <div className="empty-state"><p>No reminders yet.</p></div>
                        ) : (
                            <div className="reminders-list">
                                {reminders.map(r => {
                                    const isDue = new Date(r.reminder_date) <= new Date();
                                    return (
                                        <div key={r.id} className={`reminder-item ${isDue ? 'due' : ''}`}>
                                            <div className="reminder-info">
                                                <p className="reminder-msg">{r.message}</p>
                                                <p className="reminder-date">
                                                    Follow-up: {fmtDate(r.reminder_date)}
                                                    {isDue && <span className="due-tag">Due</span>}
                                                </p>
                                            </div>
                                            <span className={`badge ${r.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                                {r.status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
