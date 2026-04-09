import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './PaymentPortal.css';

const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return; }
        const existing = document.getElementById('razorpay-script');
        if (existing) { existing.addEventListener('load', () => resolve(true)); return; }
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

export default function PaymentPortal() {
    const location = useLocation();
    const navigate = useNavigate();
    const { appointment_id, name, email, phone, treatment_type, date, time } = location.state || {};

    const [status, setStatus] = useState('idle'); // idle | loading | processing | success | failed
    const [errorMsg, setErrorMsg] = useState('');
    const [paymentId, setPaymentId] = useState('');

    // Redirect if accessed directly without state
    useEffect(() => {
        if (!appointment_id) navigate('/book', { replace: true });
    }, [appointment_id, navigate]);

    const initiatePayment = async () => {
        setStatus('loading');
        setErrorMsg('');

        try {
            // Step 1: Create order on backend
            const { data: orderData } = await api.post('/razorpay/create-order', { appointment_id });

            // Step 2: TEST MODE — skip SDK, simulate payment UI
            if (orderData.test_mode) {
                setStatus('processing');
                // Simulate a 1.5s processing delay then auto-complete
                setTimeout(async () => {
                    try {
                        await api.post('/razorpay/verify', {
                            razorpay_order_id: orderData.order_id,
                            razorpay_payment_id: 'TEST_PAY_' + Date.now(),
                            razorpay_signature: 'TEST_SIG',
                            appointment_id
                        });
                        setPaymentId(orderData.order_id);
                        setStatus('success');
                    } catch {
                        setStatus('failed');
                        setErrorMsg('Payment simulation failed. Please try again.');
                    }
                }, 1500);
                return;
            }

            // Step 3: LIVE MODE — load Razorpay SDK and open checkout
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                setStatus('failed');
                setErrorMsg('Razorpay SDK failed to load. Check your internet connection.');
                return;
            }

            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'The Smile Dental Clinic',
                description: `Consultation Fee — ${treatment_type}`,
                image: '',
                order_id: orderData.order_id,
                prefill: { name, email, contact: phone },
                notes: { appointment_id: String(appointment_id) },
                theme: { color: '#1a6b8a' },
                handler: async (response) => {
                    setStatus('processing');
                    try {
                        await api.post('/razorpay/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            appointment_id
                        });
                        setPaymentId(response.razorpay_payment_id);
                        setStatus('success');
                    } catch {
                        setStatus('failed');
                        setErrorMsg('Payment received but verification failed. Please contact the clinic.');
                    }
                },
                modal: {
                    ondismiss: () => {
                        setStatus('idle');
                        setErrorMsg('Payment was cancelled. You can try again or pay at the clinic.');
                    }
                }
            };

            setStatus('idle');
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (r) => {
                setStatus('failed');
                setErrorMsg(`Payment failed: ${r.error.description}`);
            });
            rzp.open();

        } catch (err) {
            setStatus('failed');
            setErrorMsg(err.response?.data?.message || 'Could not initiate payment. Please try again.');
        }
    };

    if (!appointment_id) return null;

    return (
        <div className="payment-portal-page">
            <div className="payment-portal-card">

                {/* Header */}
                <div className="pp-header">
                    <div className="pp-logo">+</div>
                    <h2>The Smile Dental Clinic</h2>
                    <p>Dr. Manjiri Salkar</p>
                </div>

                {/* Order Summary */}
                <div className="pp-summary">
                    <div className="pp-summary-title">Payment Summary</div>
                    <div className="pp-row"><span>Patient</span><strong>{name}</strong></div>
                    <div className="pp-row"><span>Treatment</span><strong>{treatment_type}</strong></div>
                    <div className="pp-row"><span>Appointment</span><strong>{date} at {time}</strong></div>
                    <div className="pp-row pp-total"><span>Consultation Fee</span><strong>Rs. 400</strong></div>
                </div>

                {/* Payment Methods Info */}
                <div className="pp-methods">
                    <span>UPI</span>
                    <span>Debit Card</span>
                    <span>Credit Card</span>
                    <span>Net Banking</span>
                    <span>Wallets</span>
                </div>

                {/* Status States */}
                {status === 'idle' && (
                    <>
                        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
                        <button className="btn btn-primary pp-pay-btn" onClick={initiatePayment}>
                            Pay Rs. 400 Securely
                        </button>
                        <button className="pp-skip" onClick={() => navigate('/dashboard')}>
                            Pay at clinic instead
                        </button>
                    </>
                )}

                {status === 'loading' && (
                    <div className="pp-status">
                        <div className="spinner" />
                        <p>Connecting to payment gateway...</p>
                    </div>
                )}

                {status === 'processing' && (
                    <div className="pp-status">
                        <div className="pp-processing-icon">
                            <div className="spinner" />
                        </div>
                        <p>Processing your payment...</p>
                        <p className="pp-sub">Please do not close this window.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="pp-status pp-success">
                        <div className="pp-check">✓</div>
                        <h3>Payment Successful</h3>
                        <p>Rs. 400 paid for your consultation.</p>
                        {paymentId && <p className="pp-ref">Ref: {paymentId}</p>}
                        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </button>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="pp-status pp-failed">
                        <div className="pp-cross">✕</div>
                        <h3>Payment Failed</h3>
                        <p>{errorMsg}</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" onClick={() => { setStatus('idle'); setErrorMsg(''); }}>
                                Try Again
                            </button>
                            <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
                                Pay at Clinic
                            </button>
                        </div>
                    </div>
                )}

                <div className="pp-secure">
                    <span>Secured by Razorpay</span>
                </div>
            </div>
        </div>
    );
}
