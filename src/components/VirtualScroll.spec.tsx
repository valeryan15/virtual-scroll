import { render, screen } from "@testing-library/react";
import { VirtualScroll } from "./VirtualScroll";

describe("VirtualScroll", () => {
  it("renders the first visible item", () => {
    const items = Array.from({ length: 50 }, (_, index) => (
      <div key={index}>Row {index + 1}</div>
    ));

    render(
      <VirtualScroll items={items} itemHeight={40} height={200} />
    );

    expect(screen.getByText("Row 1")).toBeInTheDocument();
  });
});
