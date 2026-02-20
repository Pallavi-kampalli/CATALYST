import React, { useState, useMemo } from 'react';
import PatientList from '../components/PatientList';
import AlertPanel from '../components/AlertPanel';
import TrendChart from '../components/TrendChart';
import RiskBadge from '../components/RiskBadge';
import { engineerFeatures } from '../ml/features';
import { predictSync } from '../ml/model';
import { getGuidance } from '../ml/guidance';
import { useAuth } from '../context/AuthContext';

// ─── Synthetic patient database ─────────────────────────────────────────────
function generateEntries(count, painBase, tempBase, sleepBase, moodBase) {
    return Array.from({ length: count }, (_, i) => {
        const daysAgo = count - 1 - i;
        const ts = Date.now() - daysAgo * 86400000;
        const noise = () => (Math.random() - 0.5) * 1.5;
        return {
            id: i + 1,
            timestamp: ts,
            date: new Date(ts).toISOString().split('T')[0],
            pain: Math.max(0, Math.min(10, painBase + noise())),
            swelling: Math.max(0, Math.min(10, painBase * 0.7 + noise())),
            temperature: Math.max(96, Math.min(104, tempBase + noise() * 0.5)),
            fatigue: Math.max(0, Math.min(10, painBase * 0.8 + noise())),
            sleep: Math.max(2, Math.min(12, sleepBase + noise())),
            mood: Math.max(1, Math.min(5, Math.round(moodBase + noise() * 0.5))),
        };
    });
}

const RAW_PATIENTS = [
    { id: 1, name: 'Maria Rodriguez', condition: 'Appendectomy', daysSinceDischarge: 4, painBase: 7.5, tempBase: 101.2, sleepBase: 4, moodBase: 2 },
    { id: 2, name: 'James Chen', condition: 'Hip Replacement', daysSinceDischarge: 18, painBase: 6.0, tempBase: 100.1, sleepBase: 5, moodBase: 2 },
    { id: 3, name: 'Aisha Patel', condition: 'C-Section', daysSinceDischarge: 8, painBase: 3.5, tempBase: 99.2, sleepBase: 6, moodBase: 3 },
    { id: 4, name: 'Robert Kim', condition: 'Knee Surgery', daysSinceDischarge: 14, painBase: 5.5, tempBase: 100.0, sleepBase: 5, moodBase: 3 },
    { id: 5, name: 'Sofia Okafor', condition: 'Cardiac Stent', daysSinceDischarge: 6, painBase: 2.0, tempBase: 98.4, sleepBase: 8, moodBase: 4 },
    { id: 6, name: 'David Walsh', condition: 'Gallbladder', daysSinceDischarge: 25, painBase: 1.5, tempBase: 98.2, sleepBase: 8, moodBase: 5 },
    { id: 7, name: 'Priya Sharma', condition: 'Spinal Fusion', daysSinceDischarge: 10, painBase: 4.5, tempBase: 99.5, sleepBase: 6, moodBase: 3 },
    { id: 8, name: 'Tom Mitchell', condition: 'Hernia Repair', daysSinceDischarge: 3, painBase: 6.8, tempBase: 101.5, sleepBase: 4, moodBase: 2 },
    { id: 9, name: 'Lin Wei', condition: 'Shoulder Surgery', daysSinceDischarge: 20, painBase: 2.5, tempBase: 98.6, sleepBase: 7, moodBase: 4 },
    { id: 10, name: 'Emma Stone', condition: 'Bowel Resection', daysSinceDischarge: 9, painBase: 5.0, tempBase: 100.5, sleepBase: 5, moodBase: 3 },
];

function buildPatients() {
    return RAW_PATIENTS.map((p) => {
        const entries = generateEntries(Math.min(p.daysSinceDischarge, 7), p.painBase, p.tempBase, p.sleepBase, p.moodBase);
        const features = engineerFeatures(entries, p.daysSinceDischarge);
        const { score, label, riskClass, topFactors } = predictSync(features);
        const last = entries[entries.length - 1];
        return {
            ...p,
            entries,
            riskScore: score,
            riskLabel: label,
            riskClass,
            topFactors,
            lastLog: last ? new Date(last.timestamp).toLocaleDateString() : null,
            trendNote: riskClass === 'high'
                ? 'Escalating pain + fever over last 3 logs'
                : riskClass === 'moderate'
                    ? 'Slow improvement — sleep and fatigue remain elevated'
                    : 'Steady improvement in all metrics',
        };
    });
}

const ALL_PATIENTS = buildPatients();

