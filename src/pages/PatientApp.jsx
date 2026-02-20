import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// ─── Static Patient Data ───────────────────────────────────────────────────────
const PATIENT_DATA = {
    name: 'Alex Johnson',
    age: 32,
    gender: 'Male',
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Latex'],
    lastCheckup: '2026-02-18',
    diagnosis: 'Appendectomy',
    surgeryType: 'Laparoscopic',
    admissionDate: '2026-02-17',
    doctorAssigned: 'Dr. Sarah Mitchell',
    nurseAssigned: 'Nurse James Carter',
    daysSinceDischarge: 4,
    totalDays: 14,
    sugarLevel: 142,
    bp: '136/88',
    weight: '74 kg',
    height: "5'10\"",
    metricsTime: '8:45 AM, Feb 21',
    medications: [
        { name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', start: '2026-02-17', end: '2026-03-03' },
        { name: 'Ibuprofen', dosage: '400mg', frequency: 'Every 8 hours', start: '2026-02-17', end: '2026-02-25' },
    ],
    diet: {
        plan: 'Soft diet — easy-to-digest foods only.',
        foods: ['Rice porridge', 'Steamed vegetables', 'Plain yogurt', 'Chicken soup'],
        restrictions: ['No spicy food', 'No carbonated drinks', 'No raw vegetables', 'No alcohol'],
    },
    symptoms: [
        { name: 'Abdominal Pain', severity: 'moderate' },
        { name: 'Mild Fatigue', severity: 'mild' },
        { name: 'Nausea', severity: 'mild' },
    ],
    caseNotes: 'Patient underwent emergency appendectomy on Feb 17. Recovery progressing with mild discomfort. Wound site clean, no infection signs.',
    reports: [
        { type: 'Blood Panel (CBC)', date: '2026-02-18', uploadedBy: 'Lab Tech Priya', fileLabel: 'CBC_Feb18.pdf' },
        { type: 'Ultrasound – Abdomen', date: '2026-02-17', uploadedBy: 'Dr. Sarah Mitchell', fileLabel: 'US_abdomen.pdf' },
        { type: 'Prescription', date: '2026-02-17', uploadedBy: 'Dr. Sarah Mitchell', fileLabel: 'Rx_Feb17.pdf' },
    ],
};

// ─── AI Response Engine ────────────────────────────────────────────────────────
const SYMPTOM_KEYWORDS = {
    chest: { tag: 'chest pain', severity: 'high' },
    breath: { tag: 'breathing difficulty', severity: 'high' },
    breathing: { tag: 'breathing difficulty', severity: 'high' },
    fever: { tag: 'fever', severity: 'moderate' },
    bleed: { tag: 'bleeding', severity: 'high' },
    bleeding: { tag: 'bleeding', severity: 'high' },
    swell: { tag: 'swelling', severity: 'moderate' },
    swelling: { tag: 'swelling', severity: 'moderate' },
    pain: { tag: 'pain', severity: 'moderate' },
    nausea: { tag: 'nausea', severity: 'low' },
    dizzy: { tag: 'dizziness', severity: 'moderate' },
    tired: { tag: 'fatigue', severity: 'low' },
    fatigue: { tag: 'fatigue', severity: 'low' },
    vomit: { tag: 'vomiting', severity: 'moderate' },
    infection: { tag: 'possible infection', severity: 'high' },
    yellow: { tag: 'jaundice indicator', severity: 'high' },
};

function getAIResponse(userMsg, history, reportedSymptoms) {
    const lower = userMsg.toLowerCase();
    const detected = [];
    for (const [kw, info] of Object.entries(SYMPTOM_KEYWORDS)) {
        if (lower.includes(kw)) detected.push(info);
    }

    const highSeverity = detected.filter(d => d.severity === 'high');
    const medSeverity = detected.filter(d => d.severity === 'moderate');

    if (highSeverity.length > 0) {
        const tag = highSeverity[0].tag;
        return {
            text: `⚠️ I noticed you mentioned **${tag}**. This could be serious. I'm flagging this to your assigned nurse.\n\nPlease stay calm — someone from your care team will follow up shortly. If it's an emergency, call 112 immediately.`,
            escalate: true,
            detected,
        };
    }
    if (medSeverity.length > 0) {
        const tag = medSeverity[0].tag;
        return {
            text: `I've noted your report of **${tag}**. This is worth monitoring. Make sure you're resting and staying hydrated.\n\nI'll check in with you tomorrow about this. Would you like me to note this for your nurse as well?`,
            escalate: false,
            detected,
        };
    }
    if (lower.match(/good|better|well|fine|great|okay|ok/)) {
        return { text: `That's wonderful to hear! 😊 Staying positive helps recovery. Remember to take your medications on time and follow your diet plan.\n\nIs there anything else you'd like to share?`, escalate: false, detected: [] };
    }
    if (lower.match(/hello|hi|hey/)) {
        return { text: `Hello! 👋 I'm your AI health assistant. How are you feeling today? You can describe any new symptoms, ask about your medications, or just tell me how your day is going.`, escalate: false, detected: [] };
    }
    if (lower.match(/medic|pill|tablet|dosage|drug/)) {
        return { text: `Your current medications are:\n• **Amoxicillin** 500mg – twice daily\n• **Ibuprofen** 400mg – every 8 hours\n\nAlways take them with food and water. Don't skip doses. Let me know if you experience any side effects. 💊`, escalate: false, detected: [] };
    }
    if (lower.match(/diet|food|eat|drink|hungry/)) {
        return { text: `Your prescribed diet is **soft and easy-to-digest**:\n✅ Rice porridge, steamed vegetables, plain yogurt, chicken soup\n❌ Avoid spicy food, carbonated drinks, raw vegetables\n\nStaying well-hydrated is very important during recovery! 🥗`, escalate: false, detected: [] };
    }
    if (lower.match(/appointment|doctor|schedule/)) {
        return { text: `Your doctor Dr. Sarah Mitchell has been notified. If you need to schedule an appointment urgently, your assigned nurse can arrange that for you.\n\nShall I flag this request to Nurse James Carter?`, escalate: false, detected: [] };
    }

    return {
        text: `Thank you for sharing that. I've logged your update for Day ${PATIENT_DATA.daysSinceDischarge} of your recovery.\n\nKeep resting and follow your care plan. I'll check in with you tomorrow. Stay strong! 💪`,
        escalate: false,
        detected: [],
    };
}

function loadChatHistory() {
    try { return JSON.parse(localStorage.getItem('pd_chat_history') || '[]'); } catch { return []; }
}
function saveChatHistory(h) {
    try { localStorage.setItem('pd_chat_history', JSON.stringify(h.slice(-40))); } catch { }
}
function loadReportedSymptoms() {
    try { return JSON.parse(localStorage.getItem('pd_reported_symptoms') || '[]'); } catch { return []; }
}
function saveReportedSymptoms(s) {
    try { localStorage.setItem('pd_reported_symptoms', JSON.stringify(s)); } catch { }
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function PatientApp() {
    const { user, logout } = useAuth();
    const [activePage, setActivePage] = useState('home');
    const [chatHistory, setChatHistory] = useState(() => {
        const stored = loadChatHistory();
        if (stored.length === 0) {
            return [{
                role: 'ai',
                text: `Hello Alex 👋 I'm your AI health assistant. How are you feeling today?\n\nYou reported **mild nausea** and **abdominal pain** yesterday. Are those still bothering you?`,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            }];
        }
        return stored;
    });
    const [reportedSymptoms, setReportedSymptoms] = useState(loadReportedSymptoms);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const fileInputRef = useRef();

    const p = PATIENT_DATA;
    const recoveryRate = Math.round((p.daysSinceDischarge / p.totalDays) * 100);
    const sugarColor = p.sugarLevel > 160 ? 'red' : p.sugarLevel > 120 ? 'yellow' : 'green';
    const bpSys = parseInt(p.bp.split('/')[0]);
    const bpColor = bpSys > 139 ? 'red' : bpSys > 129 ? 'yellow' : 'green';

    const sendMessage = (text) => {
        if (!text.trim()) return;
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const userMsg = { role: 'user', text, time };
        const response = getAIResponse(text, chatHistory, reportedSymptoms);
        const aiMsg = { role: 'ai', text: response.text, time, escalated: response.escalate };
        const newHistory = [...chatHistory, userMsg, aiMsg];

        if (response.detected.length > 0) {
            const updated = [...reportedSymptoms, ...response.detected.map(d => ({ ...d, date: new Date().toISOString().split('T')[0] }))];
            setReportedSymptoms(updated);
            saveReportedSymptoms(updated);
        }
        setChatHistory(newHistory);
        saveChatHistory(newHistory);
    };

    const handleUpload = (e) => {
        const files = Array.from(e.target.files || []);
        const newFiles = files.map(f => ({
            type: f.type.includes('image') ? 'Scan / Image' : 'Medical Document',
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            uploadedBy: user?.name || 'Alex Johnson',
            fileLabel: f.name,
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
    };

    const allReports = useMemo(() => [...p.reports, ...uploadedFiles], [uploadedFiles]);

    return (
        <div className="dashboard pd-dash">
            {/* Sidebar */}
            <aside className="doctor-sidebar">
                <div className="doctor-sidebar-logo">🩺</div>
                <nav className="doctor-sidebar-nav">
                    {[
                        { id: 'home', icon: '🏠', label: 'Home' },
                        { id: 'reports', icon: '📁', label: 'Reports' },
                    ].map(item => (
                        <button key={item.id}
                            className={`doctor-nav-icon-btn${activePage === item.id ? ' doctor-nav-icon-btn--active' : ''}`}
                            onClick={() => setActivePage(item.id)} title={item.label}>
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
                        <h1 className="dash-title">{activePage === 'home' ? 'My Health Dashboard' : 'My Reports'}</h1>
                        <p className="dash-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="dash-topbar-right">
                        <span className="dash-role-badge pd-role-badge">🧑‍⚕️ Patient</span>
                        <span className="dash-user">{p.name}</span>
                        <span className="dash-avatar">👤</span>
                    </div>
                </div>

                {activePage === 'home' && (
                    <HomePage p={p} recoveryRate={recoveryRate} sugarColor={sugarColor} bpColor={bpColor}
                        chatHistory={chatHistory} sendMessage={sendMessage} />
                )}
                {activePage === 'reports' && (
                    <ReportsPage allReports={allReports} recoveryRate={recoveryRate} sugarColor={sugarColor} bpColor={bpColor}
                        onUploadClick={() => fileInputRef.current?.click()} p={p} />
                )}
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx"
                    style={{ display: 'none' }} onChange={handleUpload} />
            </main>
        </div>
    );
}

// ─── Home Page ─────────────────────────────────────────────────────────────────
function HomePage({ p, recoveryRate, sugarColor, bpColor, chatHistory, sendMessage }) {
    return (
        <div className="pd-home-content">
            {/* A. Patient Overview */}
            <section className="pd-section">
                <div className="pd-overview-card">
                    <div className="pd-avatar">👤</div>
                    <div className="pd-overview-info">
                        <div className="pd-overview-name">{p.name}</div>
                        <div className="pd-overview-meta">Age: <strong>{p.age}</strong> · {p.gender} · Blood Group: <strong className="pd-blood">{p.bloodGroup}</strong></div>
                        <div className="pd-overview-meta">Last Checkup: <strong>{p.lastCheckup}</strong></div>
                        <div className="pd-allergy-row">
                            {p.allergies.map((a, i) => <span key={i} className="pd-allergy-chip">⚠️ {a}</span>)}
                        </div>
                    </div>
                    <div className="pd-overview-cycle">
                        <div className="pd-cycle-num">Day {p.daysSinceDischarge}</div>
                        <div className="pd-cycle-sub">of {p.totalDays}-day recovery</div>
                        <div className="pd-cycle-bar-wrap">
                            <div className="pd-cycle-bar" style={{ width: `${recoveryRate}%` }} />
                        </div>
                        <div className="pd-cycle-pct">{recoveryRate}% complete</div>
                    </div>
                </div>
            </section>

            {/* B. Case Details */}
            <section className="pd-section">
                <div className="pd-section-title">📄 Case Details</div>
                <div className="pd-case-card">
                    <div className="pd-case-grid">
                        {[
                            ['Diagnosis', p.diagnosis],
                            ['Surgery Type', p.surgeryType],
                            ['Admission Date', p.admissionDate],
                            ['Doctor', p.doctorAssigned],
                            ['Nurse', p.nurseAssigned],
                            ['Recovery', `Day ${p.daysSinceDischarge} of ${p.totalDays}`],
                        ].map(([l, v]) => (
                            <div key={l} className="pd-case-field">
                                <div className="pd-case-label">{l}</div>
                                <div className="pd-case-value">{v}</div>
                            </div>
                        ))}
                    </div>
                    <div className="pd-case-notes">
                        <div className="pd-case-notes-label">Case Summary</div>
                        <div className="pd-case-notes-text">{p.caseNotes}</div>
                    </div>
                </div>
            </section>

            {/* C. Health Metrics */}
            <section className="pd-section">
                <div className="pd-section-title">📊 Health Metrics</div>
                <div className="pd-metrics-grid">
                    <MetricCard label="Sugar Level" value={`${p.sugarLevel} mg/dL`} color={sugarColor} icon="🩸" normal="70–120" time={p.metricsTime} />
                    <MetricCard label="Blood Pressure" value={p.bp} color={bpColor} icon="❤️" normal="<130/85" time={p.metricsTime} />
                    <MetricCard label="Weight" value={p.weight} color="green" icon="⚖️" normal="Stable" time={p.metricsTime} />
                    <MetricCard label="Height" value={p.height} color="green" icon="📏" normal="—" time={p.metricsTime} />
                </div>
            </section>

            {/* D. Medications & Diet */}
            <section className="pd-section">
                <div className="pd-section-title">💊 Medications & Diet Plan <span className="nd-readonly-badge">Read Only</span></div>
                <div className="pd-med-diet-grid">
                    <div className="pd-meds-card">
                        <div className="pd-sub-title">Current Medications</div>
                        {p.medications.map((m, i) => (
                            <div key={i} className="pd-med-row">
                                <span className="pd-med-icon">💊</span>
                                <div className="pd-med-info">
                                    <div className="pd-med-name">{m.name} <span className="pd-med-dose">{m.dosage}</span></div>
                                    <div className="pd-med-freq">{m.frequency} · {m.start} → {m.end}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pd-diet-card">
                        <div className="pd-sub-title">Diet Plan</div>
                        <div className="pd-diet-plan">{p.diet.plan}</div>
                        <div className="pd-diet-items">
                            {p.diet.foods.map((f, i) => <span key={i} className="pd-food-chip">✅ {f}</span>)}
                        </div>
                        <div className="pd-restrict-title">Restrictions</div>
                        <div className="pd-diet-items">
                            {p.diet.restrictions.map((r, i) => <span key={i} className="pd-restrict-chip">❌ {r}</span>)}
                        </div>
                    </div>
                </div>
            </section>

            {/* E. Symptoms */}
            <section className="pd-section">
                <div className="pd-section-title">⚠️ Active Symptoms</div>
                <div className="pd-symptom-bubbles">
                    {p.symptoms.map((s, i) => (
                        <div key={i} className={`pd-symptom-bubble pd-symptom-bubble--${s.severity}`}>
                            <span className="pd-symptom-name">{s.name}</span>
                            <span className={`pd-sev-dot pd-sev-dot--${s.severity}`} />
                            <span className={`pd-sev-label pd-sev-label--${s.severity}`}>
                                {s.severity.charAt(0).toUpperCase() + s.severity.slice(1)}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* F. AI Chat */}
            <section className="pd-section">
                <div className="pd-section-title">🤖 AI Health Assistant</div>
                <AIChat chatHistory={chatHistory} onSend={sendMessage} />
            </section>
        </div>
    );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, color, icon, normal, time }) {
    return (
        <div className={`pd-metric-card pd-metric-card--${color}`}>
            <div className="pd-metric-icon">{icon}</div>
            <div className="pd-metric-label">{label}</div>
            <div className={`pd-metric-value pd-metric-value--${color}`}>{value}</div>
            <div className="pd-metric-normal">Normal: {normal}</div>
            <div className="pd-metric-time">{time}</div>
        </div>
    );
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────
function AIChat({ chatHistory, onSend }) {
    const [input, setInput] = useState('');
    const bottomRef = useRef();

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handle = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput('');
    };

    const formatText = (text) =>
        text.split('\n').map((line, i) => {
            const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
        });

    return (
        <div className="pd-ai-chat">
            <div className="pd-chat-messages">
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`pd-chat-bubble pd-chat-bubble--${msg.role}`}>
                        <div className="pd-chat-sender">{msg.role === 'ai' ? '🤖 AI Assistant' : '👤 You'}</div>
                        <div className="pd-chat-text">{formatText(msg.text)}</div>
                        {msg.escalated && (
                            <div className="pd-escalate-alert">🚨 Nurse James Carter has been notified.</div>
                        )}
                        <div className="pd-chat-time">{msg.time}</div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="pd-chat-input-row">
                <input className="pd-chat-input" type="text" placeholder="Describe your symptoms or ask a question..."
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handle()} />
                <button className="pd-chat-send-btn" onClick={handle}>Send 💬</button>
            </div>
            <div className="pd-chat-hints">
                {['How am I doing?', 'I have a fever', 'Chest pain', 'What can I eat?'].map(hint => (
                    <button key={hint} className="pd-hint-chip" onClick={() => { onSend(hint); }}>{hint}</button>
                ))}
            </div>
        </div>
    );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
function ReportsPage({ allReports, recoveryRate, sugarColor, bpColor, onUploadClick, p }) {
    const sugarTrend = p.sugarLevel > 160 ? '↑ Elevated' : p.sugarLevel > 120 ? '~ Borderline' : '✓ Normal';
    const bpTrend = parseInt(p.bp) > 139 ? '↑ High' : parseInt(p.bp) > 129 ? '~ Borderline' : '✓ Normal';
    const recoveryExplain = recoveryRate >= 70 ? 'Excellent — on track for full recovery.'
        : recoveryRate >= 40 ? 'Good — steady improvement over last 7 days.'
            : 'Early stage — continue following your care plan.';

    return (
        <div className="pd-home-content">
            {/* Upload */}
            <section className="pd-section">
                <div className="pd-section-title">📤 Upload Medical Files</div>
                <div className="pd-upload-zone" onClick={onUploadClick}>
                    <div className="pd-upload-icon">📎</div>
                    <div className="pd-upload-text">Click to upload reports, scans, or images</div>
                    <div className="pd-upload-sub">PDF, DOC, JPG, PNG supported</div>
                    <button className="pd-upload-btn">Choose Files</button>
                </div>
            </section>

            {/* Reports List */}
            <section className="pd-section">
                <div className="pd-section-title">📁 Reports & Scans <span className="assign-count-badge">{allReports.length}</span></div>
                <div className="pd-report-list">
                    {allReports.map((r, i) => (
                        <div key={i} className="pd-report-card">
                            <div className="pd-report-icon">📄</div>
                            <div className="pd-report-info">
                                <div className="pd-report-type">{r.type}</div>
                                <div className="pd-report-meta">Uploaded: {r.date} · by {r.uploadedBy}</div>
                                <div className="pd-report-file">📎 {r.fileLabel}</div>
                            </div>
                            <span className="pd-report-badge">Available</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Report Summary */}
            <section className="pd-section">
                <div className="pd-section-title">📈 Automated Report Summary</div>
                <div className="pd-vitals-summary">
                    <div className={`pd-vital-card pd-vital-card--${sugarColor}`}>
                        <div className="pd-vital-icon">🩸</div>
                        <div className="pd-vital-label">Sugar Level</div>
                        <div className="pd-vital-value">{p.sugarLevel} mg/dL</div>
                        <div className="pd-vital-trend">{sugarTrend}</div>
                        <div className="pd-vital-time">{p.metricsTime}</div>
                    </div>
                    <div className={`pd-vital-card pd-vital-card--${bpColor}`}>
                        <div className="pd-vital-icon">❤️</div>
                        <div className="pd-vital-label">Blood Pressure</div>
                        <div className="pd-vital-value">{p.bp} mmHg</div>
                        <div className="pd-vital-trend">{bpTrend}</div>
                        <div className="pd-vital-time">{p.metricsTime}</div>
                    </div>
                    <div className="pd-vital-card pd-vital-card--green">
                        <div className="pd-vital-icon">💊</div>
                        <div className="pd-vital-label">Medication Status</div>
                        <div className="pd-vital-value">Active</div>
                        <div className="pd-vital-trend">✓ On schedule</div>
                        <div className="pd-vital-time">{p.metricsTime}</div>
                    </div>
                </div>
            </section>

            {/* Recovery Rate */}
            <section className="pd-section">
                <div className="pd-section-title">📊 Recovery Rate Estimation</div>
                <div className="pd-recovery-card">
                    <div className="pd-recovery-top">
                        <div className="pd-recovery-pct-big">{recoveryRate}%</div>
                        <div className="pd-recovery-label">Estimated Recovery</div>
                    </div>
                    <div className="pd-recovery-bar-outer">
                        <div className="pd-recovery-bar-fill" style={{ width: `${recoveryRate}%` }} />
                    </div>
                    <div className="pd-recovery-explain">{recoveryExplain}</div>
                    <div className="pd-recovery-factors">
                        <div className="pd-factor">Day {p.daysSinceDischarge} of {p.totalDays}</div>
                        <div className="pd-factor">Medications: Active</div>
                        <div className="pd-factor">Symptoms: Monitored</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
