import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function PatientOnboarding() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [personalDetails, setPersonalDetails] = useState({
        age: '',
        gender: 'Male',
        emergencyContact: '',
    });

    const [healthDetails, setHealthDetails] = useState({
        allergies: '',
        medicalHistory: '',
        currentMedications: '',
    });

    const [initialLog, setInitialLog] = useState({
        bp: '',
        sugar: '',
        notes: '',
    });

    const handleStep1 = (e) => {
        e.preventDefault();
        setStep(2);
    };

    const handleStep2 = (e) => {
        e.preventDefault();
        setStep(3);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const patientData = {
                patientId: user.uid,
                name: user.name || 'Patient',
                email: user.email,
                personalDetails: {
                    ...personalDetails,
                    age: parseInt(personalDetails.age)
                },
                healthDetails: {
                    ...healthDetails,
                    allergies: healthDetails.allergies.split(',').map(s => s.trim()).filter(s => s),
                },
                dailyLogs: [{
                    bp: initialLog.bp,
                    sugar: parseInt(initialLog.sugar),
                    notes: initialLog.notes,
                    timestamp: new Date().toISOString(),
                    date: new Date().toISOString().split('T')[0],
                }],
                assignedDoctorId: null, // To be assigned
                assignedNurseId: null,
                createdAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'patients', user.uid), patientData);
            navigate('/patient-dashboard');
        } catch (error) {
            console.error('Error in onboarding:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-blob login-blob--1" />
            <div className="login-blob login-blob--2" />

            <div className="login-card" style={{ maxWidth: '600px', width: '90%' }}>
                <div className="login-logo">
                    <span className="login-logo-icon">🏥</span>
                    <div>
                        <div className="login-logo-text">Patient<span className="logo-accent">Onboarding</span></div>
                        <div className="login-logo-sub">Complete your health profile</div>
                    </div>
                </div>

                <div className="onboarding-steps" style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    {[1, 2, 3].map(s => (
                        <div key={s} style={{
                            height: '4px',
                            flex: 1,
                            borderRadius: '2px',
                            background: s <= step ? 'var(--accent-blue)' : 'var(--bg-surface)',
                            transition: 'all 0.3s ease'
                        }} />
                    ))}
                </div>

                {step === 1 && (
                    <form className="login-form" onSubmit={handleStep1}>
                        <h2 className="login-title" style={{ fontSize: '20px', marginBottom: '8px' }}>Personal Details</h2>
                        <p className="login-subtitle">Basic information for your care team</p>

                        <div className="login-field">
                            <label className="login-label">Age</label>
                            <input className="login-input" type="number" required placeholder="Enter your age"
                                value={personalDetails.age} onChange={e => setPersonalDetails({ ...personalDetails, age: e.target.value })} />
                        </div>
                        <div className="login-field">
                            <label className="login-label">Gender</label>
                            <div className="login-roles">
                                {['Male', 'Female', 'Other'].map(g => (
                                    <button key={g} type="button"
                                        className={`role-chip ${personalDetails.gender === g ? 'role-chip--active' : ''}`}
                                        onClick={() => setPersonalDetails({ ...personalDetails, gender: g })}>
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="login-field">
                            <label className="login-label">Emergency Contact</label>
                            <input className="login-input" type="text" required placeholder="Name and Phone Number"
                                value={personalDetails.emergencyContact} onChange={e => setPersonalDetails({ ...personalDetails, emergencyContact: e.target.value })} />
                        </div>
                        <button className="login-btn" type="submit">Continue →</button>
                    </form>
                )}

                {step === 2 && (
                    <form className="login-form" onSubmit={handleStep2}>
                        <h2 className="login-title" style={{ fontSize: '20px', marginBottom: '8px' }}>Medical Background</h2>
                        <p className="login-subtitle">Briefly describe your medical history</p>

                        <div className="login-field">
                            <label className="login-label">Allergies</label>
                            <input className="login-input" type="text" placeholder="e.g. Penicillin, Peanuts (comma separated)"
                                value={healthDetails.allergies} onChange={e => setHealthDetails({ ...healthDetails, allergies: e.target.value })} />
                        </div>
                        <div className="login-field">
                            <label className="login-label">Medical History</label>
                            <textarea className="login-input" style={{ height: '80px', paddingTop: '12px' }} placeholder="Any past surgeries or chronic conditions"
                                value={healthDetails.medicalHistory} onChange={e => setHealthDetails({ ...healthDetails, medicalHistory: e.target.value })} />
                        </div>
                        <div className="login-field">
                            <label className="login-label">Current Medications</label>
                            <textarea className="login-input" style={{ height: '80px', paddingTop: '12px' }} placeholder="Medications you are currently taking"
                                value={healthDetails.currentMedications} onChange={e => setHealthDetails({ ...healthDetails, currentMedications: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="login-btn" type="button" onClick={() => setStep(1)} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>Back</button>
                            <button className="login-btn" type="submit">Continue →</button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <h2 className="login-title" style={{ fontSize: '20px', marginBottom: '8px' }}>Initial Vitals</h2>
                        <p className="login-subtitle">Enter your current readings</p>

                        <div className="login-field">
                            <label className="login-label">Blood Pressure</label>
                            <input className="login-input" type="text" required placeholder="e.g. 120/80"
                                value={initialLog.bp} onChange={e => setInitialLog({ ...initialLog, bp: e.target.value })} />
                        </div>
                        <div className="login-field">
                            <label className="login-label">Sugar Level (mg/dL)</label>
                            <input className="login-input" type="number" required placeholder="e.g. 100"
                                value={initialLog.sugar} onChange={e => setInitialLog({ ...initialLog, sugar: e.target.value })} />
                        </div>
                        <div className="login-field">
                            <label className="login-label">Additional Notes</label>
                            <textarea className="login-input" style={{ height: '80px', paddingTop: '12px' }} placeholder="How are you feeling today?"
                                value={initialLog.notes} onChange={e => setInitialLog({ ...initialLog, notes: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="login-btn" type="button" onClick={() => setStep(2)} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>Back</button>
                            <button className="login-btn" type="submit" disabled={loading}>
                                {loading ? 'Saving Profile...' : 'Complete Registration ✅'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
