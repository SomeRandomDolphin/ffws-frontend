export const centimetersToMeters = (value) => {
  if (value == null || value === "") return null;

  const centimeters = Number(value);
  if (!Number.isFinite(centimeters)) return null;

  return Number((centimeters / 100).toFixed(5));
};

export const getWaterLevelScaleMax = (values) => {
  const validValues = values.filter(
    (value) => Number.isFinite(value) && value >= 0,
  );
  const highestValue = Math.max(0, ...validValues);

  // Keep small readings visible while leaving some room above the highest point.
  return highestValue > 0 ? highestValue * 1.1 : 1;
};
