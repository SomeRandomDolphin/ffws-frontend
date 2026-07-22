import { act, renderHook } from "@testing-library/react";
import api from "../api";
import { useGetData } from "./useGetData";
import { useStatistic } from "./useStatistic";

jest.mock("../api", () => ({
  get: jest.fn(),
}));

beforeEach(() => {
  api.get.mockResolvedValue({ data: { data: [] } });
});

test("requests chart data without a model and caps the forecast at five hours", async () => {
  const { result } = renderHook(() => useStatistic());

  await act(async () => {
    await result.current.getChartData("token", "Dhompo", 12);
  });

  expect(api.get).toHaveBeenCalledWith("/getChartData", {
    params: { daerah: "dhompo", periode: 5 },
    headers: { Authorization: "Bearer token" },
  });
});

test("filters prediction history by canonical station", async () => {
  const { result } = renderHook(() => useGetData());

  await act(async () => {
    await result.current.getPredictionHistory("token", 10, 10, "dhompo");
  });

  expect(api.get).toHaveBeenCalledWith("/getHistoryPrediction", {
    params: { offset: 10, limit: 10, daerah: "dhompo" },
    headers: { Authorization: "Bearer token" },
  });
});
