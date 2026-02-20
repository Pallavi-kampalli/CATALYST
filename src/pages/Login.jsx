import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_HOME, DEMO_USERS } from '../context/AuthContext';

const ROLE_OPTIONS = [
    { value: 'doctor', label: '🩺 Doctor' },
    { value: 'nurse', label: '💉 Nurse' },
    { value: 'patient', label: '🏥 Patient' },
    { value: 'lab', label: '🔬 Lab Practitioner' },
];

const ROLE_FILL = {
    doctor: { email: 'doctor@test.com', password: '1234' },
    nurse: { email: 'nurse@test.com', password: '1234' },
    patient: { email: 'patient@test.com', password: '1234' },
    lab: { email: 'lab@test.com', password: '1234' },
};

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    // Already logged in → go home
    if (user?.isAuthenticated) {
        const dest = ROLE_HOME[user.role] || '/';
        navigate(dest, { replace: true });
        return null;
    }

    const handleRoleSelect = (r) => {
        setRole(r);
        // Auto-fill demo credentials for convenience
        if (ROLE_FILL[r]) {
            setEmail(ROLE_FILL[r].email);
            setPassword(ROLE_FILL[r].password);
        }
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password.');
            return;
        }
        setLoading(true);
        // Simulate async call
        await new Promise((r) => setTimeout(r, 600));
        const result = login(email.trim(), password);
        setLoading(false);
        if (!result.success) {
            setError(result.error);
            return;
        }
        // Navigate to the role's home route
        const from = location.state?.from?.pathname;
        const dest = from && from !== '/login' ? from : ROLE_HOME[result.user.role] || '/';
        navigate(dest, { replace: true });
    };

    return (
        <div className="login-page">
            {/* Animated blobs */}
            <div className="login-blob login-blob--1" />
            <div className="login-blob login-blob--2" />
            <div className="login-blob login-blob--3" />

            <div className="login-card">
                {/* Logo */}
                <div className="login-logo">
                    <span className="login-logo-icon">🩺</span>
                    <div>
                        <div className="login-logo-text">
                            Recovery<span className="logo-accent">Companion</span>
                        </div>
                        <div className="login-logo-sub">Secure Clinical Access Portal</div>
                    </div>
                </div>

                <h1 className="login-title">Welcome back</h1>
                <p className="login-subtitle">Sign in to your account to continue</p>

                {/* Role selector */}
                <div className="login-roles">
                    {ROLE_OPTIONS.map((r) => (
                        <button
                            key={r.value}
                            type="button"
                            className={`role-chip ${role === r.value ? 'role-chip--active' : ''}`}
                            onClick={() => handleRoleSelect(r.value)}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    {/* Email */}
                    <div className="login-field">
                        <label className="login-label">Email address</label>
                        <div className="login-input-wrap">
                            <span className="login-input-icon">✉️</span>
                            <input
                                className="login-input"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                autoComplete="email"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="login-field">
                        <label className="login-label">Password</label>
                        <div className="login-input-wrap">
                            <span className="login-input-icon">🔒</span>
                            <input
                                className="login-input"
                                type={showPass ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="login-show-pass"
                                onClick={() => setShowPass((s) => !s)}
                                tabIndex={-1}
                            >
                                {showPass ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="login-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button className="login-btn" type="submit" disabled={loading}>
                        {loading ? (
                            <span className="login-spinner">⏳ Authenticating…</span>
                        ) : (
                            <>Sign in to {role ? ROLE_OPTIONS.find((r) => r.value === role)?.label : 'your account'}</>
                        )}
                    </button>
                </form>

                {/* Demo Credentials Table */}
                <div className="login-demo">
                    <div className="login-demo-title">Demo credentials</div>
                    <div className="login-demo-grid">
                        {DEMO_USERS.map((u) => (
                            <button
                                key={u.role}
                                className="login-demo-row"
                                type="button"
                                onClick={() => {
                                    setEmail(u.email);
                                    setPassword(u.password);
                                    setRole(u.role);
                                    setError('');
                                }}
                            >
                                <span className="demo-role-badge demo-role-badge--{u.role}">
                                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                </span>
                                <span className="demo-email">{u.email}</span>
                                <span className="demo-pass">/ 1234</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
