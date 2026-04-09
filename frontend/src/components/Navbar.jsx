import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMenuOpen(false);
    };

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
                    <span className="brand-icon">+</span>
                    <div>
                        <span className="brand-name">The Smile Dental Clinic</span>
                        <span className="brand-sub">Dr. Manjiri Salkar</span>
                    </div>
                </Link>

                <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
                    <span /><span /><span />
                </button>

                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    <Link to="/" className={isActive('/')} onClick={() => setMenuOpen(false)}>Home</Link>
                    <Link to="/services" className={isActive('/services')} onClick={() => setMenuOpen(false)}>Services</Link>
                    <Link to="/about" className={isActive('/about')} onClick={() => setMenuOpen(false)}>About</Link>
                    <Link to="/contact" className={isActive('/contact')} onClick={() => setMenuOpen(false)}>Contact</Link>

                    {!user && (
                        <>
                            <Link to="/login" className={`btn btn-outline btn-sm ${isActive('/login')}`} onClick={() => setMenuOpen(false)}>Login</Link>
                            <Link to="/signup" className="btn btn-sm navbar-signup" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                        </>
                    )}

                    {user?.role === 'patient' && (
                        <>
                            <Link to="/book" className={`btn btn-primary btn-sm ${isActive('/book')}`} onClick={() => setMenuOpen(false)}>Book Appointment</Link>
                            <Link to="/dashboard" className={isActive('/dashboard')} onClick={() => setMenuOpen(false)}>Dashboard</Link>
                            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
                        </>
                    )}

                    {user?.role === 'admin' && (
                        <>
                            <Link to="/admin" className={`btn btn-primary btn-sm ${isActive('/admin')}`} onClick={() => setMenuOpen(false)}>Admin Panel</Link>
                            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
