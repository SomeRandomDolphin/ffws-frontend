import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";

jest.mock("./hooks/useAuthContext", () => ({
  useAuthContext: () => ({ user: null }),
}));

jest.mock("./hooks/useLogout", () => ({
  useLogout: () => ({ logout: jest.fn() }),
}));

test("renders the primary public navigation", () => {
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );

  expect(screen.getAllByText("FFWS Welang").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Utama" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Dashboard" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Riwayat" })).toBeInTheDocument();
});
