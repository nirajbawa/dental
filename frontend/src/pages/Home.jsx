import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const services = [
    { name: 'Dental Implants', desc: 'Permanent tooth replacement with natural-looking implants.' },
    { name: 'Root Canal', desc: 'Pain-free root canal treatment with modern techniques.' },
    { name: 'Smile Design', desc: 'Transform your smile with custom cosmetic procedures.' },
    { name: 'Teeth Whitening', desc: 'Professional whitening for a brighter, confident smile.' },
    { name: 'Orthodontics', desc: 'Braces and aligners for perfectly aligned teeth.' },
    { name: 'Gum Surgery', desc: 'Advanced periodontal care for healthy gums.' },
];

export default function Home() {
    const { user } = useAuth();

    return (
        <div className="home">
            {/* Hero */}
            <section className="hero">
                <div className="container hero-content">
                    <div className="hero-text">
                        <span className="hero-tag">Nashik's Trusted Dental Care</span>
                        <h1>Your Perfect Smile Starts Here</h1>
                        <p>
                            Expert dental care by Dr. Manjiri Salkar — Dentist, Prosthodontist,
                            Implantologist and Smile Designer. Serving Nashik with precision and compassion.
                        </p>
                        <div className="hero-actions">
                            {user?.role === 'patient' ? (
                                <Link to="/book" className="btn btn-primary">Book Appointment</Link>
                            ) : (
                                <Link to="/signup" className="btn btn-primary">Get Started</Link>
                            )}
                            <a
                                href="https://wa.me/918262936861?text=Hello%20I%20would%20like%20to%20book%20an%20appointment%20at%20The%20Smile%20Dental%20Clinic"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline"
                            >
                                WhatsApp Us
                            </a>
                        </div>
                        <div className="hero-stats">
                            <div className="stat"><strong>500+</strong><span>Happy Patients</span></div>
                            <div className="stat"><strong>6+</strong><span>Years Experience</span></div>
                            <div className="stat"><strong>15+</strong><span>Treatments</span></div>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-card">
                            <div className="hero-card-icon">+</div>
                            <h3>Dr. Manjiri Salkar</h3>
                            <p>BDS, MDS (Prosthodontics)</p>
                            <div className="hero-card-tags">
                                <span>Implantologist</span>
                                <span>Smile Designer</span>
                                <span>Prosthodontist</span>
                            </div>
                            <div className="clinic-info">
                                <p>Gaurav Accident Clinic</p>
                                <p>Nashik, Maharashtra</p>
                                <p>Mon – Sat: 10:30 AM – 7:30 PM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services */}
            <section className="section services-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Our Services</h2>
                        <p>Comprehensive dental care under one roof</p>
                    </div>
                    <div className="services-grid">
                        {services.map((s) => (
                            <div key={s.name} className="service-card">
                                <div className="service-icon">+</div>
                                <h3>{s.name}</h3>
                                <p>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="section-cta">
                        <Link to="/services" className="btn btn-outline">View All Services</Link>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="section why-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Why Choose Us</h2>
                        <p>We combine expertise with a patient-first approach</p>
                    </div>
                    <div className="why-grid">
                        {[
                            { title: 'Expert Doctor', desc: 'Specialist in prosthodontics, implants and smile design.' },
                            { title: 'Modern Equipment', desc: 'Latest dental technology for precise, comfortable treatment.' },
                            { title: 'Affordable Care', desc: 'Quality dental care at transparent, fair pricing.' },
                            { title: 'Easy Booking', desc: 'Book appointments online in minutes, 24/7.' },
                        ].map((w) => (
                            <div key={w.title} className="why-card">
                                <h4>{w.title}</h4>
                                <p>{w.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section cta-section">
                <div className="container cta-inner">
                    <h2>Ready for a Healthier Smile?</h2>
                    <p>Book your consultation today. Consultation fee: Rs. 400 only.</p>
                    <div className="hero-actions">
                        {user?.role === 'patient' ? (
                            <Link to="/book" className="btn btn-primary">Book Now</Link>
                        ) : (
                            <Link to="/signup" className="btn btn-primary">Create Account</Link>
                        )}
                        <a
                            href="https://wa.me/918262936861?text=Hello%20I%20would%20like%20to%20book%20an%20appointment%20at%20The%20Smile%20Dental%20Clinic"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline"
                        >
                            WhatsApp
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
