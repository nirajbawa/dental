import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';
import './AdminDashboard.css';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('appointments');
    const [analytics, setAnalytics] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [patients, setPatients] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [hideErrors, setHideErrors] = useState({});
    const [archivePaymentErrors, setArchivePaymentErrors] = useState({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const apptRes = await api.get('/appointments');
            setAppointments(apptRes.data.appointments || []);

            const payRes = await api.get('/payments');
            setPayments(payRes.data.payments || []);

            const remRes = await api.get('/reminders');
            setReminders(remRes.data.reminders || []);

            const patRes = await api.get('/patients');
            setPatients(patRes.data.patients || []);

            const revRes = await api.get('/reviews/admin');
            setReviews(revRes.data.reviews || []);

            const aRes = await api.get('/analytics');
            setAnalytics(aRes.data.analytics);

        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message || err.message;
            console.error('Admin fetch error:', status, message);
            if (status === 401 || status === 403) { logout(); navigate('/admin/login'); return; }
            setError(`Failed to load data (${status || 'network error'}): ${message}`);
        } finally {
            setLoading(false);
        }
    }, [logout, navigate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

    const hideAppointment = async (id) => {
        setHideErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
        try {
            await api.patch(`/appointments/${id}/hide`);
            setAppointments(prev => prev.filter(a => a.id !== id));
        } catch {
            setHideErrors(prev => ({ ...prev, [id]: 'Failed to remove. Please try again.' }));
        }
    };

    const archivePayment = async (id) => {
        setArchivePaymentErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
        try {
            await api.patch(`/payments/${id}/archive`);
            setPayments(prev => prev.filter(p => p.id !== id));
        } catch {
            setArchivePaymentErrors(prev => ({ ...prev, [id]: 'Failed to remove.' }));
        }
    };

    const hideReview = async (id) => {
        try {
            await api.delete(`/reviews/${id}`);
            setReviews(prev => prev.map(r => r.id === id ? { ...r, is_visible: 0 } : r));
            showMsg('Review hidden.');
        } catch { showMsg('Action failed.'); }
    };

    const restoreReview = async (id) => {
        try {
            await api.put(`/reviews/${id}/restore`);
            setReviews(prev => prev.map(r => r.id === id ? { ...r, is_visible: 1 } : r));
            showMsg('Review restored.');
        } catch { showMsg('Action failed.'); }
    };

    const StarDisplay = ({ rating }) => (
        <span>{[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: s <= rating ? '#f59e0b' : '#d1d5db', fontSize: '0.9rem' }}>★</span>)}</span>
    );

    const updateApptStatus = async (id, status) => {
        try {
            await api.put(`/appointments/${id}/status`, { status });
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
            showMsg(`Appointment marked as ${status}.`);
        } catch (err) {
            showMsg('Update failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const updatePaymentStatus = async (id, status) => {
        try {
            await api.put(`/payments/${id}`, { status });
            setPayments(prev => prev.map(p => p.id === id ? { ...p, status } : p));
            showMsg('Payment updated.');
        } catch (err) {
            showMsg('Update failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const updateReminderStatus = async (id, status) => {
        try {
            await api.put(`/reminders/${id}`, { status });
            setReminders(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            showMsg('Reminder updated.');
        } catch (err) {
            showMsg('Update failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const statusBadge = (status) => {
        const map = { pending: 'badge-warning', accepted: 'badge-success', rejected: 'badge-danger', completed: 'badge-success' };
        return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
    };

    const fmtDate = (d) => {
        if (!d) return '-';
        // Handle both ISO string and date-only string
        const date = new Date(d);
        if (isNaN(date)) return d;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) return (
        <div className="page-loading">
            <div className="spinner" />
            <p style={{ marginTop: 12, color: 'var(--text-mid)', fontSize: '0.88rem' }}>Loading dashboard...</p>
        </div>
    );

    const tabs = ['appointments', 'payments', 'reminders', 'patients', 'reviews', 'overview'];

    return (
        <div className="dashboard-page">
            <div className="container">
                <div className="dash-header">
                    <div>
                        <h1>Admin Dashboard</h1>
                        <p>Welcome, {user?.username} — The Smile Dental Clinic</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {msg && <div className="alert alert-success" style={{ margin: 0 }}>{msg}</div>}
                        <button className="btn btn-outline btn-sm" onClick={fetchData}>Refresh</button>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 20 }}>
                        {error}
                        <button onClick={fetchData} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                            Retry
                        </button>
                    </div>
                )}

                {/* Tabs */}
                <div className="tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'appointments' ? `Appointments (${appointments.length})` :
                                tab === 'payments' ? `Payments (${payments.length})` :
                                    tab === 'reminders' ? `Reminders (${reminders.length})` :
                                        tab === 'patients' ? `Patients (${patients.length})` :
                                            tab === 'reviews' ? `Reviews (${reviews.length})` :
                                                'Overview'}
                        </button>
                    ))}
                </div>

                {/* APPOINTMENTS */}
                {activeTab === 'appointments' && (
                    <div className="card">
                        <div className="admin-section-title">All Appointments ({appointments.length})</div>
                        {appointments.length === 0 ? (
                            <div className="empty-state">
                                <p>No appointments found.</p>
                                <button className="btn btn-outline btn-sm" onClick={fetchData}>Refresh</button>
                            </div>
                        ) : (
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Patient</th>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Treatment</th>
                                            <th>Payment</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.map(a => (
                                            <tr key={a.id}>
                                                <td style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>{a.id}</td>
                                                <td>
                                                    <div className="patient-cell">
                                                        <strong>{a.patient_name || a.name}</strong>
                                                        <span>{a.patient_email || a.email}</span>
                                                        <span>{a.phone}</span>
                                                    </div>
                                                </td>
                                                <td>{fmtDate(a.date)}</td>
                                                <td>{a.time}</td>
                                                <td>{a.treatment_type}</td>
                                                <td>
                                                    <span className={`badge ${a.payment_status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                                                        {a.payment_status === 'completed' ? 'Paid' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td>{statusBadge(a.status)}</td>
                                                <td>
                                                    {a.status === 'pending' && (
                                                        <div className="action-btn-group">
                                                            <button className="btn btn-success btn-sm" onClick={() => updateApptStatus(a.id, 'accepted')}>Accept</button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => updateApptStatus(a.id, 'rejected')}>Reject</button>
                                                        </div>
                                                    )}
                                                    {(a.status === 'accepted' || a.status === 'rejected') && (
                                                        <div className="action-btn-group">
                                                            <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger,#dc2626)', borderColor: 'var(--danger,#dc2626)' }} onClick={() => hideAppointment(a.id)}>Remove</button>
                                                            {hideErrors[a.id] && (
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--danger, #dc2626)', marginLeft: 6 }}>
                                                                    {hideErrors[a.id]}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {a.status !== 'pending' && a.status !== 'accepted' && a.status !== 'rejected' && <span className="text-muted">—</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* PAYMENTS */}
                {activeTab === 'payments' && (
                    <div className="card">
                        <div className="admin-section-title">All Payments ({payments.length})</div>
                        {payments.length === 0 ? (
                            <div className="empty-state"><p>No payments yet.</p></div>
                        ) : (
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Appt. Date</th>
                                            <th>Treatment</th>
                                            <th>Amount</th>
                                            <th>Mode</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(p => (
                                            <tr key={p.id} className={p.status === 'pending' ? 'row-highlight' : ''}>
                                                <td>
                                                    <div className="patient-cell">
                                                        <strong>{p.patient_name}</strong>
                                                        <span>{p.patient_email}</span>
                                                    </div>
                                                </td>
                                                <td>{fmtDate(p.appointment_date)}</td>
                                                <td>{p.treatment_type}</td>
                                                <td>Rs. {parseFloat(p.amount).toFixed(0)}</td>
                                                <td><span className="badge badge-info">{p.payment_mode}</span></td>
                                                <td>
                                                    <span className={`badge ${p.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                                                        {p.status === 'completed' ? 'Paid' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {p.status === 'pending' && (
                                                        <button className="btn btn-success btn-sm" onClick={() => updatePaymentStatus(p.id, 'completed')}>
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                    {p.status === 'completed' && (
                                                        <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger,#dc2626)', borderColor: 'var(--danger,#dc2626)' }} onClick={() => archivePayment(p.id)}>
                                                            Remove
                                                        </button>
                                                    )}
                                                    {archivePaymentErrors[p.id] && (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--danger,#dc2626)', marginLeft: 6 }}>{archivePaymentErrors[p.id]}</span>
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

                {/* REMINDERS */}
                {activeTab === 'reminders' && (
                    <div className="card">
                        <div className="admin-section-title">All Reminders ({reminders.length})</div>
                        {reminders.length === 0 ? (
                            <div className="empty-state"><p>No reminders yet.</p></div>
                        ) : (
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Treatment</th>
                                            <th>Reminder Date</th>
                                            <th>Message</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reminders.map(r => {
                                            const isDue = new Date(r.reminder_date) <= new Date();
                                            return (
                                                <tr key={r.id} className={isDue && r.status === 'pending' ? 'row-highlight' : ''}>
                                                    <td>
                                                        <div className="patient-cell">
                                                            <strong>{r.patient_name}</strong>
                                                            <span>{r.patient_email}</span>
                                                        </div>
                                                    </td>
                                                    <td>{r.treatment_type}</td>
                                                    <td>
                                                        {fmtDate(r.reminder_date)}
                                                        {isDue && r.status === 'pending' && <span className="due-tag" style={{ marginLeft: 6 }}>Due</span>}
                                                    </td>
                                                    <td style={{ maxWidth: 200, fontSize: '0.82rem' }}>{r.message}</td>
                                                    <td>{statusBadge(r.status)}</td>
                                                    <td>
                                                        {r.status === 'pending' && (
                                                            <button className="btn btn-success btn-sm" onClick={() => updateReminderStatus(r.id, 'completed')}>Done</button>
                                                        )}
                                                        {r.status === 'completed' && <span className="text-muted">—</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* PATIENTS */}
                {activeTab === 'patients' && (
                    <div className="card">
                        <div className="admin-section-title">All Patients ({patients.length})</div>
                        {patients.length === 0 ? (
                            <div className="empty-state"><p>No patients registered yet.</p></div>
                        ) : (
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Appointments</th>
                                            <th>Payments Done</th>
                                            <th>Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patients.map(p => (
                                            <tr key={p.id}>
                                                <td><strong>{p.name}</strong></td>
                                                <td>{p.email}</td>
                                                <td>{p.phone}</td>
                                                <td>{p.total_appointments}</td>
                                                <td>{p.paid_count}</td>
                                                <td>{fmtDate(p.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* REVIEWS */}
                {activeTab === 'reviews' && (
                    <div className="card">
                        <div className="admin-section-title">All Reviews ({reviews.length})</div>
                        {reviews.length === 0 ? (
                            <div className="empty-state"><p>No reviews yet.</p></div>
                        ) : (
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Treatment</th>
                                            <th>Rating</th>
                                            <th>Review</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reviews.map(r => (
                                            <tr key={r.id} style={{ opacity: r.is_visible ? 1 : 0.5 }}>
                                                <td>
                                                    <div className="patient-cell">
                                                        <strong>{r.patient_name}</strong>
                                                        <span>{r.patient_email}</span>
                                                    </div>
                                                </td>
                                                <td>{r.treatment_type}</td>
                                                <td><StarDisplay rating={r.rating} /></td>
                                                <td style={{ maxWidth: 220, fontSize: '0.82rem', color: 'var(--text-mid)' }}>
                                                    {r.review_text}
                                                </td>
                                                <td>{fmtDate(r.created_at)}</td>
                                                <td>
                                                    <span className={`badge ${r.is_visible ? 'badge-success' : 'badge-warning'}`}>
                                                        {r.is_visible ? 'Visible' : 'Hidden'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {r.is_visible ? (
                                                        <button className="btn btn-danger btn-sm" onClick={() => hideReview(r.id)}>Hide</button>
                                                    ) : (
                                                        <button className="btn btn-success btn-sm" onClick={() => restoreReview(r.id)}>Restore</button>
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

                {/* OVERVIEW */}
                {activeTab === 'overview' && analytics && (
                    <>
                        <div className="analytics-grid">
                            <div className="analytics-card">
                                <div className="label">Total Patients</div>
                                <div className="value">{analytics.total_patients}</div>
                            </div>
                            <div className="analytics-card">
                                <div className="label">Total Appointments</div>
                                <div className="value">{analytics.total_appointments}</div>
                                <div className="sub">{analytics.today_appointments} today</div>
                            </div>
                            <div className="analytics-card">
                                <div className="label">Total Revenue</div>
                                <div className="value">Rs. {parseFloat(analytics.total_revenue || 0).toLocaleString('en-IN')}</div>
                            </div>
                            <div className="analytics-card">
                                <div className="label">Pending</div>
                                <div className="value" style={{ color: 'var(--warning)' }}>{analytics.pending_appointments}</div>
                                <div className="sub">{analytics.pending_payments} payments pending</div>
                            </div>
                        </div>
                        {analytics.treatment_stats?.length > 0 && (
                            <div className="card admin-section">
                                <div className="admin-section-title">Appointments by Treatment</div>
                                <div className="treatment-stats">
                                    {analytics.treatment_stats.map(t => (
                                        <div key={t.treatment_type} className="treatment-row">
                                            <span>{t.treatment_type}</span>
                                            <div className="treatment-bar-wrap">
                                                <div className="treatment-bar"
                                                    style={{ width: `${Math.min(100, (t.count / analytics.total_appointments) * 100)}%` }} />
                                            </div>
                                            <span className="treatment-count">{t.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
