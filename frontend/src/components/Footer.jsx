import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-inner">
                <div className="footer-brand">
                    <div className="footer-logo">
                        <span className="brand-icon">+</span>
                        <div>
                            <span className="brand-name">The Smile Dental Clinic</span>
                            <span className="brand-sub">Dr. Manjiri Salkar</span>
                        </div>
                    </div>
                    <p className="footer-desc">
                        Dentist | Prosthodontist | Implantologist | Smile Designer<br />
                        Gaurav Accident Clinic, Nashik, Maharashtra
                    </p>
                    <a
                        href="https://wa.me/918262936861?text=Hello%20I%20would%20like%20to%20book%20an%20appointment%20at%20The%20Smile%20Dental%20Clinic"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm whatsapp-btn"
                    >
                        WhatsApp Us
                    </a>
                </div>

                <div className="footer-links">
                    <h4>Quick Links</h4>
                    <Link to="/">Home</Link>
                    <Link to="/services">Services</Link>
                    <Link to="/about">About Doctor</Link>
                    <Link to="/contact">Contact</Link>
                    <Link to="/book">Book Appointment</Link>
                </div>

                <div className="footer-contact">
                    <h4>Contact</h4>
                    <p>Gaurav Accident Clinic</p>
                    <p>Nashik, Maharashtra, India</p>
                    <p>+91 82629 36861</p>
                    <p>Mon – Sat: 10:30 AM – 7:30 PM</p>
                </div>
            </div>
            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} The Smile Dental Clinic. All rights reserved.</p>
                <Link to="/admin/login" className="admin-link">Admin Login</Link>
            </div>
        </footer>
    );
}
