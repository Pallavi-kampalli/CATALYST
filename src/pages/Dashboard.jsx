import React, { useState, useMemo, useCallback } from 'react';
import { engineerFeatures } from '../ml/features';
import { predictSync } from '../ml/model';
import { useAuth } from '../context/AuthContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Static seed data ─────────────────────────────────────────────────────────
const RAW_PATIENTS = [
    {
        id: 1, name: 'Maria Rodriguez', age: 34, gender: 'Female',
        condition: 'Appendectomy', daysSinceDischarge: 4, totalDays: 14,
        painBase: 7.5, tempBase: 101.2, sleepBase: 4, moodBase: 2,
        sugarLevel: 182, bp: '148/96', metricsTime: '11:42 AM',
        symptoms: [
            { name: 'Abdominal Pain', severity: 'severe' },
            { name: 'Nausea', severity: 'moderate' },
            { name: 'Fatigue', severity: 'moderate' },
        ],
        medications: [
            { id: 'm1', name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily' },
            { id: 'm2', name: 'Ibuprofen', dosage: '400mg', frequency: 'Every 8 hours' },
        ],
        appointment: { date: '2026-02-22', time: '10:00 AM', reason: 'Post-op wound check', status: 'pending' },
        caseNotes: 'Patient underwent emergency appendectomy on Feb 16. Recovery progressing slowly with elevated pain levels.',
        diagnosisNotes: 'Acute appendicitis, non-perforated. Laparoscopic procedure performed.',
        treatmentHistory: 'IV antibiotics for 48 hrs post-op. Wound dressing changed daily.',
        recoveryNotes: 'Advised soft diet, limited physical activity for 2 weeks.',
    },
    {
        id: 2, name: 'James Chen', age: 67, gender: 'Male',
        condition: 'Hip Replacement', daysSinceDischarge: 18, totalDays: 30,
        painBase: 6.0, tempBase: 100.1, sleepBase: 5, moodBase: 2,
        sugarLevel: 156, bp: '138/88', metricsTime: '9:15 AM',
        symptoms: [
            { name: 'Hip Pain', severity: 'severe' },
            { name: 'Limited Mobility', severity: 'moderate' },
            { name: 'Insomnia', severity: 'mild' },
        ],
        medications: [
            { id: 'm1', name: 'Warfarin', dosage: '5mg', frequency: 'Once daily' },
            { id: 'm2', name: 'Tramadol', dosage: '50mg', frequency: 'Every 6 hours' },
        ],
        appointment: { date: '2026-02-24', time: '2:00 PM', reason: 'Physiotherapy assessment', status: 'approved' },
        caseNotes: 'Total hip arthroplasty. Patient reports persistent pain during ambulation.',
        diagnosisNotes: 'Severe osteoarthritis of left hip. THA performed successfully.',
        treatmentHistory: 'DVT prophylaxis with warfarin. Daily physiotherapy sessions started.',
        recoveryNotes: 'PT visits 3x weekly. Weight-bearing as tolerated.',
    },
    {
        id: 3, name: 'Aisha Patel', age: 29, gender: 'Female',
        condition: 'C-Section', daysSinceDischarge: 8, totalDays: 21,
        painBase: 3.5, tempBase: 99.2, sleepBase: 6, moodBase: 3,
        sugarLevel: 98, bp: '118/76', metricsTime: '8:30 AM',
        symptoms: [
            { name: 'Incision Soreness', severity: 'mild' },
            { name: 'Fatigue', severity: 'moderate' },
        ],
        medications: [
            { id: 'm1', name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours' },
            { id: 'm2', name: 'Iron Supplements', dosage: '325mg', frequency: 'Once daily' },
        ],
        appointment: { date: '2026-02-23', time: '11:00 AM', reason: 'Wound check & newborn weigh-in', status: 'pending' },
        caseNotes: 'Elective C-section at 39 weeks. Mother and baby stable.',
        diagnosisNotes: 'Cephalopelvic disproportion. Pfannenstiel incision, no complications.',
        treatmentHistory: 'Oxytocin drip post-delivery. Breastfeeding support provided.',
        recoveryNotes: 'Avoid heavy lifting for 6 weeks. Pelvic floor exercises encouraged.',
    },
    {
        id: 4, name: 'Robert Kim', age: 52, gender: 'Male',
        condition: 'Knee Surgery', daysSinceDischarge: 14, totalDays: 30,
        painBase: 5.5, tempBase: 100.0, sleepBase: 5, moodBase: 3,
        sugarLevel: 134, bp: '132/84', metricsTime: '10:05 AM',
        symptoms: [
            { name: 'Knee Swelling', severity: 'moderate' },
            { name: 'Stiffness', severity: 'moderate' },
            { name: 'Bruising', severity: 'mild' },
        ],
        medications: [
            { id: 'm1', name: 'Celecoxib', dosage: '200mg', frequency: 'Twice daily' },
            { id: 'm2', name: 'Aspirin', dosage: '81mg', frequency: 'Once daily' },
        ],
        appointment: { date: '2026-02-25', time: '3:00 PM', reason: 'Follow-up X-ray', status: 'pending' },
        caseNotes: 'ACL reconstruction with hamstring graft. Progressing with PT.',
        diagnosisNotes: 'Complete ACL tear, right knee. Arthroscopic reconstruction performed.',
        treatmentHistory: 'Crutches for 4 weeks. Cold therapy. Resistance band exercises.',
        recoveryNotes: 'Return to sport expected at 6 months. Currently at Phase 1 PT.',
    },
    {
        id: 5, name: 'Sofia Okafor', age: 61, gender: 'Female',
        condition: 'Cardiac Stent', daysSinceDischarge: 6, totalDays: 21,
        painBase: 2.0, tempBase: 98.4, sleepBase: 8, moodBase: 4,
        sugarLevel: 105, bp: '124/78', metricsTime: '7:50 AM',
        symptoms: [
            { name: 'Mild Chest Tightness', severity: 'mild' },
        ],
        medications: [
            { id: 'm1', name: 'Clopidogrel', dosage: '75mg', frequency: 'Once daily' },
            { id: 'm2', name: 'Atorvastatin', dosage: '40mg', frequency: 'Nightly' },
        ],
        appointment: { date: '2026-02-26', time: '9:30 AM', reason: 'Cardiac echo follow-up', status: 'approved' },
        caseNotes: 'PTCA with DES placement in LAD. Patient tolerating dual antiplatelet well.',
        diagnosisNotes: 'NSTEMI. 80% LAD stenosis. Stent placed successfully.',
        treatmentHistory: 'Heparin infusion peri-procedure. DAPT initiated.',
        recoveryNotes: 'Cardiac rehab enrollment recommended. Low-sodium diet.',
    },
    {
        id: 6, name: 'David Walsh', age: 44, gender: 'Male',
        condition: 'Gallbladder Removal', daysSinceDischarge: 25, totalDays: 28,
        painBase: 1.5, tempBase: 98.2, sleepBase: 8, moodBase: 5,
        sugarLevel: 92, bp: '118/72', metricsTime: '8:15 AM',
        symptoms: [
            { name: 'Mild Bloating', severity: 'mild' },
        ],
        medications: [
            { id: 'm1', name: 'Ursodiol', dosage: '300mg', frequency: 'Twice daily' },
        ],
        appointment: { date: '2026-02-28', time: '10:00 AM', reason: 'Final post-op clearance', status: 'pending' },
        caseNotes: 'Laparoscopic cholecystectomy. Near full recovery. Minor dietary discomfort.',
        diagnosisNotes: 'Symptomatic cholelithiasis. No gallbladder perforation.',
        treatmentHistory: 'Laparoscopic procedure under GA. 3 port technique. Discharged D+1.',
        recoveryNotes: 'Low-fat diet for 4 weeks. Resume normal activity by week 6.',
    },
    {
        id: 7, name: 'Priya Sharma', age: 39, gender: 'Female',
        condition: 'Spinal Fusion', daysSinceDischarge: 10, totalDays: 45,
        painBase: 4.5, tempBase: 99.5, sleepBase: 6, moodBase: 3,
        sugarLevel: 118, bp: '126/82', metricsTime: '11:00 AM',
        symptoms: [
            { name: 'Lower Back Pain', severity: 'moderate' },
            { name: 'Radiating Leg Pain', severity: 'mild' },
        ],
        medications: [
            { id: 'm1', name: 'Gabapentin', dosage: '300mg', frequency: 'Three times daily' },
            { id: 'm2', name: 'Cyclobenzaprine', dosage: '5mg', frequency: 'At bedtime' },
        ],
        appointment: { date: '2026-02-23', time: '1:00 PM', reason: 'Neurological assessment', status: 'pending' },
        caseNotes: 'L4-L5 TLIF with pedicle screw fixation. Recovery on track.',
        diagnosisNotes: 'Grade II spondylolisthesis L4-L5. Neurogenic intermittent claudication.',
        treatmentHistory: 'Pre-op epidural steroid injection. Post-op brace for 6 weeks.',
        recoveryNotes: 'No twisting or bending. Bladder and bowel function normal.',
    },
    {
        id: 8, name: 'Tom Mitchell', age: 28, gender: 'Male',
        condition: 'Hernia Repair', daysSinceDischarge: 3, totalDays: 14,
        painBase: 6.8, tempBase: 101.5, sleepBase: 4, moodBase: 2,
        sugarLevel: 164, bp: '144/92', metricsTime: '12:30 PM',
        symptoms: [
            { name: 'Groin Pain', severity: 'severe' },
            { name: 'Swelling', severity: 'severe' },
            { name: 'Low-grade Fever', severity: 'moderate' },
        ],
        medications: [
            { id: 'm1', name: 'Co-Amoxiclav', dosage: '625mg', frequency: 'Three times daily' },
            { id: 'm2', name: 'Diclofenac', dosage: '50mg', frequency: 'Twice daily' },
        ],
        appointment: { date: '2026-02-21', time: '10:30 AM', reason: 'Wound inspection — possible infection', status: 'pending' },
        caseNotes: 'Laparoscopic inguinal hernia repair. Post-op swelling elevated. Possible early SSI.',
        diagnosisNotes: 'Right inguinal hernia with mesh repair. Fever flagged D+3.',
        treatmentHistory: 'IV Co-Amoxiclav 24 hrs post-op. Wound swab sent to lab.',
        recoveryNotes: 'Patient to avoid activity until swelling resolves. Review in 48 hrs.',
    },
    {
        id: 9, name: 'Lin Wei', age: 55, gender: 'Female',
        condition: 'Shoulder Surgery', daysSinceDischarge: 20, totalDays: 28,
        painBase: 2.5, tempBase: 98.6, sleepBase: 7, moodBase: 4,
        sugarLevel: 96, bp: '120/74', metricsTime: '9:45 AM',
        symptoms: [
            { name: 'Shoulder Stiffness', severity: 'mild' },
        ],
        medications: [
            { id: 'm1', name: 'Naproxen', dosage: '500mg', frequency: 'Twice daily' },
        ],
        appointment: { date: '2026-02-27', time: '11:30 AM', reason: 'Range-of-motion reassessment', status: 'approved' },
        caseNotes: 'Rotator cuff repair. Excellent progress with physiotherapy.',
        diagnosisNotes: 'Full-thickness supraspinatus tear. Arthroscopic repair performed.',
        treatmentHistory: 'Sling immobilization 3 weeks. Pendulum exercises started week 2.',
        recoveryNotes: 'Expected return to full function at 4–6 months.',
    },
    {
        id: 10, name: 'Emma Stone', age: 47, gender: 'Female',
        condition: 'Bowel Resection', daysSinceDischarge: 9, totalDays: 21,
        painBase: 5.0, tempBase: 100.5, sleepBase: 5, moodBase: 3,
        sugarLevel: 141, bp: '134/86', metricsTime: '10:20 AM',
        symptoms: [
            { name: 'Abdominal Cramping', severity: 'moderate' },
            { name: 'Loose Stools', severity: 'mild' },
            { name: 'Fatigue', severity: 'moderate' },
        ],
        medications: [
            { id: 'm1', name: 'Metronidazole', dosage: '400mg', frequency: 'Three times daily' },
            { id: 'm2', name: 'Loperamide', dosage: '2mg', frequency: 'After each loose stool' },
        ],
        appointment: { date: '2026-02-24', time: '2:30 PM', reason: 'Stoma review and diet planning', status: 'pending' },
        caseNotes: 'Right hemicolectomy for adenocarcinoma. Temporary loop ileostomy in situ.',
        diagnosisNotes: 'Stage II colorectal adenocarcinoma. R0 resection achieved.',
        treatmentHistory: 'Pre-op bowel prep. Post-op nasogastric tube 24 hrs. Stoma output monitored.',
        recoveryNotes: 'Stoma nurse visiting daily. Nutritionist consulted for diet plan.',
    },
];

const TEAM_MEMBERS = [
    { id: 't1', name: 'Nurse Ananya', role: 'nurse' },
    { id: 't2', name: 'Nurse Rahul', role: 'nurse' },
    { id: 't3', name: 'Intern1', role: 'intern' },
    { id: 't4', name: 'Intern2', role: 'intern' },
    { id: 't5', name: 'Intern3', role: 'intern' },
];

function buildPatients() {
    return RAW_PATIENTS.map((p, idx) => {
        const entries = generateEntries(Math.min(p.daysSinceDischarge, 7), p.painBase, p.tempBase, p.sleepBase, p.moodBase);
        const features = engineerFeatures(entries, p.daysSinceDischarge);
        const { score, label, riskClass } = predictSync(features);
        const recoveryRate = Math.round(Math.min(100, (p.daysSinceDischarge / p.totalDays) * 100));
        const reviewers = ['Intern1', 'Intern2', 'Intern3', 'Nurse Ananya', 'Nurse Rahul'];
        const times = ['9:00 AM', '10:30 AM', '11:00 AM', '12:15 PM', '2:00 PM', '3:45 PM'];
        return {
            ...p, entries, riskScore: score, riskLabel: label, riskClass, recoveryRate,
            lastReviewer: reviewers[idx % reviewers.length],
            lastReviewTime: times[idx % times.length],
        };
    });
}

const ALL_PATIENTS = buildPatients();

// Initial dual-assignment map: { patientId: { nurse: id|null, intern: id|null } }
const INITIAL_ASSIGNMENTS = (() => {
    const nurses = TEAM_MEMBERS.filter(m => m.role === 'nurse');
    const interns = TEAM_MEMBERS.filter(m => m.role === 'intern');
    return Object.fromEntries(ALL_PATIENTS.map((p, i) => [
        p.id,
        {
            nurse: i % 4 === 0 ? null : nurses[i % nurses.length]?.id ?? null,
            intern: i % 3 === 0 ? null : interns[i % interns.length]?.id ?? null,
        }
    ]));
})();

// ─── Root Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
    const { user, logout } = useAuth();
    const [activePage, setActivePage] = useState('home');
    const [expandedId, setExpandedId] = useState(null);
    const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
    const [pendingAssign, setPendingAssign] = useState({});

    // Per-patient mutable state: appointments, medications, med last-updated
    const [apptState, setApptState] = useState(() =>
        Object.fromEntries(ALL_PATIENTS.map(p => [p.id, { ...p.appointment }]))
    );
    const [medState, setMedState] = useState(() =>
        Object.fromEntries(ALL_PATIENTS.map(p => [p.id, p.medications.map(m => ({ ...m }))]))
    );
    const [medUpdatedAt, setMedUpdatedAt] = useState({});

    const isDoctor = user?.role === 'doctor';
    const nurses = TEAM_MEMBERS.filter(m => m.role === 'nurse');
    const interns = TEAM_MEMBERS.filter(m => m.role === 'intern');

    const high = useMemo(() => ALL_PATIENTS.filter(p => p.riskClass === 'high'), []);
    const moderate = useMemo(() => ALL_PATIENTS.filter(p => p.riskClass === 'moderate'), []);
    const stable = useMemo(() => ALL_PATIENTS.filter(p => p.riskClass !== 'high' && p.riskClass !== 'moderate'), []);

    const toggleExpand = useCallback((id) => {
        setExpandedId(prev => prev === id ? null : id);
    }, []);

    // Appointment handlers
    const handleApptAction = (patientId, action, rescheduleData) => {
        setApptState(prev => ({
            ...prev,
            [patientId]: {
                ...prev[patientId],
                status: action,
                ...(rescheduleData || {}),
            }
        }));
    };

    // Medication handlers
    const handleAddMed = (patientId, med) => {
        const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setMedState(prev => ({
            ...prev,
            [patientId]: [...(prev[patientId] || []), { ...med, id: `m${Date.now()}` }]
        }));
        setMedUpdatedAt(prev => ({ ...prev, [patientId]: now }));
    };

    const handleEditMed = (patientId, medId, updatedMed) => {
        const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setMedState(prev => ({
            ...prev,
            [patientId]: (prev[patientId] || []).map(m => m.id === medId ? { ...m, ...updatedMed } : m)
        }));
        setMedUpdatedAt(prev => ({ ...prev, [patientId]: now }));
    };

    const handleRemoveMed = (patientId, medId) => {
        const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setMedState(prev => ({
            ...prev,
            [patientId]: (prev[patientId] || []).filter(m => m.id !== medId)
        }));
        setMedUpdatedAt(prev => ({ ...prev, [patientId]: now }));
    };

    // Assignment handlers
    const handleAssignUpdate = (patientId) => {
        const pending = pendingAssign[patientId] || {};
        setAssignments(prev => ({
            ...prev,
            [patientId]: {
                nurse: 'nurse' in pending ? pending.nurse : prev[patientId]?.nurse ?? null,
                intern: 'intern' in pending ? pending.intern : prev[patientId]?.intern ?? null,
            }
        }));
        setPendingAssign(prev => { const n = { ...prev }; delete n[patientId]; return n; });
    };

    const setPendingField = (patientId, field, value) => {
        setPendingAssign(prev => ({
            ...prev,
            [patientId]: { ...(prev[patientId] || {}), [field]: value || null }
        }));
    };

    const internCaseCounts = useMemo(() => {
        const c = {};
        interns.forEach(i => { c[i.id] = 0; });
        Object.values(assignments).forEach(a => {
            if (a.intern) c[a.intern] = (c[a.intern] || 0) + 1;
        });
        return c;
    }, [assignments]);

    const assigned = ALL_PATIENTS.filter(p => assignments[p.id]?.nurse || assignments[p.id]?.intern);
    const unassigned = ALL_PATIENTS.filter(p => !assignments[p.id]?.nurse && !assignments[p.id]?.intern);

    const detailProps = { apptState, medState, medUpdatedAt, handleApptAction, handleAddMed, handleEditMed, handleRemoveMed, nurses, interns };

    return (
        <div className="dashboard doctor-dash">
            {/* ── Icon Sidebar ── */}
            <aside className="doctor-sidebar">
                <div className="doctor-sidebar-logo">🩺</div>
                <nav className="doctor-sidebar-nav">
                    {[
                        { id: 'home', icon: '🏠', label: 'Home' },
                        { id: 'assigned', icon: '📌', label: 'Assigned To' },
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
                    🚪
                    <span className="doctor-nav-tooltip">Logout</span>
                </button>
            </aside>

            {/* ── Main ── */}
            <main className="doctor-main">
                <div className="dash-topbar">
                    <div>
                        <h1 className="dash-title">{activePage === 'home' ? 'Doctor Dashboard' : 'Assigned To'}</h1>
                        <p className="dash-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="dash-topbar-right">
                        <span className="dash-role-badge dash-role-badge--doctor">🩺 {isDoctor ? 'Doctor' : user?.role}</span>
                        <span className="dash-user">{user?.name || 'Clinician'}</span>
                        <span className="dash-avatar">👩‍⚕️</span>
                    </div>
                </div>

                {/* HOME PAGE */}
                {activePage === 'home' && (
                    <div className="doctor-home-content">
                        <RiskSection title="Attention Needed" count={high.length} patients={high} accentKey="high"
                            expandedId={expandedId} toggleExpand={toggleExpand} detailProps={detailProps} assignments={assignments} />
                        <RiskSection title="Moderate" count={moderate.length} patients={moderate} accentKey="moderate"
                            expandedId={expandedId} toggleExpand={toggleExpand} detailProps={detailProps} assignments={assignments} />
                        <RiskSection title="Stable" count={stable.length} patients={stable} accentKey="stable"
                            expandedId={expandedId} toggleExpand={toggleExpand} detailProps={detailProps} assignments={assignments} />
                    </div>
                )}

                {/* ASSIGNED TO PAGE */}
                {activePage === 'assigned' && (
                    <div className="doctor-assigned-content">
                        {/* Stats */}
                        <div className="team-overview-grid">
                            <StatCard icon="💉" label="Nurses" value={nurses.length} color="nurse" />
                            <StatCard icon="🩻" label="Interns" value={interns.length} color="intern" />
                            <StatCard icon="✅" label="Assigned" value={assigned.length} color="total" />
                            <StatCard icon="📋" label="Unassigned" value={unassigned.length} color="unassigned" />
                        </div>

                        {/* Team Members */}
                        <section className="assigned-section">
                            <h2 className="assigned-section-title">Team Members</h2>
                            <div className="team-member-list">
                                {TEAM_MEMBERS.map(member => (
                                    <div key={member.id} className={`team-member-card team-member-card--${member.role}`}>
                                        <div className="team-member-avatar">{member.role === 'nurse' ? '💉' : '🩻'}</div>
                                        <div className="team-member-info">
                                            <div className="team-member-name">{member.name}</div>
                                            <div className="team-member-role">{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</div>
                                        </div>
                                        {member.role === 'intern' && (
                                            <div className="team-member-cases">
                                                <span className="team-member-case-count">{internCaseCounts[member.id] || 0}</span>
                                                <span className="team-member-case-label">Cases</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Assigned Cases */}
                        <section className="assigned-section">
                            <h2 className="assigned-section-title">✅ Assigned Cases <span className="assign-count-badge">{assigned.length}</span></h2>
                            <div className="case-assignment-list">
                                {assigned.map(p => (
                                    <AssignRow key={p.id} patient={p} assignment={assignments[p.id]}
                                        pending={pendingAssign[p.id] || {}}
                                        nurses={nurses} interns={interns}
                                        onFieldChange={(field, val) => setPendingField(p.id, field, val)}
                                        onUpdate={() => handleAssignUpdate(p.id)} />
                                ))}
                                {assigned.length === 0 && <p className="assign-empty">No assigned cases.</p>}
                            </div>
                        </section>

                        {/* Unassigned Cases */}
                        <section className="assigned-section">
                            <h2 className="assigned-section-title">📋 Unassigned Cases <span className="assign-count-badge assign-count-badge--warn">{unassigned.length}</span></h2>
                            <div className="case-assignment-list">
                                {unassigned.map(p => (
                                    <AssignRow key={p.id} patient={p} assignment={assignments[p.id]}
                                        pending={pendingAssign[p.id] || {}}
                                        nurses={nurses} interns={interns}
                                        onFieldChange={(field, val) => setPendingField(p.id, field, val)}
                                        onUpdate={() => handleAssignUpdate(p.id)} />
                                ))}
                                {unassigned.length === 0 && <p className="assign-empty">All cases are assigned! 🎉</p>}
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}

// ─── Risk Section ─────────────────────────────────────────────────────────────
function RiskSection({ title, count, patients, accentKey, expandedId, toggleExpand, detailProps, assignments }) {
    if (patients.length === 0) return null;
    return (
        <section className={`risk-section risk-section--${accentKey}`}>
            <div className="risk-section-header">
                <span className={`risk-section-dot risk-section-dot--${accentKey}`} />
                <h2 className="risk-section-title">{title} <span className="risk-section-count">({count} Cases)</span></h2>
            </div>
            <div className="case-cards-grid">
                {patients.map(p => (
                    <React.Fragment key={p.id}>
                        <PatientCaseCard patient={p} isExpanded={expandedId === p.id}
                            onToggle={() => toggleExpand(p.id)} assignments={assignments} />
                        {expandedId === p.id && (
                            <div className="detail-drawer-wrapper">
                                <PatientDetailDrawer patient={p} {...detailProps} />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </section>
    );
}

// ─── Patient Case Card ────────────────────────────────────────────────────────
function PatientCaseCard({ patient: p, isExpanded, onToggle, assignments }) {
    const a = assignments[p.id];
    const nurse = TEAM_MEMBERS.find(m => m.id === a?.nurse);
    const intern = TEAM_MEMBERS.find(m => m.id === a?.intern);
    const riskLabel = { high: 'High', moderate: 'Moderate', low: 'Stable' }[p.riskClass] ?? 'Stable';

    return (
        <div className={`pcase-card pcase-card--${p.riskClass}${isExpanded ? ' pcase-card--expanded' : ''}`}
            onClick={onToggle} style={{ cursor: 'pointer' }}>
            <div className="pcase-card-top">
                <div className="pcase-name-row">
                    <span className={`pcase-status-dot pcase-status-dot--${p.riskClass}`} />
                    <span className="pcase-name">{p.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`pcase-risk-badge pcase-risk-badge--${p.riskClass}`}>{riskLabel}</span>
                    <span className="pcase-expand-icon">{isExpanded ? '▲' : '▼'}</span>
                </div>
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

            <div className="pcase-footer">
                Last reviewed by {intern?.name || nurse?.name || 'Unassigned'} at {p.lastReviewTime}, Feb 20
            </div>
        </div>
    );
}

// ─── Patient Detail Drawer ────────────────────────────────────────────────────
function PatientDetailDrawer({ patient: p, apptState, medState, medUpdatedAt, handleApptAction, handleAddMed, handleEditMed, handleRemoveMed }) {
    const appt = apptState[p.id];
    const meds = medState[p.id] || [];
    const lastMedUpdate = medUpdatedAt[p.id];

    // Sugar & BP color
    const sugarColor = p.sugarLevel > 160 ? 'red' : p.sugarLevel > 120 ? 'yellow' : 'green';
    const bpSys = parseInt(p.bp.split('/')[0]);
    const bpColor = bpSys > 139 ? 'red' : bpSys > 129 ? 'yellow' : 'green';

    const riskLabel = { high: 'High', moderate: 'Moderate', low: 'Stable' }[p.riskClass] ?? 'Stable';

    return (
        <div className="detail-drawer" onClick={e => e.stopPropagation()}>

            {/* ── A. Patient Overview ── */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">🧾</span>
                    <h3 className="dd-section-title">Patient Overview</h3>
                </div>
                <div className="dd-overview-grid">
                    <OverviewField label="Name" value={p.name} />
                    <OverviewField label="Age" value={`${p.age} yrs`} />
                    <OverviewField label="Gender" value={p.gender} />
                    <OverviewField label="Diagnosis" value={p.condition} />
                    <OverviewField label="Recovery %" value={`${p.recoveryRate}%`} />
                    <OverviewField label="Cycle" value={`Day ${p.daysSinceDischarge} of ${p.totalDays}`} />
                    <div className="dd-overview-field">
                        <div className="dd-field-label">Risk Level</div>
                        <span className={`pcase-risk-badge pcase-risk-badge--${p.riskClass}`}>{riskLabel}</span>
                    </div>
                </div>
            </div>

            {/* ── B. Appointment Request Panel ── */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">📅</span>
                    <h3 className="dd-section-title">Appointment Request</h3>
                </div>
                <AppointmentPanel patientId={p.id} appt={appt} onAction={handleApptAction} />
            </div>

            {/* ── C. Live Health Metrics ── */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">📊</span>
                    <h3 className="dd-section-title">Live Health Metrics</h3>
                    <span className="dd-metrics-time">Updated at {p.metricsTime}</span>
                </div>
                <div className="dd-metrics-grid">
                    <MetricCard label="Sugar Level" value={`${p.sugarLevel} mg/dL`} color={sugarColor}
                        normal="70–120" icon="🩸" />
                    <MetricCard label="Blood Pressure" value={p.bp} color={bpColor}
                        normal="<130/85 mmHg" icon="❤️" />
                </div>
            </div>

            {/* ── D. Case Details ── */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">📁</span>
                    <h3 className="dd-section-title">Case Details</h3>
                </div>
                <CaseDetails patient={p} />
            </div>

            {/* ── E. Highlighted Symptoms ── */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">⚠️</span>
                    <h3 className="dd-section-title">Highlighted Symptoms</h3>
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

            {/* ── F. Medication Management ── */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-icon">💊</span>
                    <h3 className="dd-section-title">Medication Management</h3>
                    {lastMedUpdate && (
                        <span className="dd-metrics-time">Last updated by Doctor at {lastMedUpdate}</span>
                    )}
                </div>
                <MedicationManager
                    patientId={p.id}
                    meds={meds}
                    onAdd={handleAddMed}
                    onEdit={handleEditMed}
                    onRemove={handleRemoveMed}
                />
            </div>
        </div>
    );
}

// ─── Overview Field ───────────────────────────────────────────────────────────
function OverviewField({ label, value }) {
    return (
        <div className="dd-overview-field">
            <div className="dd-field-label">{label}</div>
            <div className="dd-field-value">{value}</div>
        </div>
    );
}

// ─── Appointment Panel ────────────────────────────────────────────────────────
function AppointmentPanel({ patientId, appt, onAction }) {
    const [rescheduleMode, setRescheduleMode] = useState(false);
    const [newDate, setNewDate] = useState(appt.date);
    const [newTime, setNewTime] = useState(appt.time);

    const statusColors = {
        pending: 'appt-status--pending',
        approved: 'appt-status--approved',
        declined: 'appt-status--declined',
        rescheduled: 'appt-status--rescheduled',
    };

    const handleReschedule = () => {
        onAction(patientId, 'rescheduled', { date: newDate, time: newTime });
        setRescheduleMode(false);
    };

    return (
        <div className="appt-panel">
            <div className="appt-info-row">
                <div className="appt-details">
                    <div className="appt-datetime">📅 {appt.date} &nbsp;⏰ {appt.time}</div>
                    <div className="appt-reason">Reason: <strong>{appt.reason}</strong></div>
                </div>
                <span className={`appt-status ${statusColors[appt.status] || ''}`}>
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                </span>
            </div>

            {appt.status === 'pending' && !rescheduleMode && (
                <div className="appt-actions">
                    <button className="appt-btn appt-btn--approve" onClick={() => onAction(patientId, 'approved')}>✅ Approve</button>
                    <button className="appt-btn appt-btn--decline" onClick={() => onAction(patientId, 'declined')}>❌ Decline</button>
                    <button className="appt-btn appt-btn--reschedule" onClick={() => setRescheduleMode(true)}>📅 Reschedule</button>
                </div>
            )}

            {rescheduleMode && (
                <div className="appt-reschedule-form">
                    <label className="appt-form-label">New Date
                        <input type="date" className="appt-input" value={newDate} onChange={e => setNewDate(e.target.value)} />
                    </label>
                    <label className="appt-form-label">New Time
                        <input type="time" className="appt-input" value={newTime.replace(' AM', '').replace(' PM', '')} onChange={e => setNewTime(e.target.value)} />
                    </label>
                    <div className="appt-actions">
                        <button className="appt-btn appt-btn--approve" onClick={handleReschedule}>Confirm Reschedule</button>
                        <button className="appt-btn appt-btn--decline" onClick={() => setRescheduleMode(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {(appt.status === 'approved' || appt.status === 'rescheduled' || appt.status === 'declined') && (
                <button className="appt-btn appt-btn--reschedule" style={{ marginTop: 10 }} onClick={() => { onAction(patientId, 'pending'); setRescheduleMode(false); }}>
                    Reset to Pending
                </button>
            )}
        </div>
    );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, color, normal, icon }) {
    return (
        <div className={`metric-card metric-card--${color}`}>
            <div className="metric-icon">{icon}</div>
            <div className="metric-label">{label}</div>
            <div className={`metric-value metric-value--${color}`}>{value}</div>
            <div className="metric-normal">Normal: {normal}</div>
        </div>
    );
}

// ─── Case Details ─────────────────────────────────────────────────────────────
function CaseDetails({ patient: p }) {
    const [expanded, setExpanded] = useState(false);
    const fields = [
        { label: 'Case Summary', value: p.caseNotes },
        { label: 'Diagnosis Notes', value: p.diagnosisNotes },
        { label: 'Treatment History', value: p.treatmentHistory },
        { label: 'Recovery Notes', value: p.recoveryNotes },
    ];
    return (
        <div className="case-details-box">
            {(expanded ? fields : fields.slice(0, 2)).map((f, i) => (
                <div key={i} className="case-detail-row">
                    <div className="case-detail-label">{f.label}</div>
                    <div className="case-detail-text">{f.value}</div>
                </div>
            ))}
            <button className="case-expand-btn" onClick={() => setExpanded(e => !e)}>
                {expanded ? '▲ Show less' : '▼ Show all notes'}
            </button>
        </div>
    );
}

// ─── Medication Manager ───────────────────────────────────────────────────────
function MedicationManager({ patientId, meds, onAdd, onEdit, onRemove }) {
    const emptyForm = { name: '', dosage: '', frequency: '' };
    const [addForm, setAddForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState(emptyForm);
    const [addOpen, setAddOpen] = useState(false);

    const handleAdd = () => {
        if (!addForm.name.trim()) return;
        onAdd(patientId, addForm);
        setAddForm(emptyForm);
        setAddOpen(false);
    };

    const startEdit = (med) => {
        setEditingId(med.id);
        setEditForm({ name: med.name, dosage: med.dosage, frequency: med.frequency });
    };

    const commitEdit = () => {
        onEdit(patientId, editingId, editForm);
        setEditingId(null);
    };

    return (
        <div className="med-manager">
            <div className="med-list">
                {meds.map(med => (
                    <div key={med.id} className="med-row">
                        {editingId === med.id ? (
                            <div className="med-edit-form">
                                <input className="med-input" placeholder="Name" value={editForm.name}
                                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                                <input className="med-input" placeholder="Dosage" value={editForm.dosage}
                                    onChange={e => setEditForm(f => ({ ...f, dosage: e.target.value }))} />
                                <input className="med-input" placeholder="Frequency" value={editForm.frequency}
                                    onChange={e => setEditForm(f => ({ ...f, frequency: e.target.value }))} />
                                <div className="med-edit-actions">
                                    <button className="med-btn med-btn--save" onClick={commitEdit}>Save</button>
                                    <button className="med-btn med-btn--cancel" onClick={() => setEditingId(null)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="med-info">
                                    <div className="med-name">💊 {med.name}</div>
                                    <div className="med-sub">{med.dosage} · {med.frequency}</div>
                                </div>
                                <div className="med-actions">
                                    <button className="med-btn med-btn--edit" onClick={() => startEdit(med)}>Edit</button>
                                    <button className="med-btn med-btn--remove" onClick={() => onRemove(patientId, med.id)}>Remove</button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {meds.length === 0 && <p className="med-empty">No medications recorded.</p>}
            </div>

            {!addOpen ? (
                <button className="med-btn med-btn--add" onClick={() => setAddOpen(true)}>+ Add Medication</button>
            ) : (
                <div className="med-add-form">
                    <div className="med-form-title">New Medication</div>
                    <div className="med-form-grid">
                        <input className="med-input" placeholder="Drug name" value={addForm.name}
                            onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
                        <input className="med-input" placeholder="Dosage (e.g. 500mg)" value={addForm.dosage}
                            onChange={e => setAddForm(f => ({ ...f, dosage: e.target.value }))} />
                        <input className="med-input med-input--full" placeholder="Frequency (e.g. Twice daily)" value={addForm.frequency}
                            onChange={e => setAddForm(f => ({ ...f, frequency: e.target.value }))} />
                    </div>
                    <div className="med-edit-actions">
                        <button className="med-btn med-btn--save" onClick={handleAdd}>Add</button>
                        <button className="med-btn med-btn--cancel" onClick={() => { setAddOpen(false); setAddForm(emptyForm); }}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Assign Row (Dual Nurse + Intern) ────────────────────────────────────────
function AssignRow({ patient: p, assignment, pending, nurses, interns, onFieldChange, onUpdate }) {
    const nurseVal = 'nurse' in pending ? (pending.nurse ?? '') : (assignment?.nurse ?? '');
    const internVal = 'intern' in pending ? (pending.intern ?? '') : (assignment?.intern ?? '');
    const currentNurse = TEAM_MEMBERS.find(m => m.id === assignment?.nurse);
    const currentIntern = TEAM_MEMBERS.find(m => m.id === assignment?.intern);

    return (
        <div className={`case-assign-card case-assign-card--${p.riskClass}`}>
            <div className="case-assign-patient">
                <span className={`case-dot case-dot--${p.riskClass}`} />
                <div>
                    <div className="case-assign-name">{p.name}</div>
                    <div className="case-assign-meta">{p.condition} · Day {p.daysSinceDischarge}</div>
                    <div className="case-current-assign">
                        <span>Nurse: <strong>{currentNurse?.name || 'Not Assigned'}</strong></span>
                        <span style={{ margin: '0 8px' }}>·</span>
                        <span>Intern: <strong>{currentIntern?.name || 'Not Assigned'}</strong></span>
                    </div>
                </div>
            </div>
            <div className="assign-dual">
                <div className="assign-dual-field">
                    <label className="assign-dual-label">Nurse</label>
                    <select className="case-assign-select" value={nurseVal}
                        onChange={e => onFieldChange('nurse', e.target.value)}>
                        <option value="">Not Assigned</option>
                        {nurses.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                </div>
                <div className="assign-dual-field">
                    <label className="assign-dual-label">Intern</label>
                    <select className="case-assign-select" value={internVal}
                        onChange={e => onFieldChange('intern', e.target.value)}>
                        <option value="">Not Assigned</option>
                        {interns.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                </div>
                <button className="case-assign-btn" onClick={onUpdate}>Update</button>
            </div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
    return (
        <div className={`team-stat-card team-stat-card--${color}`}>
            <span className="team-stat-icon">{icon}</span>
            <div className="team-stat-value">{value}</div>
            <div className="team-stat-label">{label}</div>
        </div>
    );
}
