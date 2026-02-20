/**
 * Feature Engineering — transforms raw symptom entries into a feature vector
 * for the TensorFlow.js logistic regression model.
 */

/**
 * @param {Array} entries — array of symptom log objects, newest first
 * @param {number} daysSinceDischarge
 * @returns {number[]} — normalized feature vector of length 14
 */
export function engineerFeatures(entries, daysSinceDischarge = 1) {
  if (!entries || entries.length === 0) {
    return new Array(14).fill(0);
  }

  const recent = entries.slice(0, 7); // Use up to 7 most recent entries
  const n = recent.length;

  const get = (field) => recent.map((e) => e[field] ?? 0);

  const mean = (arr) => arr.reduce((s, v) => s + v, 0) / (arr.length || 1);
  const std = (arr) => {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length || 1));
  };
  const delta = (arr) => (arr.length >= 2 ? arr[0] - arr[1] : 0); // newest - previous

  const pain = get('pain');
  const swelling = get('swelling');
  const temp = get('temperature');
  const fatigue = get('fatigue');
  const sleep = get('sleep');
  const mood = get('mood');

  const tempC = temp.map((t) => (t - 32) * (5 / 9)); // convert to Celsius for fever detection
  const feverFlag = tempC.some((t) => t >= 38.0) ? 1 : 0;
  const sleepDeficit = Math.max(0, 7 - mean(sleep)) / 7; // normalized 0-1
  const compositeScore = (mean(pain) + mean(swelling) + mean(fatigue)) / 30; // normalized

  // Trend direction: positive = worsening
  const painTrend = delta(pain) / 10;
  const tempTrend = delta(temp) / 5;
  const fatigueTrend = delta(fatigue) / 10;
  const moodTrend = -delta(mood) / 4; // lower mood = worse

  // Stage: 1=early (1-7d), 2=mid (8-21d), 3=late (22+d), normalized
  const stage = daysSinceDischarge <= 7 ? 1 : daysSinceDischarge <= 21 ? 2 : 3;

  const features = [
    mean(pain) / 10,           // 0: mean pain (normalized)
    std(pain) / 5,             // 1: pain variability
    mean(swelling) / 10,       // 2: mean swelling
    mean(temp) / 105,          // 3: mean temperature (normalized to max)
    std(temp) / 3,             // 4: temp variability
    mean(fatigue) / 10,        // 5: mean fatigue
    sleepDeficit,              // 6: sleep deficit
    mean(mood) / 5,            // 7: mood (higher = better, inverted by model weight)
    feverFlag,                 // 8: fever flag
    compositeScore,            // 9: composite symptom score
    painTrend,                 // 10: pain trend
    tempTrend,                 // 11: temp trend
    fatigueTrend,              // 12: fatigue trend
    (stage - 1) / 2,          // 13: recovery stage (normalized 0-1)
  ];

  // Clamp all features to [-1, 1] to prevent outlier blow-up
  return features.map((f) => Math.max(-1, Math.min(1, f)));
}

/**
 * Returns human-readable names for each feature index, used in risk explanation
 */
export const FEATURE_NAMES = [
  'Pain level',
  'Pain variability',
  'Swelling',
  'Temperature',
  'Temperature variability',
  'Fatigue',
  'Sleep deficit',
  'Mood',
  'Fever detected',
  'Overall symptom burden',
  'Worsening pain trend',
  'Rising temperature trend',
  'Increasing fatigue trend',
  'Recovery stage',
];
