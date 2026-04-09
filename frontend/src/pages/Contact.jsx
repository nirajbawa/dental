import React, { useState } from 'react';
import './Contact.css';

export default function Contact() {
    const [form, setForm] = useState({ name: '', phone: '', message: '' });
    const [sent, setSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Redirect to WhatsApp with message
        const text = encodeURIComponent(`Hello, I am ${form.name} (${form.phone}). ${form.message}`);
        window.open(`https://wa.me/918262936861?text=${text}`, '_blank');
        setSent(true);
    };

    return (
        <div className="contact-page">
            <div className="contact-hero">
                <div className="container">
                    <h1>Contact Us</h1>
                    <p>We're here to help. Reach out anytime.</p>
                </div>
            </div>

            <div className="container contact-content">
                <div className="contact-grid">
                    <div className="contact-info">
                        <h2>Get in Touch</h2>
                        <p>Visit us at the clinic or send a message via WhatsApp. We respond promptly.</p>

                        <div className="contact-details">
                            <div className="contact-item">
                                <div className="contact-icon">L</div>
                                <div>
                                    <strong>Location</strong>
                                    <p>Gaurav Accident Clinic, Nashik, Maharashtra, India</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <div className="contact-icon">P</div>
                                <div>
                                    <strong>Phone / WhatsApp</strong>
                                    <p>+91 82629 36861</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <div className="contact-icon">H</div>
                                <div>
                                    <strong>Clinic Hours</strong>
                                    <p>Monday – Saturday: 10:30 AM – 7:30 PM</p>
                                    <p>Sunday: Closed</p>
                                </div>
                            </div>
                        </div>

                        <a
                            href="https://wa.me/918262936861?text=Hello%20I%20would%20like%20to%20book%20an%20appointment%20at%20The%20Smile%20Dental%20Clinic"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ background: '#25d366', marginTop: 8 }}
                        >
                            Open WhatsApp
                        </a>
                    </div>

                    <div className="contact-form-wrap">
                        <div className="card">
                            <h3>Send a Message</h3>
                            {sent ? (
                                <div className="alert alert-success">Message sent via WhatsApp. We'll respond shortly.</div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label>Your Name</label>
                                        <input type="text" className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="tel" className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit number" maxLength={10} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Message</label>
                                        <textarea className="form-control" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="How can we help you?" required />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-full">Send via WhatsApp</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