// ─── Dashboard Component ──────────────────────────────────────────────────────
export default function Dashboard() {
    const { user, logout, hasPermission } = useAuth();
    const [selected, setSelected] = useState(ALL_PATIENTS[0]);
    const [activeSection, setActiveSection] = useState('overview');

    const isDoctor = user?.role === 'doctor';
    const highCount = ALL_PATIENTS.filter((p) => p.riskClass === 'high').length;
    const modCount = ALL_PATIENTS.filter((p) => p.riskClass === 'moderate').length;
    const avgDay = Math.round(ALL_PATIENTS.reduce((s, p) => s + p.daysSinceDischarge, 0) / ALL_PATIENTS.length);

    const guidance = useMemo(
        () => selected ? getGuidance(selected.daysSinceDischarge, selected.riskClass) : null,
        [selected]
    );

    return (
        <div className="dashboard">
            {/* Sidebar */}
            <aside className="dash-sidebar">
                <div className="dash-logo">
                    <span className="logo-icon">🩺</span>
                    <div>
                        <div className="logo-text">Recovery<span className="logo-accent">Companion</span></div>
                        <div className="logo-sub">Clinician Dashboard</div>
                    </div>
                </div>

                <nav className="dash-nav">
                    {[
                        { id: 'overview', icon: '📊', label: 'Overview' },
                        { id: 'alerts', icon: '🚨', label: 'Alerts', badge: highCount + modCount },
                        { id: 'patients', icon: '👥', label: 'Patients' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            className={`dash-nav-btn ${activeSection === item.id ? 'dash-nav-btn--active' : ''}`}
                            onClick={() => setActiveSection(item.id)}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                            {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
                        </button>
                    ))}
                </nav>

                <div className="dash-stats-mini">
                    <MiniStat icon="👥" label="Total Patients" value={ALL_PATIENTS.length} />
                    <MiniStat icon="🚨" label="High Risk" value={highCount} color="#ef4444" />
                    <MiniStat icon="⚠️" label="Moderate" value={modCount} color="#f59e0b" />
                    <MiniStat icon="📅" label="Avg Day" value={avgDay} />
                </div>

                {/* Logout */}
                <button className="logout-btn logout-btn--sidebar" onClick={logout}>
                    ← Logout
                </button>
            </aside>

            {/* Main */}
            <main className="dash-main">
                {/* Top bar */}
                <div className="dash-topbar">
                    <div>
                        <h1 className="dash-title">
                            {activeSection === 'overview' && 'Patient Overview'}
                            {activeSection === 'alerts' && 'Active Alerts'}
                            {activeSection === 'patients' && 'All Patients'}
                        </h1>
                        <p className="dash-subtitle">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="dash-topbar-right">
                        <span className={`dash-role-badge dash-role-badge--${user?.role}`}>
                            {isDoctor ? '🩺 Doctor' : '💉 Nurse'}
                        </span>
                        <span className="dash-user">{user?.name || 'Clinician'}</span>
                        <span className="dash-avatar">{isDoctor ? '👩‍⚕️' : '👩‍⚕️'}</span>
                    </div>
                </div>

                {/* Content area */}
                <div className="dash-content">
                    {(activeSection === 'overview' || activeSection === 'patients') && (
                        <div className="dash-split">
                            {/* Patient List */}
                            <div className="dash-panel dash-panel--list">
                                <div className="panel-header">
                                    <h2 className="panel-title">Patients</h2>
                                    <span className="panel-count">{ALL_PATIENTS.length}</span>
                                </div>
                                <PatientList
                                    patients={ALL_PATIENTS}
                                    selectedId={selected?.id}
                                    onSelect={setSelected}
                                />
                            </div>

                            {/* Patient Detail */}
                            {selected && (
                                <div className="dash-panel dash-panel--detail">
                                    <div className="detail-header">
                                        <div>
                                            <h2 className="detail-name">{selected.name}</h2>
                                            <p className="detail-meta">{selected.condition} · Day {selected.daysSinceDischarge} · {selected.riskLabel} Risk</p>
                                        </div>
                                        <RiskBadge riskClass={selected.riskClass} score={selected.riskScore} size="lg" />
                                    </div>

                                    {/* Risk factors */}
                                    <div className="detail-factors">
                                        <h3 className="detail-section-title">Risk Drivers</h3>
                                        <div className="detail-factor-chips">
                                            {selected.topFactors.map((f, i) => (
                                                <span key={i} className={`detail-chip detail-chip--${selected.riskClass}`}>{f}</span>
                                            ))}
                                        </div>
                                        <p className="detail-trend-note">📈 {selected.trendNote}</p>
                                    </div>

                                    {/* Trend Charts */}
                                    <div className="detail-charts">
                                        <h3 className="detail-section-title">Symptom Trends</h3>
                                        <TrendChart entries={selected.entries} symptoms={['pain', 'swelling', 'temperature']} />
                                        <TrendChart entries={selected.entries} symptoms={['fatigue', 'sleep', 'mood']} />
                                    </div>

                                    {/* Guidance */}
                                    {guidance && (
                                        <div className="detail-guidance">
                                            <h3 className="detail-section-title">Recovery Stage</h3>
                                            <div className="guidance-mini">
                                                <span>{guidance.icon}</span>
                                                <span className="guidance-mini-stage">{guidance.stage}</span>
                                                <span className="guidance-mini-days">{guidance.days}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="detail-actions">
                                        <button className="btn-primary">📲 Message Patient</button>
                                        <button className="btn-secondary">📋 View Full Report</button>
                                        <button className="btn-warn">⚠️ Flag for Review</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'alerts' && (
                        <div className="dash-alerts-full">
                            {/* Nurse permission notice */}
                            {!isDoctor && (
                                <div className="nurse-notice">
                                    💉 <strong>Nurse view</strong> — You can view alerts but only doctors can mark them as resolved.
                                </div>
                            )}
                            <AlertPanel patients={ALL_PATIENTS} canResolve={isDoctor} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function MiniStat({ icon, label, value, color }) {
    return (
        <div className="mini-stat">
            <span className="mini-stat-icon">{icon}</span>
            <div>
                <div className="mini-stat-value" style={color ? { color } : {}}>{value}</div>
                <div className="mini-stat-label">{label}</div>
            </div>
        </div>
    );
}
