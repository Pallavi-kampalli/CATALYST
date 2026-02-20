/**
 * Adaptive Recovery Guidance Engine
 * Returns stage-specific, risk-adjusted guidance for the patient.
 */

const GUIDANCE = {
    early: {
        stage: 'Early Recovery',
        days: 'Days 1–7',
        icon: '🌱',
        baseColor: '#4ade80',
        tips: {
            low: [
                '🩹 Keep your wound clean and dry — change dressings as directed.',
                '💊 Take all prescribed medications on time, even if you feel better.',
                '🛏️ Rest is your most powerful medicine right now. Limit activity.',
                '🌡️ Check your temperature twice daily. Report any reading above 100.4°F.',
                '🚰 Stay hydrated — aim for 8–10 glasses of water daily.',
                '📞 Call your care team if you notice increased redness or discharge.',
            ],
            moderate: [
                '⚠️ Your symptoms suggest you need closer monitoring in the coming days.',
                '🩹 Inspect your wound site carefully for warmth, redness, or odor daily.',
                '🌡️ Monitor temperature every 6 hours. Log any fever immediately.',
                '😴 Prioritize sleep — your body repairs during rest. Aim for 8+ hours.',
                '🚫 Avoid lifting, bending, or strenuous activity until further notice.',
                '📲 Contact your nurse if pain worsens or you develop chills or sweating.',
            ],
            high: [
                '🚨 Your risk score is elevated. Please contact your care team today.',
                '📋 Prepare a list of your current symptoms and their onset times.',
                '🌡️ If fever exceeds 101°F, seek medical attention immediately.',
                '🛑 Stop all physical activity. Rest completely until reviewed.',
                '🏥 Do not delay — early intervention prevents serious complications.',
                '💬 Use the app to message your nurse or call the discharge hotline.',
            ],
        },
    },
    mid: {
        stage: 'Mid Recovery',
        days: 'Days 8–21',
        icon: '🔄',
        baseColor: '#60a5fa',
        tips: {
            low: [
                '🚶 Begin gentle walking — 5–10 minutes twice daily is ideal.',
                '🥗 Focus on protein-rich foods to support tissue healing.',
                '💤 Maintain 7–8 hours of sleep to support immune function.',
                '🏋️ Light stretching is fine, but avoid impact exercise.',
                `🎯 You're making great progress! Stay consistent with your routine.`,
                '📊 Keep logging your symptoms daily to track your improvement.',
            ],
            moderate: [
                '⚠️ Some symptoms are elevated — slow down and reassess activity levels.',
                '🛌 Reduce activity back to early-recovery levels for the next 2–3 days.',
                '🥣 Increase anti-inflammatory foods: turmeric, ginger, leafy greens.',
                '💊 Do not skip pain medication — uncontrolled pain delays healing.',
                '🩺 Book a follow-up call with your care team within 48 hours.',
                `📝 Note any new symptoms that weren't present before.`,
            ],
            high: [
                '🚨 Risk is high — please contact your care team now.',
                '🛑 Return to full rest immediately. Pause all rehabilitation activity.',
                '🌡️ Fever, increased pain, or swelling at this stage warrants urgent review.',
                '📲 Use the "Contact Clinician" feature or call your discharge line.',
                '🚫 Do not drive or operate machinery if taking strong pain medications.',
                '🏥 Have someone available to take you to the clinic if needed.',
            ],
        },
    },
    late: {
        stage: 'Late Recovery',
        days: 'Day 22+',
        icon: '✨',
        baseColor: '#a78bfa',
        tips: {
            low: [
                '🏃 Gradually increase activity — walking, swimming, and gentle strength work.',
                `🎉 You're in the final stretch! Maintain medication schedule until completion.`,
                '🧘 Incorporate stress management — stress impairs final healing.',
                '🍎 Continue eating well — nutrition matters even in late recovery.',
                '📅 Schedule your final follow-up appointment if not already done.',
                '💪 Your body is strong. Keep up the consistency.',
            ],
            moderate: [
                '⚠️ Persistent symptoms this late in recovery need investigation.',
                '📅 Schedule an in-person appointment with your surgeon or GP.',
                '🧘 Reduce stress — psychological factors affect physical healing.',
                '💤 Sleep quality issues at this stage can indicate lingering inflammation.',
                '🔍 Reflect on any recent activity changes that may have triggered symptoms.',
                '📲 Contact your care team if symptoms persist more than 3 days.',
            ],
            high: [
                '🚨 Elevated risk this late in recovery is unusual — act promptly.',
                '🩺 This requires in-person clinical evaluation — do not wait.',
                '🌡️ Fever or worsening pain this late could indicate secondary infection.',
                '📲 Contact your care team urgently or go to an urgent care center.',
                '📋 Bring your symptom log printout to your appointment.',
                '🏥 If symptoms are severe, go directly to the emergency room.',
            ],
        },
    },
};

/**
 * Returns guidance object for the given stage and risk level.
 * @param {number} daysSinceDischarge
 * @param {string} riskClass — 'low' | 'moderate' | 'high'
 * @returns {{ stage, days, icon, baseColor, tips: string[] }}
 */
export function getGuidance(daysSinceDischarge, riskClass = 'low') {
    const stageKey =
        daysSinceDischarge <= 7 ? 'early' : daysSinceDischarge <= 21 ? 'mid' : 'late';
    const level = GUIDANCE[stageKey];
    return {
        stage: level.stage,
        days: level.days,
        icon: level.icon,
        baseColor: level.baseColor,
        tips: level.tips[riskClass] || level.tips.low,
    };
}

export function getRecoveryStageLabel(daysSinceDischarge) {
    if (daysSinceDischarge <= 7) return 'Early Recovery';
    if (daysSinceDischarge <= 21) return 'Mid Recovery';
    return 'Late Recovery';
}
