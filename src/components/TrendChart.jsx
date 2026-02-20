import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const SYMPTOM_COLORS = {
    pain: { border: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
    swelling: { border: '#f97316', bg: 'rgba(249,115,22,0.08)' },
    temperature: { border: '#eab308', bg: 'rgba(234,179,8,0.08)' },
    fatigue: { border: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
    sleep: { border: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
    mood: { border: '#34d399', bg: 'rgba(52,211,153,0.08)' },
};

const LABELS_MAP = {
    pain: 'Pain',
    swelling: 'Swelling',
    temperature: 'Temperature (°F)',
    fatigue: 'Fatigue',
    sleep: 'Sleep (hrs)',
    mood: 'Mood',
};

const OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
        legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { size: 11, family: 'Inter' }, boxWidth: 12, padding: 16 },
        },
        tooltip: {
            backgroundColor: 'rgba(15,23,42,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            padding: 12,
        },
    },
    scales: {
        x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b', font: { size: 10 } },
        },
        y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b', font: { size: 10 } },
        },
    },
};

/**
 * @param {Array} entries — symptom entries (newest first from DB)
 * @param {string[]} symptoms — which symptoms to display
 */
export default function TrendChart({ entries = [], symptoms = ['pain', 'swelling', 'fatigue'] }) {
    const { labels, datasets } = useMemo(() => {
        // Take last 14 entries, reverse so oldest is on the left
        const sorted = [...entries].slice(0, 14).reverse();

        const labels = sorted.map((e) => {
            const d = new Date(e.timestamp);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        });

        const datasets = symptoms
            .filter((s) => SYMPTOM_COLORS[s])
            .map((s) => ({
                label: LABELS_MAP[s] || s,
                data: sorted.map((e) => e[s] ?? null),
                borderColor: SYMPTOM_COLORS[s].border,
                backgroundColor: SYMPTOM_COLORS[s].bg,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: SYMPTOM_COLORS[s].border,
                borderWidth: 2,
                spanGaps: true,
            }));

        return { labels, datasets };
    }, [entries, symptoms]);

    if (entries.length === 0) {
        return (
            <div className="chart-empty">
                <span>📊</span>
                <p>Log your symptoms to see trends here</p>
            </div>
        );
    }

    return (
        <div className="chart-container">
            <Line options={OPTIONS} data={{ labels, datasets }} />
        </div>
    );
}
