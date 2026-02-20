/**
 * Risk Prediction Model — TensorFlow.js logistic regression
 * Predicts probability of post-discharge complication (0–1).
 *
 * Weights are medically calibrated heuristics based on clinical literature:
 * - High pain, fever, swelling, fatigue → strong positive predictors
 * - Good mood, good sleep → negative predictors
 * - Worsening trends → significant positive contributors
 */
import * as tf from '@tensorflow/tfjs';
import { FEATURE_NAMES } from './features';

const NUM_FEATURES = 14;

// Pre-calibrated logistic regression weights (kernel) and bias
// Order matches FEATURE_NAMES / engineerFeatures() output
const WEIGHTS = [
    3.2,   // 0: pain level
    1.5,   // 1: pain variability
    2.1,   // 2: swelling
    2.8,   // 3: temperature
    1.2,   // 4: temp variability
    2.0,   // 5: fatigue
    1.8,   // 6: sleep deficit
    -2.5,  // 7: mood (good mood reduces risk)
    3.5,   // 8: fever flag
    2.6,   // 9: composite symptom score
    2.4,   // 10: worsening pain trend
    2.7,   // 11: rising temperature trend
    1.9,   // 12: increasing fatigue trend
    -0.8,  // 13: recovery stage (later = slightly lower risk from model perspective)
];
const BIAS = -3.0; // baseline offset keeps low-symptom cases at low risk

let _model = null;

function buildModel() {
    const model = tf.sequential();
    model.add(
        tf.layers.dense({
            units: 1,
            activation: 'sigmoid',
            inputShape: [NUM_FEATURES],
            useBias: true,
        })
    );

    // Set weights directly from our calibrated values
    const kernelTensor = tf.tensor2d(WEIGHTS, [NUM_FEATURES, 1]);
    const biasTensor = tf.tensor1d([BIAS]);
    model.layers[0].setWeights([kernelTensor, biasTensor]);

    return model;
}

function getModel() {
    if (!_model) {
        _model = buildModel();
    }
    return _model;
}

/**
 * Runs inference on a feature vector.
 * @param {number[]} featureVector — length-14 array from engineerFeatures()
 * @returns {{ score: number, label: string, riskClass: string, topFactors: string[] }}
 */
export async function predict(featureVector) {
    const model = getModel();
    const input = tf.tensor2d([featureVector], [1, NUM_FEATURES]);

    const outputTensor = model.predict(input);
    const [score] = await outputTensor.data();

    input.dispose();
    outputTensor.dispose();

    const label = score < 0.25 ? 'Low' : score < 0.6 ? 'Moderate' : 'High';
    const riskClass = score < 0.25 ? 'low' : score < 0.6 ? 'moderate' : 'high';

    // Find top 2 contributing factors (highest weight × feature value products)
    const contributions = featureVector.map((val, i) => ({
        name: FEATURE_NAMES[i],
        contribution: Math.abs(val * WEIGHTS[i]),
        isRisk: val * WEIGHTS[i] > 0,
    }));
    contributions.sort((a, b) => b.contribution - a.contribution);
    const topFactors = contributions
        .filter((c) => c.isRisk && c.contribution > 0.1)
        .slice(0, 3)
        .map((c) => c.name);

    return {
        score: Math.round(score * 100),
        label,
        riskClass,
        topFactors: topFactors.length > 0 ? topFactors : ['Stable symptom pattern'],
    };
}

/**
 * Synchronous version using raw logistic regression math (for immediate use before TF loads)
 */
export function predictSync(featureVector) {
    const logit = WEIGHTS.reduce((sum, w, i) => sum + w * (featureVector[i] ?? 0), BIAS);
    const score = 1 / (1 + Math.exp(-logit));

    const label = score < 0.25 ? 'Low' : score < 0.6 ? 'Moderate' : 'High';
    const riskClass = score < 0.25 ? 'low' : score < 0.6 ? 'moderate' : 'high';

    const contributions = featureVector.map((val, i) => ({
        name: FEATURE_NAMES[i],
        contribution: Math.abs(val * WEIGHTS[i]),
        isRisk: val * WEIGHTS[i] > 0,
    }));
    contributions.sort((a, b) => b.contribution - a.contribution);
    const topFactors = contributions
        .filter((c) => c.isRisk && c.contribution > 0.1)
        .slice(0, 3)
        .map((c) => c.name);

    return {
        score: Math.round(score * 100),
        label,
        riskClass,
        topFactors: topFactors.length > 0 ? topFactors : ['Stable symptom pattern'],
    };
}
