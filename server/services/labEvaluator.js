/**
 * Lab Report Biomarker Evaluation Service
 *
 * Comprehensive reference ranges sourced from standard clinical laboratory
 * guidelines. Gender-aware ranges are used where medically relevant
 * (e.g. Hemoglobin, Testosterone).
 *
 * Each range entry has: { min, max, unit, category }
 * Gender-specific entries have: { male: {min, max}, female: {min, max}, unit, category }
 */

const REFERENCE_RANGES = {
  // ── Blood ───────────────────────────────────────────────────────────────
  Hemoglobin: {
    male: { min: 13.5, max: 17.5 },
    female: { min: 12.0, max: 15.5 },
    unit: 'g/dL',
    category: 'blood',
  },
  RBC: {
    male: { min: 4.5, max: 5.5 },
    female: { min: 4.0, max: 5.0 },
    unit: 'million/µL',
    category: 'blood',
  },
  WBC: {
    min: 4000,
    max: 11000,
    unit: 'cells/µL',
    category: 'blood',
  },
  Platelets: {
    min: 150000,
    max: 400000,
    unit: 'cells/µL',
    category: 'blood',
  },
  ESR: {
    male: { min: 0, max: 15 },
    female: { min: 0, max: 20 },
    unit: 'mm/hr',
    category: 'blood',
  },

  // ── Hormones ────────────────────────────────────────────────────────────
  Testosterone: {
    male: { min: 270, max: 1070 },
    female: { min: 15, max: 70 },
    unit: 'ng/dL',
    category: 'hormone',
  },
  TSH: {
    min: 0.4,
    max: 4.0,
    unit: 'mIU/L',
    category: 'hormone',
  },
  T3: {
    min: 80,
    max: 200,
    unit: 'ng/dL',
    category: 'hormone',
  },
  T4: {
    min: 5.0,
    max: 12.0,
    unit: 'µg/dL',
    category: 'hormone',
  },
  Cortisol: {
    min: 6.0,
    max: 18.0,
    unit: 'µg/dL',
    category: 'hormone',
  },
  Insulin: {
    min: 2.6,
    max: 24.9,
    unit: 'µIU/mL',
    category: 'hormone',
  },

  // ── Vitamins & Minerals ─────────────────────────────────────────────────
  'Vitamin D': {
    min: 30,
    max: 100,
    unit: 'ng/mL',
    category: 'vitamin',
  },
  'Vitamin B12': {
    min: 200,
    max: 900,
    unit: 'pg/mL',
    category: 'vitamin',
  },
  Iron: {
    male: { min: 65, max: 175 },
    female: { min: 50, max: 170 },
    unit: 'µg/dL',
    category: 'vitamin',
  },
  Ferritin: {
    male: { min: 20, max: 500 },
    female: { min: 20, max: 200 },
    unit: 'ng/mL',
    category: 'vitamin',
  },

  // ── Liver ───────────────────────────────────────────────────────────────
  ALT: {
    min: 7,
    max: 56,
    unit: 'U/L',
    category: 'liver',
  },
  AST: {
    min: 10,
    max: 40,
    unit: 'U/L',
    category: 'liver',
  },
  Bilirubin: {
    min: 0.1,
    max: 1.2,
    unit: 'mg/dL',
    category: 'liver',
  },
  Albumin: {
    min: 3.5,
    max: 5.5,
    unit: 'g/dL',
    category: 'liver',
  },

  // ── Kidney ──────────────────────────────────────────────────────────────
  Creatinine: {
    male: { min: 0.7, max: 1.3 },
    female: { min: 0.6, max: 1.1 },
    unit: 'mg/dL',
    category: 'kidney',
  },
  BUN: {
    min: 7,
    max: 20,
    unit: 'mg/dL',
    category: 'kidney',
  },
  eGFR: {
    min: 90,
    max: 120,
    unit: 'mL/min/1.73m²',
    category: 'kidney',
  },
  'Uric Acid': {
    male: { min: 3.4, max: 7.0 },
    female: { min: 2.4, max: 6.0 },
    unit: 'mg/dL',
    category: 'kidney',
  },

  // ── Lipids ──────────────────────────────────────────────────────────────
  'Total Cholesterol': {
    min: 0,
    max: 200,
    unit: 'mg/dL',
    category: 'lipid',
  },
  HDL: {
    male: { min: 40, max: 60 },
    female: { min: 50, max: 60 },
    unit: 'mg/dL',
    category: 'lipid',
  },
  LDL: {
    min: 0,
    max: 100,
    unit: 'mg/dL',
    category: 'lipid',
  },
  Triglycerides: {
    min: 0,
    max: 150,
    unit: 'mg/dL',
    category: 'lipid',
  },

  // ── Metabolic ───────────────────────────────────────────────────────────
  'Fasting Glucose': {
    min: 70,
    max: 100,
    unit: 'mg/dL',
    category: 'metabolic',
  },
  HbA1c: {
    min: 4.0,
    max: 5.6,
    unit: '%',
    category: 'metabolic',
  },
  'Fasting Insulin': {
    min: 2.6,
    max: 24.9,
    unit: 'µIU/mL',
    category: 'metabolic',
  },
};

