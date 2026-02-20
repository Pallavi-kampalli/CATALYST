import React from 'react';
import { getGuidance } from '../ml/guidance';

export default function GuidanceCard({ daysSinceDischarge = 1, riskClass = 'low' }) {
    const guidance = getGuidance(daysSinceDischarge, riskClass);

    const riskBorderColor = {
        low: '#22c55e',
        moderate: '#f59e0b',
        high: '#ef4444',
    }[riskClass] || '#22c55e';

    return (
        <div className="guidance-card" style={{ '--stage-color': guidance.baseColor, '--risk-border': riskBorderColor }}>
            <div className="guidance-header">
                <div className="guidance-stage-badge">
                    <span className="guidance-icon">{guidance.icon}</span>
                    <div>
                        <div className="guidance-stage">{guidance.stage}</div>
                        <div className="guidance-days">{guidance.days}</div>
                    </div>
                </div>
                <div className="guidance-risk-indicator" style={{ background: riskBorderColor }}>
                    {riskClass.toUpperCase()} RISK
                </div>
            </div>

            <p className="guidance-subtitle">
                Personalized guidance based on your current recovery stage and symptom trends:
            </p>

            <ul className="guidance-tips">
                {guidance.tips.map((tip, i) => (
                    <li key={i} className="guidance-tip">
                        <span className="tip-text">{tip}</span>
                    </li>
                ))}
            </ul>

            <div className="guidance-footer">
                <span>📅 Day {daysSinceDischarge} of Recovery</span>
                <span>Updated in real-time</span>
            </div>
        </div>
    );
}
