import { Accordion } from "@/components/Accordion";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { LayoutAnimation, Text } from "react-native";

const DOTS = "⋯";

function Children() {
  return <Text>conteúdo</Text>;
}

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("Accordion", () => {
  it("renders the title and the children expanded by default", async () => {
    await render(
      <Accordion title="Desporto">
        <Children />
      </Accordion>,
    );

    expect(screen.getByText("Desporto")).toBeTruthy();
    expect(screen.getByText("conteúdo")).toBeTruthy();
  });

  it("starts collapsed when defaultExpanded is false", async () => {
    await render(
      <Accordion title="Desporto" defaultExpanded={false}>
        <Children />
      </Accordion>,
    );

    expect(screen.queryByText("conteúdo")).toBeNull();
  });

  it("collapses and expands again when the header is pressed", async () => {
    await render(
      <Accordion title="Desporto">
        <Children />
      </Accordion>,
    );

    await fireEvent.press(screen.getByText("Desporto"));
    expect(screen.queryByText("conteúdo")).toBeNull();

    await fireEvent.press(screen.getByText("Desporto"));
    expect(screen.getByText("conteúdo")).toBeTruthy();
  });

  it("animates the toggle", async () => {
    const configureNext = jest.spyOn(LayoutAnimation, "configureNext");
    await render(<Accordion title="Desporto" />);

    await fireEvent.press(screen.getByText("Desporto"));

    expect(configureNext).toHaveBeenCalledWith(
      LayoutAnimation.Presets.easeInEaseOut,
    );
  });

  it("renders without children", async () => {
    await render(<Accordion title="Desporto" />);

    expect(screen.getByText("Desporto")).toBeTruthy();
  });

  it("hides the menu button when there are no actions", async () => {
    await render(<Accordion title="Desporto" />);

    expect(screen.queryByText(DOTS)).toBeNull();
  });

  it("hides the menu button when actions is empty", async () => {
    await render(<Accordion title="Desporto" actions={{}} />);

    expect(screen.queryByText(DOTS)).toBeNull();
  });

  it("shows the menu button but keeps the menu closed initially", async () => {
    await render(
      <Accordion title="Desporto" actions={{ Esconder: jest.fn() }} />,
    );

    expect(screen.getByText(DOTS)).toBeTruthy();
    expect(screen.queryByText("Esconder")).toBeNull();
  });

  it("opens the menu with every action label", async () => {
    await render(
      <Accordion
        title="Desporto"
        actions={{ Esconder: jest.fn(), Renomear: jest.fn() }}
      />,
    );

    await fireEvent.press(screen.getByText(DOTS));

    expect(screen.getByText("Esconder")).toBeTruthy();
    expect(screen.getByText("Renomear")).toBeTruthy();
  });

  it("closes the menu when the button is pressed again", async () => {
    await render(
      <Accordion title="Desporto" actions={{ Esconder: jest.fn() }} />,
    );

    await fireEvent.press(screen.getByText(DOTS));
    await fireEvent.press(screen.getByText(DOTS));
    expect(screen.queryByText("Esconder")).toBeNull();
  });

  it("runs the handler of the selected action and closes the menu", async () => {
    const esconder = jest.fn();
    const renomear = jest.fn();
    await render(
      <Accordion
        title="Desporto"
        actions={{ Esconder: esconder, Renomear: renomear }}
      />,
    );

    await fireEvent.press(screen.getByText(DOTS));
    await fireEvent.press(screen.getByText("Esconder"));

    expect(esconder).toHaveBeenCalledTimes(1);
    expect(renomear).not.toHaveBeenCalled();
    expect(screen.queryByText("Esconder")).toBeNull();
  });

  it("keeps the expanded state when the menu is used", async () => {
    await render(
      <Accordion title="Desporto" actions={{ Esconder: jest.fn() }}>
        <Children />
      </Accordion>,
    );

    await fireEvent.press(screen.getByText(DOTS));
    await fireEvent.press(screen.getByText("Esconder"));

    expect(screen.getByText("conteúdo")).toBeTruthy();
  });
});
