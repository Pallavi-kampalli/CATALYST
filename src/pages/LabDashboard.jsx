import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import TrendChart from '../components/TrendChart';
import RiskBadge from '../components/RiskBadge';

// Simulated lab test requests
const LAB_REQUESTS = [
    { id: 1, patient: 'Maria Rodriguez', test: 'CBC + CRP', status: 'pending', urgency: 'high', requested: '2026-02-20', doctor: 'Dr. Mitchell' },
    { id: 2, patient: 'James Chen', test: 'ESR + D-Dimer', status: 'pending', urgency: 'moderate', requested: '2026-02-20', doctor: 'Dr. Mitchell' },
    { id: 3, patient: 'Tom Mitchell', test: 'Blood Culture x2', status: 'in-progress', urgency: 'high', requested: '2026-02-19', doctor: 'Dr. Patel' },
    { id: 4, patient: 'Aisha Patel', test: 'Urinalysis', status: 'completed', urgency: 'low', requested: '2026-02-19', doctor: 'Dr. Mitchell' },
    { id: 5, patient: 'Robert Kim', test: 'LFT / KFT Panel', status: 'pending', urgency: 'moderate', requested: '2026-02-18', doctor: 'Dr. Sharma' },
    { id: 6, patient: 'Sofia Okafor', test: 'Troponin I + BNP', status: 'completed', urgency: 'high', requested: '2026-02-18', doctor: 'Dr. Mitchell' },
    { id: 7, patient: 'Emma Stone', test: 'Stool Culture', status: 'in-progress', urgency: 'moderate', requested: '2026-02-17', doctor: 'Dr. Patel' },
];

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '⏳' },
    'in-progress': { label: 'In Progress', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: '🔬' },
    completed: { label: 'Completed', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', icon: '✅' },
};
const URGENCY_CONFIG = {
    high: { label: 'Urgent', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    moderate: { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    low: { label: 'Routine', color: '#4ade80', bg: 'rgba(74,222,128,0.10)' },
};

export default function LabDashboard() {
    const { user, logout } = useAuth();
    const [requests, setRequests] = useState(LAB_REQUESTS);
    const [filter, setFilter] = useState('all');
    const [uploading, setUploading] = useState(null);
    const [uploaded, setUploaded] = useState(new Set());

    const filtered = filter === 'all'
        ? requests
        : requests.filter((r) => r.status === filter);

    const pending = requests.filter((r) => r.status === 'pending').length;
    const inProg = requests.filter((r) => r.status === 'in-progress').length;
    const completed = requests.filter((r) => r.status === 'completed').length;

    const handleUpload = async (id) => {
        setUploading(id);
        await new Promise((r) => setTimeout(r, 1200));
        setRequests((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: 'completed' } : r))
        );
        setUploaded((prev) => new Set([...prev, id]));
        setUploading(null);
    };

    return (
        <div className="lab-dashboard">
            {/* Header */}
            <header className="lab-header">
                <div className="header-logo">
                    <span className="logo-icon">🩺</span>
                    <div>
                        <span className="logo-text">Recovery<span className="logo-accent">Companion</span></span>
                        <span className="lab-header-badge">Lab Portal</span>
                    </div>
                </div>
                <div className="lab-header-right">
                    <div className="lab-user-info">
                        <span className="lab-user-icon">🔬</span>
                        <div>
                            <div className="lab-user-name">{user?.name}</div>
                            <div className="lab-user-role">Lab Practitioner</div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={logout}>
                        ← Logout
                    </button>
                </div>
            </header>

            {/* Summary Stats */}
            <div className="lab-stats">
                <div className="lab-stat-card lab-stat-card--pending">
                    <span className="lab-stat-icon">⏳</span>
                    <div className="lab-stat-value">{pending}</div>
                    <div className="lab-stat-label">Pending</div>
                </div>
                <div className="lab-stat-card lab-stat-card--inprog">
                    <span className="lab-stat-icon">🔬</span>
                    <div className="lab-stat-value">{inProg}</div>
                    <div className="lab-stat-label">In Progress</div>
                </div>
                <div className="lab-stat-card lab-stat-card--done">
                    <span className="lab-stat-icon">✅</span>
                    <div className="lab-stat-value">{completed}</div>
                    <div className="lab-stat-label">Completed</div>
                </div>
                <div className="lab-stat-card lab-stat-card--total">
                    <span className="lab-stat-icon">📋</span>
                    <div className="lab-stat-value">{requests.length}</div>
                    <div className="lab-stat-label">Total Requests</div>
                </div>
            </div>

            {/* Main content */}
            <div className="lab-content">
                <div className="lab-panel">
                    {/* Panel header */}
                    <div className="lab-panel-header">
                        <h2 className="lab-panel-title">Test Requests</h2>
                        <div className="lab-filter-tabs">
                            {['all', 'pending', 'in-progress', 'completed'].map((f) => (
                                <button
                                    key={f}
                                    className={`lab-filter-btn ${filter === f ? 'lab-filter-btn--active' : ''}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress'
                                        : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Request list */}
                    <div className="lab-request-list">
                        {filtered.map((req) => {
                            const sc = STATUS_CONFIG[req.status];
                            const uc = URGENCY_CONFIG[req.urgency];
                            const isUploading = uploading === req.id;
                            const isDone = req.status === 'completed';
                            return (
                                <div key={req.id} className={`lab-request-card lab-request-card--${req.urgency}`}>
                                    <div className="lab-request-top">
                                        <div className="lab-request-patient">
                                            <span className="lab-patient-icon">🧑‍⚕️</span>
                                            <div>
                                                <div className="lab-patient-name">{req.patient}</div>
                                                <div className="lab-patient-meta">Requested by {req.doctor} · {req.requested}</div>
                                            </div>
                                        </div>
                                        <div className="lab-request-badges">
                                            <span className="lab-badge" style={{ color: uc.color, background: uc.bg }}>
                                                {uc.label}
                                            </span>
                                            <span className="lab-badge" style={{ color: sc.color, background: sc.bg }}>
                                                {sc.icon} {sc.label}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="lab-test-name">
                                        <span className="lab-test-icon">🧪</span>
                                        {req.test}
                                    </div>

                                    {!isDone && (
                                        <div className="lab-request-actions">
                                            <button
                                                className="lab-upload-btn"
                                                onClick={() => handleUpload(req.id)}
                                                disabled={isUploading}
                                            >
                                                {isUploading ? '⏳ Uploading results…' : '📤 Upload Results'}
                                            </button>
                                            {req.status === 'pending' && (
                                                <button
                                                    className="lab-start-btn"
                                                    onClick={() =>
                                                        setRequests((prev) =>
                                                            prev.map((r) => (r.id === req.id ? { ...r, status: 'in-progress' } : r))
                                                        )
                                                    }
                                                >
                                                    ▶ Start Processing
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {isDone && (
                                        <div className="lab-done-note">
                                            ✅ Results submitted · {uploaded.has(req.id) ? 'Just now' : req.requested}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Info panel */}
                <div className="lab-info-panel">
                    <div className="lab-info-card">
                        <h3 className="lab-info-title">🔒 Access Scope</h3>
                        <ul className="lab-info-list">
                            <li>✅ View test requests assigned to lab</li>
                            <li>✅ Upload and submit lab results</li>
                            <li>✅ Mark requests as in-progress</li>
                            <li>🚫 Symptom logs (restricted)</li>
                            <li>🚫 Risk scores (restricted)</li>
                            <li>🚫 Clinical dashboard (restricted)</li>
                        </ul>
                    </div>
                    <div className="lab-info-card">
                        <h3 className="lab-info-title">📊 Today's Summary</h3>
                        <div className="lab-summary-items">
                            <div className="lab-summary-row"><span>Urgent pending</span><span className="lab-sum-val red">{requests.filter(r => r.urgency === 'high' && r.status === 'pending').length}</span></div>
                            <div className="lab-summary-row"><span>Awaiting doctor review</span><span className="lab-sum-val yellow">{completed}</span></div>
                            <div className="lab-summary-row"><span>Your shift starts</span><span className="lab-sum-val">08:00 AM</span></div>
                            <div className="lab-summary-row"><span>Turnaround target</span><span className="lab-sum-val">4 hrs</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
