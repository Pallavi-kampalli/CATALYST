import React from 'react';
import RiskBadge from './RiskBadge';

const AVATARS = ['👨‍⚕️', '👩', '👨', '👵', '👴', '👩‍🦱', '👨‍🦳', '👩‍🦳', '👦', '👧'];

export default function PatientList({ patients = [], selectedId, onSelect }) {
    const sorted = [...patients].sort((a, b) => {
        const order = { high: 0, moderate: 1, low: 2 };
        return (order[a.riskClass] ?? 3) - (order[b.riskClass] ?? 3);
    });

    return (
        <div className="patient-list">
            {sorted.map((p, idx) => (
                <div
                    key={p.id}
                    className={`patient-card ${selectedId === p.id ? 'patient-card--selected' : ''} patient-card--${p.riskClass}`}
                    onClick={() => onSelect(p)}
                >
                    <div className="patient-avatar">
                        <span>{AVATARS[idx % AVATARS.length]}</span>
                        {p.riskClass === 'high' && <span className="patient-alert-dot" />}
                    </div>
                    <div className="patient-info">
                        <div className="patient-name">{p.name}</div>
                        <div className="patient-meta">
                            Day {p.daysSinceDischarge} • {p.condition}
                        </div>
                        <div className="patient-last-log">
                            Last log: {p.lastLog || 'No data'}
                        </div>
                    </div>
                    <div className="patient-risk">
                        <RiskBadge riskClass={p.riskClass} score={p.riskScore} size="sm" />
                    </div>
                </div>
            ))}
        </div>
    );
}
