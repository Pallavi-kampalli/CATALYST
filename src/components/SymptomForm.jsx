import React, { useState } from 'react';
import { usePatient } from '../context/PatientContext';

const DEFAULTS = {
    pain: 3,
    swelling: 2,
    temperature: 98.6,
    fatigue: 3,
    sleep: 7,
    mood: 3,
};

const MOOD_LABELS = ['😭', '😟', '😐', '🙂', '😄'];

export default function SymptomForm({ onSuccess }) {
    const { logSymptoms } = usePatient();
    const [values, setValues] = useState(DEFAULTS);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const set = (field, val) => setValues((v) => ({ ...v, [field]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        const ok = await logSymptoms(values);
        setSubmitting(false);
        if (ok) {
            setValues(DEFAULTS);
            onSuccess?.();
        } else {
            setError('Failed to save. Please try again.');
        }
    };

    return (
        <form className="symptom-form" onSubmit={handleSubmit}>
            <div className="form-grid">
                {/* Pain */}
                <SliderField
                    label="Pain"
                    icon="🤕"
                    value={values.pain}
                    min={0} max={10} step={1}
                    onChange={(v) => set('pain', v)}
                    valueLabel={`${values.pain}/10`}
                    trackColor="var(--color-pain)"
                />

                {/* Swelling */}
                <SliderField
                    label="Swelling"
                    icon="🤜"
                    value={values.swelling}
                    min={0} max={10} step={1}
                    onChange={(v) => set('swelling', v)}
                    valueLabel={`${values.swelling}/10`}
                    trackColor="var(--color-swelling)"
                />

                {/* Temperature */}
                <SliderField
                    label="Temperature"
                    icon="🌡️"
                    value={values.temperature}
                    min={95} max={105} step={0.1}
                    onChange={(v) => set('temperature', parseFloat(v))}
                    valueLabel={`${values.temperature.toFixed(1)}°F`}
                    trackColor={values.temperature > 100.4 ? '#ef4444' : 'var(--color-temp)'}
                    warning={values.temperature > 100.4 ? 'Fever detected!' : null}
                />

                {/* Fatigue */}
                <SliderField
                    label="Fatigue"
                    icon="😴"
                    value={values.fatigue}
                    min={0} max={10} step={1}
                    onChange={(v) => set('fatigue', v)}
                    valueLabel={`${values.fatigue}/10`}
                    trackColor="var(--color-fatigue)"
                />

                {/* Sleep */}
                <SliderField
                    label="Sleep Last Night"
                    icon="🛌"
                    value={values.sleep}
                    min={0} max={12} step={0.5}
                    onChange={(v) => set('sleep', parseFloat(v))}
                    valueLabel={`${values.sleep} hrs`}
                    trackColor={values.sleep < 5 ? '#ef4444' : 'var(--color-sleep)'}
                    warning={values.sleep < 5 ? 'Low sleep!' : null}
                />

                {/* Mood */}
                <div className="field-group">
                    <label className="field-label">
                        <span className="field-icon">😊</span> Mood
                    </label>
                    <div className="mood-picker">
                        {MOOD_LABELS.map((emoji, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`mood-btn ${values.mood === i + 1 ? 'mood-btn--active' : ''}`}
                                onClick={() => set('mood', i + 1)}
                            >
                                <span className="mood-emoji">{emoji}</span>
                                <span className="mood-num">{i + 1}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button className="btn-submit" type="submit" disabled={submitting}>
                {submitting ? '⏳ Saving...' : '📝 Log Today\'s Symptoms'}
            </button>
        </form>
    );
}

function SliderField({ label, icon, value, min, max, step, onChange, valueLabel, trackColor, warning }) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <div className="field-group">
            <div className="field-header">
                <label className="field-label">
                    <span className="field-icon">{icon}</span> {label}
                </label>
                <span className="field-value" style={{ color: trackColor }}>{valueLabel}</span>
            </div>
            {warning && <span className="field-warning">{warning}</span>}
            <div className="slider-track-wrap">
                <input
                    type="range"
                    min={min} max={max} step={step}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="slider"
                    style={{ '--track-color': trackColor, '--pct': `${pct}%` }}
                />
            </div>
        </div>
    );
}
