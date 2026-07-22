export const centimetersToMeters = (value) => {
  if (value == null || value === "") return null;

  const centimeters = Number(value);
  return Number.isFinite(centimeters) ? centimeters / 100 : null;
};