/**
 * Evaluate a single biomarker value against reference ranges.
 *
 * A value is considered "critical" if it deviates by more than 2× the
 * range width from the nearest boundary — this is a pragmatic heuristic
 * for flagging dangerously abnormal results that need immediate attention.
 *
 * @param {string} name - Biomarker name (must match a key in REFERENCE_RANGES)
 * @param {number} value - Measured value
 * @param {string} [gender] - 'male' or 'female' (used for gender-aware ranges)
 * @returns {{ status: string, normalRange: { min: number, max: number }, unit: string, category: string }}
 */
const evaluateBiomarker = (name, value, gender = 'male') => {
  const ref = REFERENCE_RANGES[name];

  if (!ref) {
    return {
      status: 'normal',
      normalRange: { min: 0, max: 0 },
      unit: 'unknown',
      category: 'unknown',
    };
  }

  // Resolve gender-specific ranges
  let min, max;
  if (ref.male && ref.female) {
    const genderRef = gender === 'female' ? ref.female : ref.male;
    min = genderRef.min;
    max = genderRef.max;
  } else {
    min = ref.min;
    max = ref.max;
  }

  const rangeWidth = max - min;
  let status = 'normal';

  if (value < min) {
    // Check if critically low (> 2× range width below minimum)
    const deviation = min - value;
    status = deviation > rangeWidth * 2 ? 'critical' : 'low';
  } else if (value > max) {
    // Check if critically high (> 2× range width above maximum)
    const deviation = value - max;
    status = deviation > rangeWidth * 2 ? 'critical' : 'high';
  }

  return {
    status,
    normalRange: { min, max },
    unit: ref.unit,
    category: ref.category,
  };
};

/**
 * Evaluate all biomarkers in a report and determine overall status.
 *
 * @param {Array<{ name: string, value: number }>} biomarkers - Array of biomarker measurements
 * @param {string} [gender] - 'male' or 'female'
 * @returns {{ evaluatedBiomarkers: Array, overallStatus: string }}
 */
const evaluateReport = (biomarkers, gender = 'male') => {
  let hasCritical = false;
  let hasAbnormal = false;

  const evaluatedBiomarkers = biomarkers.map((marker) => {
    const evaluation = evaluateBiomarker(marker.name, marker.value, gender);

    if (evaluation.status === 'critical') hasCritical = true;
    if (evaluation.status === 'low' || evaluation.status === 'high') hasAbnormal = true;

    return {
      name: marker.name,
      value: marker.value,
      unit: evaluation.unit || marker.unit,
      normalRange: evaluation.normalRange,
      status: evaluation.status,
      category: evaluation.category || marker.category,
    };
  });

  let overallStatus = 'normal';
  if (hasCritical) overallStatus = 'critical';
  else if (hasAbnormal) overallStatus = 'attention';

  return { evaluatedBiomarkers, overallStatus };
};

module.exports = { REFERENCE_RANGES, evaluateBiomarker, evaluateReport };
