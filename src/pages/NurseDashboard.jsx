import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { engineerFeatures } from '../ml/features';
import { predictSync } from '../ml/model';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const noise = () => (Math.random() - 0.5) * 1.5;
function generateEntries(count, painBase, tempBase, sleepBase, moodBase) {
    return Array.from({ length: count }, (_, i) => {
        const daysAgo = count - 1 - i;
        const ts = Date.now() - daysAgo * 86400000;
        return {
            id: i + 1, timestamp: ts,
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

// ─── Static Data ──────────────────────────────────────────────────────────────
const RAW_PATIENTS = [
    {
        id: 1, name: 'Maria Rodriguez', age: 34, gender: 'Female',
        condition: 'Appendectomy', admissionDate: '2026-02-16', surgeryType: 'Laparoscopic',
        doctorAssigned: 'Dr. Sarah Mitchell',
        daysSinceDischarge: 4, totalDays: 14,
        painBase: 7.5, tempBase: 101.2, sleepBase: 4, moodBase: 2,
        sugarLevel: 182, bp: '148/96', metricsTime: '11:42 AM',
        symptoms: [
            { name: 'Abdominal Pain', severity: 'severe' },
            { name: 'Nausea', severity: 'moderate' },
            { name: 'Fatigue', severity: 'moderate' },
        ],
        medications: [
            { id: 'm1', name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', startDate: '2026-02-16', endDate: '2026-03-02' },
            { id: 'm2', name: 'Ibuprofen', dosage: '400mg', frequency: 'Every 8 hours', startDate: '2026-02-16', endDate: '2026-02-25' },
        ],
        caseNotes: 'Patient underwent emergency appendectomy on Feb 16. Recovery progressing slowly with elevated pain levels.',
        diagnosisNotes: 'Acute appendicitis, non-perforated. Laparoscopic procedure performed.',
        treatmentHistory: 'IV antibiotics for 48 hrs post-op. Wound dressing changed daily.',
        recoveryNotes: 'Advised soft diet, limited physical activity for 2 weeks.',
        reports: [
            { type: 'Blood Panel', uploadDate: '2026-02-17', uploadedBy: 'Lab Tech Priya', fileLabel: 'CBC_Feb17.pdf' },
            { type: 'Ultrasound', uploadDate: '2026-02-16', uploadedBy: 'Dr. Sarah Mitchell', fileLabel: 'US_abdomen.pdf' },
        ],
    },
    {
        id: 2, name: 'James Chen', age: 67, gender: 'Male',
        condition: 'Hip Replacement', admissionDate: '2026-02-03', surgeryType: 'Total Hip Arthroplasty',
        doctorAssigned: 'Dr. Sarah Mitchell',
        daysSinceDischarge: 18, totalDays: 30,
        painBase: 6.0, tempBase: 100.1, sleepBase: 5, moodBase: 2,
        sugarLevel: 156, bp: '138/88', metricsTime: '9:15 AM',
        symptoms: [
            { name: 'Hip Pain', severity: 'severe' },
            { name: 'Limited Mobility', severity: 'moderate' },
            { name: 'Insomnia', severity: 'mild' },
        ],
        medications: [
            { id: 'm1', name: 'Warfarin', dosage: '5mg', frequency: 'Once daily', startDate: '2026-02-03', endDate: '2026-03-03' },
            { id: 'm2', name: 'Tramadol', dosage: '50mg', frequency: 'Every 6 hours', startDate: '2026-02-03', endDate: '2026-02-20' },
        ],
        caseNotes: 'Total hip arthroplasty. Patient reports persistent pain during ambulation.',
        diagnosisNotes: 'Severe osteoarthritis of left hip. THA performed successfully.',
        treatmentHistory: 'DVT prophylaxis with warfarin. Daily physiotherapy sessions started.',
        recoveryNotes: 'PT visits 3x weekly. Weight-bearing as tolerated.',
        reports: [
            { type: 'X-Ray Hip', uploadDate: '2026-02-04', uploadedBy: 'Dr. Sarah Mitchell', fileLabel: 'XR_hip_postop.pdf' },
            { type: 'Blood Clot Screening', uploadDate: '2026-02-07', uploadedBy: 'Lab Tech Priya', fileLabel: 'DVT_screen.pdf' },
        ],
    },
    {
        id: 3, name: 'Aisha Patel', age: 29, gender: 'Female',
        condition: 'C-Section', admissionDate: '2026-02-13', surgeryType: 'Pfannenstiel Incision',
        doctorAssigned: 'Dr. Sarah Mitchell',
        daysSinceDischarge: 8, totalDays: 21,
        painBase: 3.5, tempBase: 99.2, sleepBase: 6, moodBase: 3,
        sugarLevel: 98, bp: '118/76', metricsTime: '8:30 AM',
        symptoms: [
            { name: 'Incision Soreness', severity: 'mild' },
            { name: 'Fatigue', severity: 'moderate' },
        ],
        medications: [
            { id: 'm1', name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours', startDate: '2026-02-13', endDate: '2026-02-22' },
            { id: 'm2', name: 'Iron Supplements', dosage: '325mg', frequency: 'Once daily', startDate: '2026-02-13', endDate: '2026-03-13' },
        ],
        caseNotes: 'Elective C-section at 39 weeks. Mother and baby stable.',
        diagnosisNotes: 'Cephalopelvic disproportion. Pfannenstiel incision, no complications.',
        treatmentHistory: 'Oxytocin drip post-delivery. Breastfeeding support provided.',
        recoveryNotes: 'Avoid heavy lifting for 6 weeks. Pelvic floor exercises encouraged.',
        reports: [
            { type: 'Postpartum CBC', uploadDate: '2026-02-14', uploadedBy: 'Lab Tech Priya', fileLabel: 'CBC_postpartum.pdf' },
        ],
    },
    {
        id: 5, name: 'Sofia Okafor', age: 61, gender: 'Female',
        condition: 'Cardiac Stent', admissionDate: '2026-02-15', surgeryType: 'PTCA with DES',
        doctorAssigned: 'Dr. Sarah Mitchell',
        daysSinceDischarge: 6, totalDays: 21,
        painBase: 2.0, tempBase: 98.4, sleepBase: 8, moodBase: 4,
        sugarLevel: 105, bp: '124/78', metricsTime: '7:50 AM',
        symptoms: [
            { name: 'Mild Chest Tightness', severity: 'mild' },
        ],
        medications: [
            { id: 'm1', name: 'Clopidogrel', dosage: '75mg', frequency: 'Once daily', startDate: '2026-02-15', endDate: '2027-02-15' },
            { id: 'm2', name: 'Atorvastatin', dosage: '40mg', frequency: 'Nightly', startDate: '2026-02-15', endDate: '2027-02-15' },
        ],
        caseNotes: 'PTCA with DES placement in LAD. Patient tolerating dual antiplatelet well.',
        diagnosisNotes: 'NSTEMI. 80% LAD stenosis. Stent placed successfully.',
        treatmentHistory: 'Heparin infusion peri-procedure. DAPT initiated.',
        recoveryNotes: 'Cardiac rehab enrollment recommended. Low-sodium diet.',
        reports: [
            { type: 'ECG', uploadDate: '2026-02-16', uploadedBy: 'Dr. Sarah Mitchell', fileLabel: 'ECG_postop.pdf' },
            { type: 'Cardiac Echo', uploadDate: '2026-02-18', uploadedBy: 'Lab Tech Priya', fileLabel: 'Echo_Feb18.pdf' },
        ],
    },
    {
        id: 7, name: 'Priya Sharma', age: 39, gender: 'Female',
        condition: 'Spinal Fusion', admissionDate: '2026-02-11', surgeryType: 'L4-L5 TLIF',
        doctorAssigned: 'Dr. Sarah Mitchell',
        daysSinceDischarge: 10, totalDays: 45,
        painBase: 4.5, tempBase: 99.5, sleepBase: 6, moodBase: 3,
        sugarLevel: 118, bp: '126/82', metricsTime: '11:00 AM',
        symptoms: [
            { name: 'Lower Back Pain', severity: 'moderate' },
            { name: 'Radiating Leg Pain', severity: 'mild' },
        ],
        medications: [
            { id: 'm1', name: 'Gabapentin', dosage: '300mg', frequency: 'Three times daily', startDate: '2026-02-11', endDate: '2026-04-11' },
            { id: 'm2', name: 'Cyclobenzaprine', dosage: '5mg', frequency: 'At bedtime', startDate: '2026-02-11', endDate: '2026-03-11' },
        ],
        caseNotes: 'L4-L5 TLIF with pedicle screw fixation. Recovery on track.',
        diagnosisNotes: 'Grade II spondylolisthesis L4-L5. Neurogenic intermittent claudication.',
        treatmentHistory: 'Pre-op epidural steroid injection. Post-op brace for 6 weeks.',
        recoveryNotes: 'No twisting or bending. Bladder and bowel function normal.',
        reports: [
            { type: 'MRI Lumbar Spine', uploadDate: '2026-02-12', uploadedBy: 'Dr. Sarah Mitchell', fileLabel: 'MRI_lumbar.pdf' },
            { type: 'Neurological Panel', uploadDate: '2026-02-14', uploadedBy: 'Lab Tech Priya', fileLabel: 'Neuro_panel.pdf' },
        ],
    },
];

// Assignment: nurse (role=nurse) sees patients 1,2,3; intern sees 3,5,7
const NURSE_PATIENT_IDS = [1, 2, 3];
const INTERN_PATIENT_IDS = [3, 5, 7];

function buildPatients() {
    return RAW_PATIENTS.map((p) => {
        const entries = generateEntries(Math.min(p.daysSinceDischarge, 7), p.painBase, p.tempBase, p.sleepBase, p.moodBase);
        const features = engineerFeatures(entries, p.daysSinceDischarge);
        const { riskClass } = predictSync(features);
        const recoveryRate = Math.round(Math.min(100, (p.daysSinceDischarge / p.totalDays) * 100));
        return { ...p, entries, riskClass, recoveryRate };
    });
}

const ALL_PATIENTS = buildPatients();

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function NurseDashboard() {
    const { user, logout } = useAuth();
    const isIntern = user?.role === 'intern';
    const [activePage, setActivePage] = useState('patients');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [notesState, setNotesState] = useState({});
    const [messagesState, setMessagesState] = useState({});
    const [scheduledAppts, setScheduledAppts] = useState({});

    const assignedIds = isIntern ? INTERN_PATIENT_IDS : NURSE_PATIENT_IDS;
    const myPatients = useMemo(() => ALL_PATIENTS.filter(p => assignedIds.includes(p.id)), [isIntern]);

    const addNote = (patientId, text) => {
        if (!text.trim()) return;
        const now = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
        setNotesState(prev => ({
            ...prev,
            [patientId]: [...(prev[patientId] || []), { text, time: now, author: user?.name }]
        }));
    };

    const sendMessage = (patientId, text) => {
        if (!text.trim()) return;
        const now = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
        setMessagesState(prev => ({
            ...prev,
            [patientId]: [...(prev[patientId] || []), { text, time: now, sender: user?.name }]
        }));
    };

    const scheduleAppointment = (patientId, appt) => {
        setScheduledAppts(prev => ({
            ...prev,
            [patientId]: [...(prev[patientId] || []), { ...appt, status: 'Pending Approval', scheduledBy: user?.name }]
        }));
    };

    const detailProps = { notesState, addNote, messagesState, sendMessage, scheduledAppts, scheduleAppointment };

    return (
        <div className="dashboard nurse-dash">
            {/* Sidebar */}
            <aside className="doctor-sidebar">
                <div className="doctor-sidebar-logo">{isIntern ? '🩻' : '💉'}</div>
                <nav className="doctor-sidebar-nav">
                    {[
                        { id: 'patients', icon: '🏠', label: 'My Patients' },
                        { id: 'reports', icon: '📋', label: 'Reports' },
                    ].map(item => (
                        <button key={item.id}
                            className={`doctor-nav-icon-btn${activePage === item.id ? ' doctor-nav-icon-btn--active' : ''}`}
                            onClick={() => { setActivePage(item.id); setSelectedPatient(null); }} title={item.label}>
                            {item.icon}
                            <span className="doctor-nav-tooltip">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <button className="doctor-sidebar-logout" onClick={logout} title="Logout">
                    🚪<span className="doctor-nav-tooltip">Logout</span>
                </button>
            </aside>

            {/* Main */}
            <main className="doctor-main">
                <div className="dash-topbar">
                    <div>
                        <h1 className="dash-title">
                            {selectedPatient ? selectedPatient.name : activePage === 'patients' ? 'My Patients' : 'Reports & Scans'}
                        </h1>
                        <p className="dash-subtitle">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="dash-topbar-right">
                        {selectedPatient && (
                            <button className="nd-back-btn" onClick={() => setSelectedPatient(null)}>← Back</button>
                        )}
                        <span className={`dash-role-badge dash-role-badge--${isIntern ? 'intern' : 'nurse'}`}>
                            {isIntern ? '🩻 Intern' : '💉 Nurse'}
                        </span>
                        <span className="dash-user">{user?.name || 'Clinician'}</span>
                        <span className="dash-avatar">{isIntern ? '👨‍⚕️' : '👩‍⚕️'}</span>
                    </div>
                </div>

                {/* My Patients Page */}
                {activePage === 'patients' && !selectedPatient && (
                    <div className="doctor-home-content">
                        <section className="nd-patients-section">
                            <div className="nd-section-header">
                                <span className="nd-section-title">Assigned Patients</span>
                                <span className="nd-patient-count">{myPatients.length} Patients</span>
                            </div>
                            <div className="nd-patient-grid">
                                {myPatients.map(p => (
                                    <NursePatientCard key={p.id} patient={p} onClick={() => setSelectedPatient(p)} />
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {/* Patient Detail View */}
                {activePage === 'patients' && selectedPatient && (
                    <PatientDetailView patient={selectedPatient} {...detailProps} />
                )}

                {/* Reports Page */}
                {activePage === 'reports' && (
                    <ReportsPage patients={myPatients} />
                )}
            </main>
        </div>
    );
}

// ─── Nurse Patient Card ───────────────────────────────────────────────────────
function NursePatientCard({ patient: p, onClick }) {
    const riskLabel = { high: 'High', moderate: 'Moderate', low: 'Stable' }[p.riskClass] ?? 'Stable';
    return (
        <div className={`pcase-card pcase-card--${p.riskClass} nd-patient-card`} onClick={onClick}>
            <div className="pcase-card-top">
                <div className="pcase-name-row">
                    <span className={`pcase-status-dot pcase-status-dot--${p.riskClass}`} />
                    <span className="pcase-name">{p.name}</span>
                </div>
                <span className={`pcase-risk-badge pcase-risk-badge--${p.riskClass}`}>{riskLabel}</span>
            </div>
            <div className="pcase-stats">
                <div className="pcase-stat">
                    <span className="pcase-stat-label">Recovery Rate</span>
                    <div className="pcase-stat-bar-wrap">
                        <div className={`pcase-stat-bar pcase-stat-bar--${p.riskClass}`} style={{ width: `${p.recoveryRate}%` }} />
                    </div>
                    <span className="pcase-stat-value">{p.recoveryRate}%</span>
                </div>
                <div className="pcase-stat pcase-stat--inline">
                    <span className="pcase-stat-label">Cycle</span>
                    <span className="pcase-stat-value">Day {p.daysSinceDischarge} of {p.totalDays}</span>
                </div>
                <div className="pcase-stat pcase-stat--inline">
                    <span className="pcase-stat-label">Condition</span>
                    <span className="pcase-stat-value">{p.condition}</span>
                </div>
            </div>
            <div className="pcase-footer nd-card-footer">
                <span>👨‍⚕️ {p.doctorAssigned}</span>
                <span className="nd-view-detail">View Details →</span>
            </div>
        </div>
    );
}

// ─── Patient Detail View ──────────────────────────────────────────────────────
function PatientDetailView({ patient: p, notesState, addNote, messagesState, sendMessage, scheduledAppts, scheduleAppointment }) {
    const [activeTab, setActiveTab] = useState('overview');
    const tabs = [
        { id: 'overview', label: '📄 Overview' },
        { id: 'reports', label: '📊 Reports & Scans' },
        { id: 'severity', label: '⚠️ Severity & Appointments' },
    ];

    return (
        <div className="nd-detail-wrapper">
            <div className="nd-tab-bar">
                {tabs.map(t => (
                    <button key={t.id}
                        className={`nd-tab-btn${activeTab === t.id ? ' nd-tab-btn--active' : ''}`}
                        onClick={() => setActiveTab(t.id)}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="nd-tab-content">
                {activeTab === 'overview' && (
                    <OverviewTab patient={p}
                        notes={notesState[p.id] || []}
                        onAddNote={(text) => addNote(p.id, text)}
                        messages={messagesState[p.id] || []}
                        onSendMessage={(text) => sendMessage(p.id, text)}
                    />
                )}
                {activeTab === 'reports' && <ReportsTab patient={p} />}
                {activeTab === 'severity' && (
                    <SeverityTab patient={p}
                        appointments={scheduledAppts[p.id] || []}
                        onSchedule={(appt) => scheduleAppointment(p.id, appt)}
                    />
                )}
            </div>
        </div>
    );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ patient: p, notes, onAddNote, messages, onSendMessage }) {
    const [noteText, setNoteText] = useState('');
    const [msgText, setMsgText] = useState('');
    const sugarColor = p.sugarLevel > 160 ? 'red' : p.sugarLevel > 120 ? 'yellow' : 'green';
    const bpSys = parseInt(p.bp.split('/')[0]);
    const bpColor = bpSys > 139 ? 'red' : bpSys > 129 ? 'yellow' : 'green';

    return (
        <div className="nd-overview-tab">
            {/* A. Recovery Cycle */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">🕒</span>
                    <h3 className="dd-section-title">Recovery Cycle & Time Tracking</h3>
                    <span className="dd-metrics-time nd-active-dot">● Active Monitoring</span>
                </div>
                <div className="nd-recovery-block">
                    <div className="nd-recovery-meta">
                        <span className="nd-cycle-label">Day {p.daysSinceDischarge} of {p.totalDays}</span>
                        <span className="nd-cycle-sub">Last updated: {p.metricsTime}, Feb 20</span>
                    </div>
                    <div className="nd-recovery-bar-wrap">
                        <div className={`nd-recovery-bar nd-recovery-bar--${p.riskClass}`}
                            style={{ width: `${p.recoveryRate}%` }} />
                        <span className="nd-recovery-pct">{p.recoveryRate}%</span>
                    </div>
                </div>
            </div>

            {/* B. Patient Overview */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">📄</span>
                    <h3 className="dd-section-title">Patient Overview & Case Summary</h3>
                </div>
                <div className="dd-overview-grid">
                    {[
                        ['Name', p.name], ['Age', `${p.age} yrs`], ['Gender', p.gender],
                        ['Diagnosis', p.condition], ['Surgery Type', p.surgeryType],
                        ['Admission', p.admissionDate], ['Doctor', p.doctorAssigned],
                    ].map(([label, val]) => (
                        <div key={label} className="dd-overview-field">
                            <div className="dd-field-label">{label}</div>
                            <div className="dd-field-value">{val}</div>
                        </div>
                    ))}
                </div>
                <div className="nd-case-summary">
                    <div className="nd-case-summary-label">Case Summary</div>
                    <div className="nd-case-summary-text">{p.caseNotes}</div>
                </div>
                {/* Notes */}
                <div className="nd-notes-box">
                    <div className="nd-notes-title">📝 Notes</div>
                    <div className="nd-notes-history">
                        {notes.length === 0 && <p className="nd-empty-hint">No notes yet. Add your first update below.</p>}
                        {notes.map((n, i) => (
                            <div key={i} className="nd-note-item">
                                <span className="nd-note-text">{n.text}</span>
                                <span className="nd-note-meta">{n.author} · {n.time}</span>
                            </div>
                        ))}
                    </div>
                    <div className="nd-notes-input-row">
                        <textarea className="nd-notes-input" rows={2} placeholder="Add a note or update..."
                            value={noteText} onChange={e => setNoteText(e.target.value)} />
                        <button className="nd-notes-add-btn" onClick={() => { onAddNote(noteText); setNoteText(''); }}>+ Add</button>
                    </div>
                </div>
            </div>

            {/* C. Medications (read-only) */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">💊</span>
                    <h3 className="dd-section-title">Medications <span className="nd-readonly-badge">Read Only</span></h3>
                </div>
                <div className="nd-med-list">
                    {p.medications.map(med => (
                        <div key={med.id} className="nd-med-row">
                            <div className="nd-med-icon">💊</div>
                            <div className="nd-med-info">
                                <div className="med-name">{med.name}</div>
                                <div className="med-sub">{med.dosage} · {med.frequency}</div>
                                <div className="nd-med-dates">{med.startDate} → {med.endDate}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* D. Symptoms */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">⚠️</span>
                    <h3 className="dd-section-title">Symptoms</h3>
                </div>
                <div className="dd-symptoms-grid">
                    {p.symptoms.map((s, i) => (
                        <div key={i} className={`symptom-chip symptom-chip--${s.severity}`}>
                            <span className="symptom-name">{s.name}</span>
                            <span className={`symptom-badge symptom-badge--${s.severity}`}>
                                {s.severity.charAt(0).toUpperCase() + s.severity.slice(1)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* E. Health Metrics */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">📊</span>
                    <h3 className="dd-section-title">Live Health Metrics</h3>
                    <span className="dd-metrics-time">Updated at {p.metricsTime}</span>
                </div>
                <div className="dd-metrics-grid">
                    <div className={`metric-card metric-card--${sugarColor}`}>
                        <div className="metric-icon">🩸</div>
                        <div className="metric-label">Sugar Level</div>
                        <div className={`metric-value metric-value--${sugarColor}`}>{p.sugarLevel} mg/dL</div>
                        <div className="metric-normal">Normal: 70–120</div>
                    </div>
                    <div className={`metric-card metric-card--${bpColor}`}>
                        <div className="metric-icon">❤️</div>
                        <div className="metric-label">Blood Pressure</div>
                        <div className={`metric-value metric-value--${bpColor}`}>{p.bp}</div>
                        <div className="metric-normal">Normal: &lt;130/85 mmHg</div>
                    </div>
                </div>
            </div>

            {/* F. Message Box */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">💬</span>
                    <h3 className="dd-section-title">Message Patient</h3>
                </div>
                <div className="nd-message-history">
                    {messages.length === 0 && <p className="nd-empty-hint">No messages sent yet.</p>}
                    {messages.map((m, i) => (
                        <div key={i} className="nd-message-item">
                            <span className="nd-message-text">{m.text}</span>
                            <span className="nd-note-meta">{m.sender} · {m.time}</span>
                        </div>
                    ))}
                </div>
                <div className="nd-notes-input-row">
                    <input className="nd-message-input" type="text" placeholder="Type a message or notification..."
                        value={msgText} onChange={e => setMsgText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { onSendMessage(msgText); setMsgText(''); } }} />
                    <button className="nd-send-btn" onClick={() => { onSendMessage(msgText); setMsgText(''); }}>Send</button>
                </div>
            </div>
        </div>
    );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({ patient: p }) {
    const sugarColor = p.sugarLevel > 160 ? 'red' : p.sugarLevel > 120 ? 'yellow' : 'green';
    const bpSys = parseInt(p.bp.split('/')[0]);
    const bpColor = bpSys > 139 ? 'red' : bpSys > 129 ? 'yellow' : 'green';

    return (
        <div className="nd-reports-tab">
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">🗂️</span>
                    <h3 className="dd-section-title">Lab Reports & Scans</h3>
                </div>
                <div className="nd-report-list">
                    {p.reports.map((r, i) => (
                        <div key={i} className="nd-report-card">
                            <div className="nd-report-icon">📄</div>
                            <div className="nd-report-info">
                                <div className="nd-report-type">{r.type}</div>
                                <div className="nd-report-meta">Uploaded: {r.uploadDate} · by {r.uploadedBy}</div>
                                <div className="nd-report-file">📎 {r.fileLabel}</div>
                            </div>
                            <div className="nd-report-status">Available</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">📈</span>
                    <h3 className="dd-section-title">Report Summary</h3>
                </div>
                <div className="nd-vitals-summary">
                    <div className={`nd-vital-card nd-vital-card--${sugarColor}`}>
                        <div className="nd-vital-label">Sugar Level</div>
                        <div className="nd-vital-value">{p.sugarLevel} mg/dL</div>
                        <div className="nd-vital-meta">Updated {p.metricsTime}</div>
                        {sugarColor !== 'green' && <div className="nd-vital-alert">⚠ Elevated</div>}
                    </div>
                    <div className={`nd-vital-card nd-vital-card--${bpColor}`}>
                        <div className="nd-vital-label">Blood Pressure</div>
                        <div className="nd-vital-value">{p.bp} mmHg</div>
                        <div className="nd-vital-meta">Updated {p.metricsTime}</div>
                        {bpColor !== 'green' && <div className="nd-vital-alert">⚠ Elevated</div>}
                    </div>
                    <div className="nd-vital-card nd-vital-card--green">
                        <div className="nd-vital-label">Temperature</div>
                        <div className="nd-vital-value">{p.tempBase.toFixed(1)}°F</div>
                        <div className="nd-vital-meta">Updated {p.metricsTime}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Severity & Appointments Tab ──────────────────────────────────────────────
function SeverityTab({ patient: p, appointments, onSchedule }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const riskLabel = { high: 'High', moderate: 'Moderate', low: 'Stable' }[p.riskClass] ?? 'Stable';
    const riskExplain = {
        high: 'Patient has elevated symptoms or vitals requiring close attention.',
        moderate: 'Patient is recovering steadily. Monitor for any changes.',
        low: 'Patient is progressing well with stable vitals.',
    }[p.riskClass] ?? '';

    const handleSchedule = () => {
        if (!date || !time || !reason.trim()) return;
        onSchedule({ date, time, reason });
        setDate(''); setTime(''); setReason('');
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
    };

    return (
        <div className="nd-severity-tab">
            {/* Severity */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">⚠️</span>
                    <h3 className="dd-section-title">Case Severity</h3>
                </div>
                <div className={`nd-severity-card nd-severity-card--${p.riskClass}`}>
                    <div className="nd-severity-top">
                        <span className={`pcase-risk-badge pcase-risk-badge--${p.riskClass}`}>{riskLabel} Risk</span>
                        <span className="nd-recovery-pct-badge">{p.recoveryRate}% Recovery</span>
                    </div>
                    <p className="nd-severity-explain">{riskExplain}</p>
                    <div className="nd-severity-bar-wrap">
                        <div className={`nd-recovery-bar nd-recovery-bar--${p.riskClass}`} style={{ width: `${p.recoveryRate}%` }} />
                    </div>
                    <div className="nd-severity-meta">Cycle: Day {p.daysSinceDischarge} of {p.totalDays}</div>
                </div>
            </div>

            {/* Schedule Appointment */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">📅</span>
                    <h3 className="dd-section-title">Schedule Appointment with Doctor</h3>
                </div>
                <div className="nd-appt-form">
                    <div className="nd-appt-form-row">
                        <label className="nd-appt-label">Date
                            <input type="date" className="appt-input" value={date} onChange={e => setDate(e.target.value)} />
                        </label>
                        <label className="nd-appt-label">Time
                            <input type="time" className="appt-input" value={time} onChange={e => setTime(e.target.value)} />
                        </label>
                    </div>
                    <label className="nd-appt-label nd-appt-label--full">Reason
                        <input type="text" className="appt-input" placeholder="Reason for appointment..."
                            value={reason} onChange={e => setReason(e.target.value)} />
                    </label>
                    <button className="nd-schedule-btn" onClick={handleSchedule}>📅 Schedule Appointment</button>
                    {submitted && <div className="nd-schedule-success">✅ Appointment scheduled — Pending Approval</div>}
                </div>

                {appointments.length > 0 && (
                    <div className="nd-appt-list">
                        <div className="nd-appt-list-title">Scheduled Appointments</div>
                        {appointments.map((a, i) => (
                            <div key={i} className="appt-panel">
                                <div className="appt-info-row">
                                    <div className="appt-details">
                                        <div className="appt-datetime">📅 {a.date} &nbsp;⏰ {a.time}</div>
                                        <div className="appt-reason">Reason: <strong>{a.reason}</strong></div>
                                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Scheduled by {a.scheduledBy}</div>
                                    </div>
                                    <span className="appt-status appt-status--pending">{a.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Reports Page (Aggregate) ─────────────────────────────────────────────────
function ReportsPage({ patients }) {
    const [selected, setSelected] = useState(patients[0]?.id || null);
    const patient = patients.find(p => p.id === selected);

    return (
        <div className="doctor-home-content nd-reports-page">
            <div className="nd-reports-page-nav">
                {patients.map(p => (
                    <button key={p.id}
                        className={`nd-report-nav-btn${selected === p.id ? ' nd-report-nav-btn--active' : ''}`}
                        onClick={() => setSelected(p.id)}>
                        <span className={`pcase-status-dot pcase-status-dot--${p.riskClass}`} />
                        {p.name}
                    </button>
                ))}
            </div>
            {patient && <ReportsTab patient={patient} />}
        </div>
    );
}
