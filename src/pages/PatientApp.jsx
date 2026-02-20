import React, { useState } from 'react';
import { usePatient } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import SymptomForm from '../components/SymptomForm';
import TrendChart from '../components/TrendChart';
import GuidanceCard from '../components/GuidanceCard';
import RiskBadge from '../components/RiskBadge';

const MOOD_ICONS = { 1: '😭', 2: '😟', 3: '😐', 4: '🙂', 5: '😄' };

const TABS = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'log', icon: '📝', label: 'Log' },
    { id: 'trends', icon: '📈', label: 'Trends' },
    { id: 'guidance', icon: '💡', label: 'Guidance' },
];

const TREND_TABS = [
    { key: ['pain', 'swelling'], label: 'Pain & Swelling' },
    { key: ['temperature', 'fatigue'], label: 'Temp & Fatigue' },
    { key: ['sleep', 'mood'], label: 'Sleep & Mood' },
];

export default function PatientApp() {
    const { patientName, daysSinceDischarge, entries, risk, activeTab, setActiveTab } = usePatient();
    const { logout } = useAuth();
    const [trendTab, setTrendTab] = useState(0);
    const [logSuccess, setLogSuccess] = useState(false);

    const latest = entries[0];

    const handleLogSuccess = () => {
        setLogSuccess(true);
        setActiveTab('home');
        setTimeout(() => setLogSuccess(false), 4000);
    };

    return (
        <div className="patient-app">
            {/* Header */}
            <header className="app-header">
                <div className="header-logo">
                    <span className="logo-icon">🩺</span>
                    <span className="logo-text">Recovery<span className="logo-accent">Companion</span></span>
                </div>
                <div className="header-right">
                    <span className="header-day">Day {daysSinceDischarge}</span>
                    <button className="logout-btn logout-btn--patient" onClick={logout}>
                        ← Out
                    </button>
                </div>
            </header>

            {/* Success toast */}
            {logSuccess && (
                <div className="toast toast--success">
                    ✅ Symptoms logged! Risk updated.
                </div>
            )}

            {/* Content */}
            <main className="app-content">
                {activeTab === 'home' && <HomeTab patientName={patientName} daysSinceDischarge={daysSinceDischarge} risk={risk} latest={latest} onLog={() => setActiveTab('log')} />}
                {activeTab === 'log' && <LogTab onSuccess={handleLogSuccess} />}
                {activeTab === 'trends' && <TrendsTab entries={entries} trendTab={trendTab} setTrendTab={setTrendTab} />}
                {activeTab === 'guidance' && <GuidanceTab daysSinceDischarge={daysSinceDischarge} riskClass={risk.riskClass} />}
            </main>

            {/* Bottom Nav */}
            <nav className="bottom-nav">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        className={`nav-btn ${activeTab === tab.id ? 'nav-btn--active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="nav-icon">{tab.icon}</span>
                        <span className="nav-label">{tab.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}

function HomeTab({ patientName, daysSinceDischarge, risk, latest, onLog }) {
    const firstName = patientName.split(' ')[0];
    return (
        <div className="tab-content">
            {/* Greeting */}
            <div className="home-greeting">
                <h1 className="greeting-name">Hello, {firstName} 👋</h1>
                <p className="greeting-sub">Day {daysSinceDischarge} of your recovery journey</p>
            </div>

            {/* Risk Card */}
            <div className={`risk-card risk-card--${risk.riskClass}`}>
                <div className="risk-card-header">
                    <span className="risk-card-title">Today's Risk Assessment</span>
                    <RiskBadge riskClass={risk.riskClass} score={risk.score} size="md" />
                </div>
                <div className="risk-score-bar-wrap">
                    <div className="risk-score-bar" style={{ '--score': `${risk.score}%` }} />
                </div>
                {risk.topFactors.length > 0 && (
                    <div className="risk-factors">
                        <span className="risk-factors-label">Key factors:</span>
                        {risk.topFactors.map((f, i) => (
                            <span key={i} className="risk-factor-chip">{f}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Last Log Summary */}
            {latest ? (
                <div className="last-log-card">
                    <h3 className="last-log-title">Last Logged Symptoms</h3>
                    <div className="last-log-grid">
                        <LogStat icon="🤕" label="Pain" value={`${latest.pain}/10`} />
                        <LogStat icon="🤜" label="Swelling" value={`${latest.swelling}/10`} />
                        <LogStat icon="🌡️" label="Temp" value={`${latest.temperature?.toFixed(1)}°F`} warn={latest.temperature > 100.4} />
                        <LogStat icon="😴" label="Fatigue" value={`${latest.fatigue}/10`} />
                        <LogStat icon="🛌" label="Sleep" value={`${latest.sleep} hrs`} warn={latest.sleep < 5} />
                        <LogStat icon="😊" label="Mood" value={MOOD_ICONS[latest.mood] || '–'} />
                    </div>
                    <p className="last-log-time">Logged {timeAgo(latest.timestamp)}</p>
                </div>
            ) : (
                <div className="no-log-card">
                    <span className="no-log-icon">📋</span>
                    <p>No symptoms logged yet</p>
                    <button className="btn-primary" onClick={onLog}>Log Now</button>
                </div>
            )}

            {/* Quick Log CTA */}
            {latest && (
                <button className="btn-primary btn-full" onClick={onLog}>
                    📝 Log Today's Symptoms
                </button>
            )}
        </div>
    );
}

function LogTab({ onSuccess }) {
    return (
        <div className="tab-content">
            <div className="tab-header">
                <h2 className="tab-title">Log Symptoms</h2>
                <p className="tab-sub">How are you feeling today? Be honest — it helps us help you.</p>
            </div>
            <SymptomForm onSuccess={onSuccess} />
        </div>
    );
}

function TrendsTab({ entries, trendTab, setTrendTab }) {
    return (
        <div className="tab-content">
            <div className="tab-header">
                <h2 className="tab-title">My Trends</h2>
                <p className="tab-sub">Your symptom history over time</p>
            </div>
            <div className="trend-tabs">
                {TREND_TABS.map((t, i) => (
                    <button
                        key={i}
                        className={`trend-tab-btn ${trendTab === i ? 'trend-tab-btn--active' : ''}`}
                        onClick={() => setTrendTab(i)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <TrendChart entries={entries} symptoms={TREND_TABS[trendTab].key} />

            {entries.length > 0 && (
                <div className="trends-stats">
                    <StatCard icon="📅" label="Days Logged" value={entries.length} />
                    <StatCard icon="📊" label="Avg Pain" value={avg(entries, 'pain').toFixed(1)} />
                    <StatCard icon="🌡️" label="Avg Temp" value={avg(entries, 'temperature').toFixed(1) + '°'} />
                    <StatCard icon="🛌" label="Avg Sleep" value={avg(entries, 'sleep').toFixed(1) + 'h'} />
                </div>
            )}
        </div>
    );
}

function GuidanceTab({ daysSinceDischarge, riskClass }) {
    return (
        <div className="tab-content">
            <div className="tab-header">
                <h2 className="tab-title">Recovery Guidance</h2>
                <p className="tab-sub">Personalized to your stage and risk level</p>
            </div>
            <GuidanceCard daysSinceDischarge={daysSinceDischarge} riskClass={riskClass} />
        </div>
    );
}

// Helpers
function LogStat({ icon, label, value, warn }) {
    return (
        <div className={`log-stat ${warn ? 'log-stat--warn' : ''}`}>
            <span className="log-stat-icon">{icon}</span>
            <span className="log-stat-value">{value}</span>
            <span className="log-stat-label">{label}</span>
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="stat-card">
            <span className="stat-icon">{icon}</span>
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
        </div>
    );
}

function avg(entries, field) {
    if (!entries.length) return 0;
    return entries.reduce((s, e) => s + (e[field] ?? 0), 0) / entries.length;
}

function timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}
