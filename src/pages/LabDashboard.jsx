import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

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
    const { addNotification, getNotifications, getUnreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [requests, setRequests] = useState(LAB_REQUESTS);
    const [filter, setFilter] = useState('all');
    const [uploading, setUploading] = useState(null);
    const [uploaded, setUploaded] = useState(new Set());
    const [view, setView] = useState('requests'); // 'requests' | 'notifications'

    const labNotifs = getNotifications('lab');
    const unreadCount = getUnreadCount('lab');

    const filtered = filter === 'all'
        ? requests
        : requests.filter((r) => r.status === filter);

    const pending = requests.filter((r) => r.status === 'pending').length;
    const inProg = requests.filter((r) => r.status === 'in-progress').length;
    const completed = requests.filter((r) => r.status === 'completed').length;

    const handleUpload = async (id) => {
        setUploading(id);
        await new Promise((r) => setTimeout(r, 1200));

        const req = requests.find(r => r.id === id);

        setRequests((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: 'completed' } : r))
        );
        setUploaded((prev) => new Set([...prev, id]));
        setUploading(null);

        // Notify Doctor
        addNotification({
            targetUserRole: 'doctor',
            type: 'Lab Report Uploaded',
            message: `Lab uploaded results for ${req.test} (${req.patient}).`,
            sender: 'Lab System'
        });

        // Notify Nurse
        addNotification({
            targetUserRole: 'nurse',
            type: 'Lab Report Uploaded',
            message: `Lab uploaded results for ${req.test} (${req.patient}).`,
            sender: 'Lab System'
        });

        // Notify Patient
        addNotification({
            targetUserRole: 'patient',
            type: 'New Lab Report',
            message: `Your lab results for ${req.test} are now available.`,
            sender: 'Lab System'
        });
    };

    return (
        <div className="dashboard doctor-dash">
            {/* Sidebar */}
            <aside className="doctor-sidebar">
                <div className="doctor-sidebar-logo">🔬</div>
                <nav className="doctor-sidebar-nav">
                    <button className={`doctor-nav-icon-btn ${view === 'requests' ? 'doctor-nav-icon-btn--active' : ''}`} onClick={() => setView('requests')} title="Test Requests">
                        🧪
                        <span className="doctor-nav-tooltip">Requests</span>
                    </button>
                    <button className={`doctor-nav-icon-btn ${view === 'notifications' ? 'doctor-nav-icon-btn--active' : ''}`} onClick={() => setView('notifications')} title="Notifications" style={{ position: 'relative' }}>
                        🔔
                        {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                        <span className="doctor-nav-tooltip">Notifications</span>
                    </button>
                </nav>
                <button className="doctor-sidebar-logout" onClick={logout} title="Logout">
                    🚪
                    <span className="doctor-nav-tooltip">Logout</span>
                </button>
            </aside>

            {/* Main Area */}
            <main className="doctor-main">
                <div className="dash-topbar">
                    <div>
                        <h1 className="dash-title">{view === 'requests' ? 'Lab Portal' : 'Notifications'}</h1>
                        <p className="dash-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="dash-topbar-right">
                        <span className="dash-role-badge dash-role-badge--intern">🔬 Lab Practitioner</span>
                        <span className="dash-user">{user?.name || 'Lab Tech'}</span>
                        <span className="dash-avatar">👨‍🔬</span>
                    </div>
                </div>

                <div className="doctor-content-container">
                    {view === 'requests' ? (
                        <div className="doctor-home-content" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Summary Stats */}
                            <div className="team-overview-grid">
                                <div className="stat-card">
                                    <div className="stat-card-top">
                                        <span className="stat-icon stat-icon--high">⏳</span>
                                        <span className="stat-label">Pending</span>
                                    </div>
                                    <div className="stat-value">{pending}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-top">
                                        <span className="stat-icon stat-icon--moderate">🔬</span>
                                        <span className="stat-label">In Progress</span>
                                    </div>
                                    <div className="stat-value">{inProg}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-top">
                                        <span className="stat-icon stat-icon--stable">✅</span>
                                        <span className="stat-label">Completed</span>
                                    </div>
                                    <div className="stat-value">{completed}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-top">
                                        <span className="stat-icon stat-icon--total">📋</span>
                                        <span className="stat-label">Total Requests</span>
                                    </div>
                                    <div className="stat-value">{requests.length}</div>
                                </div>
                            </div>

                            {/* Content Split */}
                            <div className="dash-split" style={{ gridTemplateColumns: '1fr', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <section className="risk-section">
                                    <div className="risk-section-header" style={{ justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span className="risk-section-dot risk-section-dot--moderate" />
                                            <h2 className="risk-section-title">Test Requests <span className="risk-section-count">({filtered.length})</span></h2>
                                        </div>
                                        <div className="lab-filter-tabs">
                                            {['all', 'pending', 'in-progress', 'completed'].map((f) => (
                                                <button
                                                    key={f}
                                                    className={`lab-filter-btn ${filter === f ? 'lab-filter-btn--active' : ''}`}
                                                    onClick={() => setFilter(f)}
                                                >
                                                    {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="lab-request-grid">
                                        {filtered.map((req) => {
                                            const sc = STATUS_CONFIG[req.status];
                                            const uc = URGENCY_CONFIG[req.urgency];
                                            const isUploading = uploading === req.id;
                                            const isDone = req.status === 'completed';
                                            return (
                                                <div key={req.id} className="lab-request-card">
                                                    <div className="lab-request-top">
                                                        <div className="lab-request-patient-info">
                                                            <div className="lab-request-patient-name">{req.patient}</div>
                                                            <div className="lab-request-meta">Requested by {req.doctor} · {req.requested}</div>
                                                        </div>
                                                        <span className="pcase-risk-badge" style={{ color: sc.color, background: sc.bg }}>{sc.icon} {sc.label}</span>
                                                    </div>

                                                    <div className="lab-request-middle">
                                                        <div className="lab-test-type">
                                                            <span className="lab-test-icon">🧪</span>
                                                            <span className="lab-test-name">{req.test}</span>
                                                        </div>
                                                        <span className="pcase-risk-badge" style={{ color: uc.color, background: uc.bg, fontSize: '12px' }}>{uc.label}</span>
                                                    </div>

                                                    <div className="lab-request-footer">
                                                        {!isDone && (
                                                            <div className="lab-actions">
                                                                {req.status === 'pending' && (
                                                                    <button
                                                                        className="lab-action-btn lab-action-btn--secondary"
                                                                        onClick={() =>
                                                                            setRequests((prev) =>
                                                                                prev.map((r) => (r.id === req.id ? { ...r, status: 'in-progress' } : r))
                                                                            )
                                                                        }
                                                                    >
                                                                        ▶ Start
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="lab-action-btn lab-action-btn--primary"
                                                                    onClick={() => handleUpload(req.id)}
                                                                    disabled={isUploading}
                                                                >
                                                                    {isUploading ? '⏳ Uploading…' : '📤 Upload Results'}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {isDone && (
                                                            <div className="lab-done-note">
                                                                ✅ Results submitted · {uploaded.has(req.id) ? 'Just now' : req.requested}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <div className="doctor-home-content">
                            <section className="risk-section">
                                <div className="risk-section-header" style={{ justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className="risk-section-dot risk-section-dot--stable" />
                                        <h2 className="risk-section-title">Notifications</h2>
                                    </div>
                                    {unreadCount > 0 && (
                                        <button className="lab-filter-btn" onClick={() => markAllAsRead('lab')}>
                                            Mark All as Read
                                        </button>
                                    )}
                                </div>

                                {labNotifs.length === 0 ? (
                                    <div className="lab-empty-state">
                                        No notifications yet.
                                    </div>
                                ) : (
                                    <div className="lab-notification-list">
                                        {labNotifs.map(n => (
                                            <div key={n.id} className="lab-notification-item" style={{ opacity: n.read ? 0.7 : 1 }}>
                                                <div className="lab-notification-content">
                                                    <div className="lab-notification-icon">🔔</div>
                                                    <div>
                                                        <div className="lab-notification-title">{n.type} <span className="lab-notification-sender">from {n.sender}</span></div>
                                                        <div className="lab-notification-message">{n.message}</div>
                                                        <div className="lab-notification-time">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </div>
                                                </div>
                                                {!n.read && (
                                                    <button className="lab-action-btn lab-action-btn--secondary" onClick={() => markAsRead(n.id)}>
                                                        Mark Read
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
