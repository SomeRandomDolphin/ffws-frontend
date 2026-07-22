import { render, screen, waitFor } from "@testing-library/react";
import { useGetData } from "../../../hooks/useGetData";
import PrediksiTable from "./PrediksiTable";

jest.mock("../../../hooks/useGetData");

const getPredictionHistory = jest.fn();

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
            h1: 891.7,
            h2: 898.8,
            h3: 892.3,
            h4: 901.5,
            h5: 910.1,
          },
          status: {
            h1: "AMAN",
            h2: "AMAN",
            h3: "AMAN",
            h4: "AMAN",
            h5: "AMAN",
          },
          degradation: [],
        },
      ],
      total_count: 1,
    },
  });

  useGetData.mockReturnValue({
    getPredictionHistory,
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

  await waitFor(() => expect(screen.getAllByText("+1 jam")).toHaveLength(2));
  expect(screen.getAllByText("+5 jam")).toHaveLength(2);
  expect(screen.getByText("8.917 m · AMAN")).toBeTruthy();
  expect(screen.getByText("9.101 m · AMAN")).toBeTruthy();
  expect(screen.queryByText("Purwodadi LSTM")).toBeNull();
});
