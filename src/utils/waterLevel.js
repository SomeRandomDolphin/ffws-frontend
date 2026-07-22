export const centimetersToMeters = (value) => {
  if (value == null || value === "") return null;

  const centimeters = Number(value);
  if (!Number.isFinite(centimeters)) return null;

  return Number((centimeters / 100).toFixed(5));
};
