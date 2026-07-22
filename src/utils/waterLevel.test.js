import { centimetersToMeters } from "./waterLevel";

test("converts API water levels from centimeters to meters", () => {
  expect(centimetersToMeters(891.7)).toBeCloseTo(8.917);
  expect(centimetersToMeters("914.5")).toBeCloseTo(9.145);
  expect(centimetersToMeters(0)).toBe(0);
});

test("rounds converted values without floating-point display artifacts", () => {
  expect(centimetersToMeters(288.58300000000003)).toBe(2.88583);
  expect(centimetersToMeters(288.57799999999997)).toBe(2.88578);
  expect(String(centimetersToMeters(288.62200000000007))).toBe("2.88622");
});

test("keeps missing or invalid water levels unavailable", () => {
  expect(centimetersToMeters(null)).toBeNull();
  expect(centimetersToMeters("")).toBeNull();
  expect(centimetersToMeters("not-a-number")).toBeNull();
});
