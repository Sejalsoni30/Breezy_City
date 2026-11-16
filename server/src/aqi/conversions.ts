/**
 * Unit conversions and moving average computations for India CPCB NAQI.
 */

/**
 * Converts Carbon Monoxide from µg/m³ (as provided by Open-Meteo) to mg/m³
 * as required by India CPCB breakpoints.
 */
export function convertCoUgToMg(ugM3: number): number {
  if (isNaN(ugM3) || ugM3 < 0) return NaN;
  // Round to 2 decimal places
  return Math.round((ugM3 / 1000) * 100) / 100;
}

/**
 * Calculates average of an array of numeric values, ignoring nulls and NaNs.
 * Returns null if valid values count is below minRequired.
 */
export function calculateMovingAverage(
  values: (number | null | undefined)[],
  windowSize: number,
  minRequiredPercent: number = 0.75
): number | null {
  if (!values || values.length === 0) return null;

  // Take the most recent windowSize elements
  const slice = values.slice(-windowSize);
  const validValues = slice.filter(
    (v): v is number => v !== null && v !== undefined && !isNaN(v) && v >= 0
  );

  const minRequiredCount = Math.ceil(windowSize * minRequiredPercent);
  if (validValues.length < minRequiredCount) {
    return null;
  }

  const sum = validValues.reduce((acc, curr) => acc + curr, 0);
  return sum / validValues.length;
}
