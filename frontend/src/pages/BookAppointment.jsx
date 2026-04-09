import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './BookAppointment.css';

const ALL_SLOTS = [
    '10:30 AM', '11:30 AM', '12:30 PM',
    '2:30 PM', '3:30 PM', '4:30 PM',
    '5:30 PM', '6:30 PM', '7:30 PM'
];

const TREATMENTS = [
    'Implants', 'Root Canal', 'Whitening',
    'Braces', 'Extraction', 'Gum Surgery', 'General'
];

export default function BookAppointment() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: user?.name || '',
        phone: '',
        email: user?.email || '',
        date: '',
        time: '',
        treatment_type: '',
        payment_option: ''
    });
    const [bookedSlots, setBookedSlots] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!form.date) return;
        api.get(`/appointments/slots?date=${form.date}`)
            .then(({ data }) => setBookedSlots(data.booked_slots || []))
            .catch(() => setBookedSlots([]));
    }, [form.date]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value, ...(name === 'date' ? { time: '' } : {}) }));
    };

    const validate = () => {
        if (!form.name.trim()) return 'Name is required.';
        if (!/^[0-9]{10}$/.test(form.phone)) return 'Phone must be exactly 10 digits.';
        if (!form.email.trim()) return 'Email is required.';
        if (!form.date) return 'Please select a date.';
        if (!form.time) return 'Please select a time slot.';
        if (!form.treatment_type) return 'Please select a treatment type.';
        if (!form.payment_option) return 'Please select a payment option.';
        if (new Date(form.date) < new Date(new Date().toDateString())) return 'Please select a future date.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }
        setError('');
        setLoading(true);

        try {
            // Book the appointment — creates DB record
            const { data: bookData } = await api.post('/appointments', form);
            const appointment_id = bookData.appointment_id;

            if (form.payment_option === 'pay_later') {
                // Pay at clinic — go straight to dashboard
                navigate('/dashboard');
                return;
            }

            // Pay Now — navigate to dedicated payment portal
            navigate('/payment', {
                state: {
                    appointment_id,
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    treatment_type: form.treatment_type,
                    date: form.date,
                    time: form.time
                }
            });

        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed. Please try again.');
            setLoading(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="book-page">
            <div className="container">
                <div className="book-header">
                    <h1>Book an Appointment</h1>
                    <p>Schedule a consultation with Dr. Manjiri Salkar.</p>
                </div>

                <div className="book-layout">
                    <div className="book-form-wrap">
                        <div className="card">
                            <div className="fee-banner">Consultation Fee: Rs. 400</div>

                            {error && <div className="alert alert-error">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" name="name" className="form-control"
                                            value={form.name} onChange={handleChange}
                                            placeholder="Your full name" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="tel" name="phone" className="form-control"
                                            value={form.phone} onChange={handleChange}
                                            placeholder="10-digit number" maxLength={10} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" name="email" className="form-control"
                                        value={form.email} onChange={handleChange}
                                        placeholder="your@email.com" required />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Preferred Date</label>
                                        <input type="date" name="date" className="form-control"
                                            value={form.date} onChange={handleChange}
                                            min={today} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Treatment Type</label>
                                        <select name="treatment_type" className="form-control"
                                            value={form.treatment_type} onChange={handleChange} required>
                                            <option value="">Select treatment</option>
                                            {TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Time Slots */}
                                <div className="form-group">
                                    <label>
                                        Select Time Slot
                                        {form.date && <span className="slot-date"> ({form.date})</span>}
                                    </label>
                                    {!form.date ? (
                                        <p className="slot-hint">Select a date first to see available slots.</p>
                                    ) : (
                                        <div className="slots-grid">
                                            {ALL_SLOTS.map(slot => {
                                                const isBooked = bookedSlots.includes(slot);
                                                return (
                                                    <button key={slot} type="button"
                                                        className={`slot-btn ${form.time === slot ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                                                        onClick={() => !isBooked && setForm(prev => ({ ...prev, time: slot }))}
                                                        disabled={isBooked}>
                                                        {slot}
                                                        {isBooked && <span className="slot-label">Booked</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Payment Option */}
                                <div className="form-group">
                                    <label>Payment Option</label>
                                    <div className="payment-options">
                                        <label className={`payment-option ${form.payment_option === 'pay_now' ? 'selected' : ''}`}>
                                            <input type="radio" name="payment_option" value="pay_now"
                                                checked={form.payment_option === 'pay_now'}
                                                onChange={handleChange} />
                                            <div>
                                                <strong>Pay Now — Rs. 400</strong>
                                                <span>UPI, Card, Net Banking via Razorpay</span>
                                            </div>
                                            <span className="pay-badge online">Secure</span>
                                        </label>
                                        <label className={`payment-option ${form.payment_option === 'pay_later' ? 'selected' : ''}`}>
                                            <input type="radio" name="payment_option" value="pay_later"
                                                checked={form.payment_option === 'pay_later'}
                                                onChange={handleChange} />
                                            <div>
                                                <strong>Pay at Clinic — Rs. 400</strong>
                                                <span>Cash or card at the clinic counter</span>
                                            </div>
                                            <span className="pay-badge clinic">Clinic</span>
                                        </label>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                                    {loading
                                        ? 'Booking...'
                                        : form.payment_option === 'pay_now'
                                            ? 'Proceed to Pay Rs. 400'
                                            : 'Confirm Appointment'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="book-info">
                        <div className="card info-card">
                            <h3>Clinic Hours</h3>
                            <div className="info-row"><span>Monday – Saturday</span><span>10:30 AM – 7:30 PM</span></div>
                            <div className="info-row"><span>Sunday</span><span>Closed</span></div>
                        </div>
                        <div className="card info-card">
                            <h3>Location</h3>
                            <p>Gaurav Accident Clinic</p>
                            <p>Nashik, Maharashtra, India</p>
                        </div>
                        <div className="card info-card">
                            <h3>Payment Methods</h3>
                            <div className="payment-methods-list">
                                <span>UPI</span>
                                <span>Debit Card</span>
                                <span>Credit Card</span>
                                <span>Net Banking</span>
                                <span>Cash at Clinic</span>
                            </div>
                        </div>
                        <div className="card info-card">
                            <h3>Need Help?</h3>
                            <a href="https://wa.me/918262936861?text=Hello%20I%20would%20like%20to%20book%20an%20appointment%20at%20The%20Smile%20Dental%20Clinic"
                                target="_blank" rel="noopener noreferrer"
                                className="btn btn-sm"
                                style={{ background: '#25d366', color: 'white', width: '100%', justifyContent: 'center', display: 'flex' }}>
                                WhatsApp Us
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
