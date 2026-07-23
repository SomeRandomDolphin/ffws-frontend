import { render, screen, waitFor } from "@testing-library/react";
import { useGetData } from "../../../hooks/useGetData";
import PrediksiTable from "./PrediksiTable";

jest.mock("../../../hooks/useGetData");

const getPredictionHistory = jest.fn();
const getStasiunLimitAir = jest.fn();

beforeEach(() => {
  getPredictionHistory.mockResolvedValue({
    data: {
      history: [
        {
          id: 1,
          daerah: "dhompo",
          source_timestamp: "2022-12-05 15:00:00",
          serving_tier: "A",
          models: {
            h1: "tier_a_adaptive",
            h2: "tier_a_adaptive",
            h3: "tier_a_adaptive",
            h4: "tier_a_adaptive",
            h5: "tier_a_adaptive",
          },
          predictions: {
            h1: 8.917,
            h2: 8.988,
            h3: 8.923,
            h4: 9.015,
            h5: 9.101,
          },
          status: {
            h1: "BAHAYA",
            h2: "BAHAYA",
            h3: "BAHAYA",
            h4: "BAHAYA",
            h5: "BAHAYA",
          },
          degradation: [],
        },
      ],
      total_count: 1,
    },
  });
  getStasiunLimitAir.mockResolvedValue({
    data: {
      batas_air_siaga: "16.78",
      batas_air_awas: "19.20",
    },
  });

  useGetData.mockReturnValue({
    getPredictionHistory,
    getStasiunLimitAir,
    isLoading: false,
    error: null,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test("renders the migrated five-horizon prediction response", async () => {
  render(<PrediksiTable user={null} stasiun="dhompo" />);

  await waitFor(() =>
    expect(getPredictionHistory).toHaveBeenCalledWith("def", 0, 10, "dhompo"),
  );
  expect(getStasiunLimitAir).toHaveBeenCalledWith("def", 15);

  await waitFor(() => expect(screen.getAllByText("+1 jam")).toHaveLength(2));
  expect(screen.getAllByText("+5 jam")).toHaveLength(2);
  expect(screen.getByText("0.08917 m · AMAN")).toBeTruthy();
  expect(screen.getByText("0.09101 m · AMAN")).toBeTruthy();
  expect(screen.queryByText("Purwodadi LSTM")).toBeNull();
});
