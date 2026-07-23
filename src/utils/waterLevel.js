export const centimetersToMeters = (value) => {
  if (value == null || value === "") return null;

  const centimeters = Number(value);
  if (!Number.isFinite(centimeters)) return null;

  return Number((centimeters / 100).toFixed(5));
};

export const metersToCentimeters = (value) => {
  if (value == null || value === "") return null;

  const meters = Number(value);
  if (!Number.isFinite(meters)) return null;

  return Number((meters * 100).toFixed(5));
};

export const getWaterLevelStatus = (
  value,
  limits,
  { dangerWhenBelow = false } = {},
) => {
  if (value == null || value === "") return "unavailable";

  const numericValue = Number(value);
  if (
    !Number.isFinite(numericValue) ||
    !Array.isArray(limits) ||
    limits.length !== 2 ||
    !limits.every(Number.isFinite)
  )
    return "unavailable";

  if (dangerWhenBelow) {
    if (numericValue <= limits[0]) return "Bahaya";
    if (numericValue < limits[1]) return "Siaga";
    return "Aman";
  }

  if (numericValue <= limits[0]) return "Aman";
  if (numericValue < limits[1]) return "Siaga";
  return "Bahaya";
};

export const getWaterLevelScaleMax = (values) => {
  const validValues = values.filter(
    (value) => Number.isFinite(value) && value >= 0,
  );
  const highestValue = Math.max(0, ...validValues);

  // Keep small readings visible while leaving some room above the highest point.
  return highestValue > 0 ? highestValue * 1.1 : 1;
};
