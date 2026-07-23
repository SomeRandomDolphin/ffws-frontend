import {
  centimetersToMeters,
  getWaterLevelScaleMax,
  getWaterLevelStatus,
  metersToCentimeters,
} from "./waterLevel";

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

test("converts edited metre limits back to API centimetres", () => {
  expect(metersToCentimeters(2.9603)).toBe(296.03);
  expect(metersToCentimeters("2.9827")).toBe(298.27);
  expect(metersToCentimeters(null)).toBeNull();
});

test("compares water levels and thresholds after both use metres", () => {
  const limits = [centimetersToMeters(16.78), centimetersToMeters(19.2)];

  expect(getWaterLevelStatus(centimetersToMeters(9.145), limits)).toBe("Aman");
  expect(getWaterLevelStatus(centimetersToMeters(18), limits)).toBe("Siaga");
  expect(getWaterLevelStatus(centimetersToMeters(20), limits)).toBe("Bahaya");
});

test("supports inverse thresholds for Purwodadi", () => {
  const reading = centimetersToMeters(288.581);
  const limits = [centimetersToMeters(296.03), centimetersToMeters(298.27)];

  expect(getWaterLevelStatus(reading, limits, { dangerWhenBelow: true })).toBe(
    "Bahaya",
  );
});

test("keeps status unavailable when readings or thresholds are invalid", () => {
  expect(getWaterLevelStatus(null, [0.1, 0.2])).toBe("unavailable");
  expect(getWaterLevelStatus(0.1, null)).toBe("unavailable");
});

test("scales the chart to small water-level readings", () => {
  expect(getWaterLevelScaleMax([0.01, 0.02, null])).toBeCloseTo(0.022);
});

test("scales across actual and predicted readings", () => {
  expect(getWaterLevelScaleMax([2.5, 3, 4.5])).toBeCloseTo(4.95);
});

test("uses a safe default when there are no positive readings", () => {
  expect(getWaterLevelScaleMax([null, undefined, 0])).toBe(1);
});
