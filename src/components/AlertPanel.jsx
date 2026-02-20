import React, { useState } from 'react';
import RiskBadge from './RiskBadge';

export default function AlertPanel({ patients = [], canResolve = true }) {
    const [dismissed, setDismissed] = useState(new Set());

    const alerts = patients
        .filter((p) => (p.riskClass === 'high' || p.riskClass === 'moderate') && !dismissed.has(p.id))
        .sort((a, b) => {
            const order = { high: 0, moderate: 1 };
            return (order[a.riskClass] ?? 2) - (order[b.riskClass] ?? 2);
        });

    const dismiss = (id) => setDismissed((prev) => new Set([...prev, id]));

    if (alerts.length === 0) {
        return (
            <div className="alert-panel alert-panel--empty">
                <span className="alert-empty-icon">✅</span>
                <p>All clear — no active alerts</p>
                <span className="alert-empty-sub">High and moderate risk patients will appear here</span>
            </div>
        );
    }

    return (
        <div className="alert-panel">
            <div className="alert-panel-header">
                <h3 className="alert-panel-title">Active Alerts</h3>
                <span className="alert-count">{alerts.length}</span>
            </div>
            <div className="alert-list">
                {alerts.map((p) => (
                    <div key={p.id} className={`alert-item alert-item--${p.riskClass}`}>
                        <div className="alert-top">
                            <div className="alert-patient">
                                <strong>{p.name}</strong>
                                <span className="alert-day">Day {p.daysSinceDischarge}</span>
                            </div>
                            <RiskBadge riskClass={p.riskClass} score={p.riskScore} size="sm" />
                        </div>

                        <div className="alert-factors">
                            <span className="alert-factors-label">Key drivers:</span>
                            {(p.topFactors || ['Elevated symptoms']).map((f, i) => (
                                <span key={i} className="alert-factor-chip">{f}</span>
                            ))}
                        </div>

                        <div className="alert-trend">
                            <span className="alert-trend-label">📈 Trend:</span>
                            <span className="alert-trend-text">{p.trendNote || 'Worsening pattern detected over the last 3 days'}</span>
                        </div>

                        <div className="alert-actions">
                            {canResolve ? (
                                <button className="btn-review" onClick={() => dismiss(p.id)}>
                                    ✓ Mark Reviewed
                                </button>
                            ) : (
                                <span className="nurse-view-badge">👁️ View Only</span>
                            )}
                            <button className="btn-contact">
                                📲 Contact Patient
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
