import React from 'react';

const CONFIG = {
    low: {
        label: 'Low Risk',
        color: '#22c55e',
        bg: 'rgba(34, 197, 94, 0.15)',
        border: 'rgba(34, 197, 94, 0.4)',
        icon: '🟢',
        pulse: false,
    },
    moderate: {
        label: 'Moderate Risk',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.4)',
        icon: '🟡',
        pulse: true,
    },
    high: {
        label: 'High Risk',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
        icon: '🔴',
        pulse: true,
    },
};

export default function RiskBadge({ riskClass = 'low', score, size = 'md' }) {
    const cfg = CONFIG[riskClass] || CONFIG.low;
    const sizes = {
        sm: { padding: '4px 10px', fontSize: '11px', scoreSize: '13px' },
        md: { padding: '6px 14px', fontSize: '13px', scoreSize: '15px' },
        lg: { padding: '10px 20px', fontSize: '15px', scoreSize: '22px' },
    };
    const sz = sizes[size] || sizes.md;

    return (
        <span
            className={cfg.pulse ? 'risk-badge risk-badge--pulse' : 'risk-badge'}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: sz.padding,
                borderRadius: '999px',
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
                fontWeight: 700,
                fontSize: sz.fontSize,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
            }}
        >
            {cfg.icon}
            {cfg.label}
            {score !== undefined && (
                <span
                    style={{
                        fontSize: sz.scoreSize,
                        fontWeight: 800,
                        marginLeft: '4px',
                        color: cfg.color,
                    }}
                >
                    {score}%
                </span>
            )}
        </span>
    );
}
