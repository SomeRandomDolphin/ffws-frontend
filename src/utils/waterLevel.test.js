import { centimetersToMeters } from "./waterLevel";

test("converts API water levels from centimeters to meters", () => {
  expect(centimetersToMeters(891.7)).toBeCloseTo(8.917);
  expect(centimetersToMeters("914.5")).toBeCloseTo(9.145);
  expect(centimetersToMeters(0)).toBe(0);
});

test("keeps missing or invalid water levels unavailable", () => {
  expect(centimetersToMeters(null)).toBeNull();
  expect(centimetersToMeters("")).toBeNull();
  expect(centimetersToMeters("not-a-number")).toBeNull();
});
