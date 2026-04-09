import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
    return (
        <div className="about-page">
            <div className="about-hero">
                <div className="container">
                    <h1>About Dr. Manjiri Salkar</h1>
                    <p>Dentist | Prosthodontist | Implantologist | Smile Designer</p>
                </div>
            </div>

            <div className="container about-content">
                <div className="about-grid">
                    <div className="about-visual">
                        <div className="doctor-card">
                            <div className="doctor-avatar">
                                <img src="/images/doctor.jpg" alt="Dr. Manjiri Salkar" onError={e => { e.target.style.display = 'none'; e.target.parentNode.textContent = 'MS'; }} />
                            </div>
                            <h2>Dr. Manjiri Salkar</h2>
                            <p className="doctor-title">BDS, MDS (Prosthodontics)</p>
                            <div className="doctor-tags">
                                <span>Implantologist</span>
                                <span>Smile Designer</span>
                                <span>Prosthodontist</span>
                            </div>
                            <div className="doctor-clinic">
                                <p>Gaurav Accident Clinic</p>
                                <p>Nashik, Maharashtra</p>
                                <p>+91 82629 36861</p>
                            </div>
                        </div>
                    </div>

                    <div className="about-text">
                        <h2>Dedicated to Your Smile</h2>
                        <p>
                            Dr. Manjiri Salkar is a highly qualified dental specialist with expertise in
                            prosthodontics, dental implants, and smile design. With over 8 years of clinical
                            experience, she has helped hundreds of patients in Nashik achieve healthy,
                            beautiful smiles.
                        </p>
                        <p>
                            Her approach combines the latest dental technology with a compassionate,
                            patient-first philosophy. Every treatment plan is customized to meet the
                            individual needs and goals of each patient.
                        </p>

                        <div className="qualifications">
                            <h3>Qualifications</h3>
                            <ul>
                                <li>BDS — Bachelor of Dental Surgery</li>
                                <li>MDS — Master of Dental Surgery (Prosthodontics)</li>
                                <li>Certified Implantologist</li>
                                <li>Advanced Smile Design Training</li>
                            </ul>
                        </div>

                        <div className="specializations">
                            <h3>Specializations</h3>
                            <div className="spec-grid">
                                {['Dental Implants', 'Prosthodontics', 'Smile Design', 'Root Canal', 'Orthodontics', 'Cosmetic Dentistry'].map(s => (
                                    <span key={s} className="spec-tag">{s}</span>
                                ))}
                            </div>
                        </div>

                        <Link to="/book" className="btn btn-primary">Book a Consultation</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
