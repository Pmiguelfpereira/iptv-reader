import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { OptionRow } from "@/components/OptionRow";

// O ícone real carrega fontes nativas — basta expor as props na árvore renderizada
jest.mock("@react-native-vector-icons/ant-design/static", () => {
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => (
      <Text testID="icon" {...props} />
    ),
  };
});

const option = { label: "Filmes", value: "movies" };

const row = () => screen.getByText(option.label).parent!;

describe("OptionRow", () => {
  it("renders the option label", async () => {
    await render(
      <OptionRow option={option} isActive={false} onSelect={jest.fn()} />,
    );

    expect(screen.getByText("Filmes")).toBeOnTheScreen();
  });

  it("calls onSelect when pressed", async () => {
    const onSelect = jest.fn();
    await render(
      <OptionRow option={option} isActive={false} onSelect={onSelect} />,
    );

    fireEvent.press(screen.getByText("Filmes"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("does not render the check icon when inactive", async () => {
    await render(
      <OptionRow option={option} isActive={false} onSelect={jest.fn()} />,
    );

    expect(screen.queryByTestId("icon")).toBeNull();
  });

  it("renders the check icon when active", async () => {
    await render(
      <OptionRow option={option} isActive onSelect={jest.fn()} />,
    );

    const icon = screen.getByTestId("icon");

    expect(icon).toHaveProp("name", "check");
    expect(icon).toHaveProp("size", 20);
    expect(icon).toHaveProp("color", "#111");
  });

  it("uses the inactive styles by default", async () => {
    await render(
      <OptionRow option={option} isActive={false} onSelect={jest.fn()} />,
    );

    expect(row()).toHaveStyle({
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingVertical: 18,
    });
    expect(screen.getByText("Filmes")).toHaveStyle({
      color: "#1A1A1A",
      fontSize: 18,
    });
  });

  it("highlights the row and the label when active", async () => {
    await render(<OptionRow option={option} isActive onSelect={jest.fn()} />);

    expect(row()).toHaveStyle({ backgroundColor: "#F5F5F5" });
    expect(screen.getByText("Filmes")).toHaveStyle({
      color: "#111",
      fontWeight: "500",
    });
  });

  it("highlights the row and the label while focused", async () => {
    await render(
      <OptionRow option={option} isActive={false} onSelect={jest.fn()} />,
    );

    fireEvent(screen.getByText("Filmes"), "focus");

    // O estado `focused` só chega na próxima renderização
    await waitFor(() =>
      expect(row()).toHaveStyle({
        backgroundColor: "rgba(79, 157, 255, 0.15)",
      }),
    );
    expect(screen.getByText("Filmes")).toHaveStyle({
      color: "#111",
      fontWeight: "500",
    });
  });

  it("drops the focus highlight on blur", async () => {
    await render(
      <OptionRow option={option} isActive={false} onSelect={jest.fn()} />,
    );

    fireEvent(screen.getByText("Filmes"), "focus");
    await waitFor(() =>
      expect(row()).toHaveStyle({
        backgroundColor: "rgba(79, 157, 255, 0.15)",
      }),
    );

    fireEvent(screen.getByText("Filmes"), "blur");

    await waitFor(() =>
      expect(row()).not.toHaveStyle({
        backgroundColor: "rgba(79, 157, 255, 0.15)",
      }),
    );
    expect(screen.getByText("Filmes")).toHaveStyle({ color: "#1A1A1A" });
  });

  it("keeps the active background when focused on an active option", async () => {
    await render(<OptionRow option={option} isActive onSelect={jest.fn()} />);

    fireEvent(screen.getByText("Filmes"), "focus");

    // O estilo de foco vem depois do de activo, por isso sobrepõe-se
    await waitFor(() =>
      expect(row()).toHaveStyle({
        backgroundColor: "rgba(79, 157, 255, 0.15)",
      }),
    );
    expect(screen.getByTestId("icon")).toBeOnTheScreen();
  });
});
