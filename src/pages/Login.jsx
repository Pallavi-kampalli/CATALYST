import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';

const ROLE_OPTIONS = [
    { value: 'doctor', label: '🩺 Doctor' },
    { value: 'nurse', label: '💉 Nurse' },
    { value: 'patient', label: '🏥 Patient' },
    { value: 'lab', label: '🔬 Lab Practitioner' },
];

export default function Login() {
    const { login, signup, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('patient');
    const [error, setError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    // Already logged in → go home
    if (user?.isAuthenticated) {
        const dest = ROLE_HOME[user.role] || '/';
        navigate(dest, { replace: true });
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
            setError('Please fill in all required fields.');
            return;
        }

        setAuthLoading(true);
        let result;
        if (isLogin) {
            result = await login(email.trim(), password);
        } else {
            result = await signup(email.trim(), password, name.trim(), role);
        }
        setAuthLoading(false);

        if (!result.success) {
            setError(result.error);
            return;
        }

        // Navigate after signup/login
        const from = location.state?.from?.pathname;
        if (!isLogin) {
            // After signup, redirect explicitly per role (patients → onboarding)
            const r = result.user?.role || role;
            if (r === 'patient') {
                navigate('/patient-onboarding', { replace: true });
            } else {
                navigate(ROLE_HOME[r] || '/', { replace: true });
            }
        } else {
            const dest = from && from !== '/login' ? from : ROLE_HOME[result.user?.role || role] || '/';
            navigate(dest, { replace: true });
        }
    };

    return (
        <div className="login-page">
            <div className="login-blob login-blob--1" />
            <div className="login-blob login-blob--2" />
            <div className="login-blob login-blob--3" />

            <div className="login-card">
                <div className="login-logo">
                    <span className="login-logo-icon">🩺</span>
                    <div>
                        <div className="login-logo-text">Heal<span className="logo-accent">Track</span></div>
                        <div className="login-logo-sub">Secure Clinical Access Portal</div>
                    </div>
                </div>

                <h1 className="login-title">{isLogin ? 'Welcome back' : 'Create Account'}</h1>
                <p className="login-subtitle">{isLogin ? 'Sign in to your account' : 'Join the recovery network'}</p>

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    {!isLogin && (
                        <>
                            <div className="login-field">
                                <label className="login-label">Full Name</label>
                                <div className="login-input-wrap">
                                    <span className="login-input-icon">👤</span>
                                    <input className="login-input" type="text" placeholder="Enter your name"
                                        value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                            </div>
                            <div className="login-field">
                                <label className="login-label">Assign Role</label>
                                <div className="login-roles">
                                    {ROLE_OPTIONS.map((r) => (
                                        <button key={r.value} type="button"
                                            className={`role-chip ${role === r.value ? 'role-chip--active' : ''}`}
                                            onClick={() => setRole(r.value)}>
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="login-field">
                        <label className="login-label">Email address</label>
                        <div className="login-input-wrap">
                            <span className="login-input-icon">✉️</span>
                            <input className="login-input" type="email" placeholder="Enter your email"
                                value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                        </div>
                    </div>

                    <div className="login-field">
                        <label className="login-label">Password</label>
                        <div className="login-input-wrap">
                            <span className="login-input-icon">🔒</span>
                            <input className="login-input" type={showPass ? 'text' : 'password'} placeholder="Enter password"
                                value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                            <button type="button" className="login-show-pass" onClick={() => setShowPass(!showPass)}>
                                {showPass ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {error && <div className="login-error"><span>⚠️</span> {error}</div>}

                    <button className="login-btn" type="submit" disabled={authLoading}>
                        {authLoading ? '⏳ Authenticating…' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div className="login-toggle" style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#94a3b8' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button type="button" onClick={() => setIsLogin(!isLogin)}
                        style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: 'bold' }}>
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
}
