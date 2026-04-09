import React, { useState } from 'react';
import './ReminderPopup.css';

// Parse date string safely without UTC offset shifting the day
const fmtDate = (d) => {
    if (!d) return '-';
    const s = typeof d === 'string' ? d : new Date(d).toISOString();
    const [year, month, day] = s.substring(0, 10).split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
};

export default function ReminderPopup({ reminders, onClose }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGotIt = async () => {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        const ids = reminders.map((r) => r.id);

        try {
            const res = await fetch('/api/reminders/mark-read', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ids }),
            });

            if (res.ok) {
                onClose();
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.message || 'Failed to mark reminders as read. Please try again.');
                setLoading(false);
            }
        } catch {
            setError('Network error. Please check your connection and try again.');
            setLoading(false);
        }
    };

    return (
        <div className="reminder-popup-backdrop">
            <div className="reminder-popup" role="dialog" aria-modal="true" aria-labelledby="reminder-popup-title">
                <div className="reminder-popup-header">
                    <span className="reminder-popup-icon">🔔</span>
                    <h2 id="reminder-popup-title">Follow-up Reminder{reminders.length > 1 ? 's' : ''}</h2>
                    <p className="reminder-popup-subtitle">
                        You have {reminders.length} due follow-up{reminders.length > 1 ? 's' : ''} from your treatment plan.
                    </p>
                </div>

                <ul className="reminder-popup-list">
                    {reminders.map((r) => (
                        <li key={r.id} className="reminder-popup-item">
                            <div className="reminder-popup-treatment">{r.treatment_type}</div>
                            <div className="reminder-popup-message">{r.message}</div>
                            <div className="reminder-popup-date">
                                <span className="reminder-popup-date-label">Follow-up date:</span>
                                <span className="reminder-popup-date-value">{fmtDate(r.reminder_date)}</span>
                            </div>
                        </li>
                    ))}
                </ul>

                {error && <p className="reminder-popup-error">{error}</p>}

                <div className="reminder-popup-footer">
                    <button
                        className="btn btn-primary reminder-popup-btn"
                        onClick={handleGotIt}
                        disabled={loading}
                    >
                        {loading ? 'Saving…' : 'Got it'}
                    </button>
                </div>
            </div>
        </div>
    );
}
