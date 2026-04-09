import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminLogin from './pages/AdminLogin';
import BookAppointment from './pages/BookAppointment';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PaymentPortal from './pages/PaymentPortal';

// Redirects unauthenticated users to login, preserving intended destination
const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    if (role && user.role !== role) {
        // Wrong role — send to their correct home
        return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
    }
    return children;
};

const AppRoutes = () => {
    const { user } = useAuth();

    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

                {/* Auth routes — redirect if already logged in */}
                <Route path="/login" element={
                    user
                        ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
                        : <Login />
                } />
                <Route path="/signup" element={
                    user
                        ? <Navigate to="/dashboard" replace />
                        : <Signup />
                } />
                <Route path="/admin/login" element={
                    user?.role === 'admin'
                        ? <Navigate to="/admin" replace />
                        : <AdminLogin />
                } />

                {/* Patient protected routes */}
                <Route path="/book" element={
                    <ProtectedRoute role="patient"><BookAppointment /></ProtectedRoute>
                } />
                <Route path="/payment" element={
                    <ProtectedRoute role="patient"><PaymentPortal /></ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute role="patient"><UserDashboard /></ProtectedRoute>
                } />

                {/* Admin protected route */}
                <Route path="/admin" element={
                    <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
        </>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}
