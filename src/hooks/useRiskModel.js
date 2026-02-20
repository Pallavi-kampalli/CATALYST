/**
 * useRiskModel — runs the ML pipeline on the latest symptom entries
 * and returns the current risk assessment.
 */
import { useState, useEffect } from 'react';
import { engineerFeatures } from '../ml/features';
import { predictSync } from '../ml/model';

/**
 * @param {Array} entries — symptom entries (newest first)
 * @param {number} daysSinceDischarge
 * @returns {{ score, label, riskClass, topFactors, featureVector }}
 */
export function useRiskModel(entries, daysSinceDischarge = 1) {
    const [risk, setRisk] = useState({
        score: 0,
        label: 'Low',
        riskClass: 'low',
        topFactors: ['No data yet — log your first symptoms'],
        featureVector: new Array(14).fill(0),
    });

    useEffect(() => {
        if (!entries || entries.length === 0) return;
        const features = engineerFeatures(entries, daysSinceDischarge);
        const result = predictSync(features);
        setRisk({ ...result, featureVector: features });
    }, [entries, daysSinceDischarge]);

    return risk;
}
