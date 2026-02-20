/**
 * PatientContext — global state shared across the entire patient app.
 * Provides symptom entries, risk assessment, discharge date, and active screen.
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useSymptoms } from '../hooks/useSymptoms';
import { useRiskModel } from '../hooks/useRiskModel';

const PatientContext = createContext(null);

export function PatientProvider({ children }) {
    // Discharge date stored in localStorage (simple scalar)
    const [dischargeDate] = useState(() => {
        const stored = localStorage.getItem('rc_discharge_date');
        if (stored) return new Date(stored);
        const d = new Date();
        d.setDate(d.getDate() - 3); // default: 3 days ago for demo
        localStorage.setItem('rc_discharge_date', d.toISOString());
        return d;
    });

    const [patientName] = useState(() => localStorage.getItem('rc_patient_name') || 'Alex Johnson');
    const [activeTab, setActiveTab] = useState('home');

    const daysSinceDischarge = useMemo(() => {
        const diff = Date.now() - dischargeDate.getTime();
        return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
    }, [dischargeDate]);

    const { entries, loading, addEntry, refresh } = useSymptoms();
    const risk = useRiskModel(entries, daysSinceDischarge);

    const logSymptoms = useCallback(
        async (data) => {
            return addEntry(data);
        },
        [addEntry]
    );

    const value = useMemo(
        () => ({
            patientName,
            dischargeDate,
            daysSinceDischarge,
            entries,
            loading,
            risk,
            activeTab,
            setActiveTab,
            logSymptoms,
            refresh,
        }),
        [patientName, dischargeDate, daysSinceDischarge, entries, loading, risk, activeTab, logSymptoms, refresh]
    );

    return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatient() {
    const ctx = useContext(PatientContext);
    if (!ctx) throw new Error('usePatient must be used inside PatientProvider');
    return ctx;
}
