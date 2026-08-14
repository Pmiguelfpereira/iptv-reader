import { IconButton } from "@/components/IconButton";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { router } from "expo-router";

jest.mock("expo-router", () => ({ router: { navigate: jest.fn() } }));

// O ícone real carrega fontes nativas — basta expor as props no árvore renderizada
jest.mock("@react-native-vector-icons/ant-design/static", () => {
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => (
      <Text testID="icon" {...props} />
    ),
  };
});

const navigateMock = router.navigate as jest.Mock;

beforeEach(() => {
  navigateMock.mockClear();
});

describe("IconButton", () => {
  it("renders the icon with the given name and the default size", async () => {
    await render(<IconButton name="home" accessibilityLabel="Início" />);

    expect(screen.getByTestId("icon")).toHaveProp("name", "home");
    expect(screen.getByTestId("icon")).toHaveProp("size", 25);
  });

  it("exposes the accessibility label on the pressable", async () => {
    await render(<IconButton name="home" accessibilityLabel="Início" />);

    expect(screen.getByLabelText("Início")).toBeOnTheScreen();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    await render(
      <IconButton name="home" accessibilityLabel="Início" onPress={onPress} />,
    );

    fireEvent.press(screen.getByLabelText("Início"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("navigates to href when pressed without onPress", async () => {
    await render(
      <IconButton name="home" accessibilityLabel="Início" href="/categories" />,
    );

    fireEvent.press(screen.getByLabelText("Início"));

    expect(navigateMock).toHaveBeenCalledWith("/categories");
  });

  it("prefers onPress over href", async () => {
    const onPress = jest.fn();
    await render(
      <IconButton
        name="home"
        accessibilityLabel="Início"
        href="/categories"
        onPress={onPress}
      />,
    );

    fireEvent.press(screen.getByLabelText("Início"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("does nothing when pressed without onPress or href", async () => {
    await render(<IconButton name="home" accessibilityLabel="Início" />);

    fireEvent.press(screen.getByLabelText("Início"));

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("is enabled by default", async () => {
    await render(<IconButton name="home" accessibilityLabel="Início" />);

    expect(screen.getByLabelText("Início")).toBeEnabled();
  });

  it("does not fire onPress when disabled", async () => {
    const onPress = jest.fn();
    await render(
      <IconButton
        name="home"
        accessibilityLabel="Início"
        onPress={onPress}
        disabled
      />,
    );

    expect(screen.getByLabelText("Início")).toBeDisabled();

    fireEvent.press(screen.getByLabelText("Início"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("uses the unfocused color by default", async () => {
    await render(<IconButton name="home" accessibilityLabel="Início" />);

    expect(screen.getByTestId("icon")).toHaveProp("color", "#1e1e1e");
  });

  it("uses the highlight color while focused", async () => {
    await render(<IconButton name="home" accessibilityLabel="Início" />);

    fireEvent(screen.getByLabelText("Início"), "focus");

    // O estado `focused` do Pressable só chega na próxima renderização
    await waitFor(() =>
      expect(screen.getByTestId("icon")).toHaveProp("color", "#4f9dff"),
    );
  });
});
