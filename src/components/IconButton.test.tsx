import { IconButton } from "@/components/IconButton";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { router, usePathname } from "expo-router";
import { Platform } from "react-native";

jest.mock("expo-router", () => ({
  router: { navigate: jest.fn() },
  usePathname: jest.fn(),
}));

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
const usePathnameMock = usePathname as jest.Mock;

beforeEach(() => {
  navigateMock.mockClear();
  usePathnameMock.mockReturnValue("/");
});

afterEach(() => {
  jest.restoreAllMocks();
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
      <IconButton name="home" accessibilityLabel="Início" href="/settings" />,
    );

    fireEvent.press(screen.getByLabelText("Início"));

    expect(navigateMock).toHaveBeenCalledWith("/settings");
  });

  it("does not navigate when href matches the current pathname", async () => {
    usePathnameMock.mockReturnValue("/settings");

    await render(
      <IconButton
        name="home"
        accessibilityLabel="Início"
        href="/settings?type=live"
      />,
    );

    fireEvent.press(screen.getByLabelText("Início"));

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("prefers onPress over href", async () => {
    const onPress = jest.fn();
    await render(
      <IconButton
        name="home"
        accessibilityLabel="Início"
        href="/settings"
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

  it("uses the highlight color while focused on TV", async () => {
    jest.spyOn(Platform, "isTV", "get").mockReturnValue(true);

    await render(<IconButton name="home" accessibilityLabel="Início" />);

    fireEvent(screen.getByLabelText("Início"), "focus");

    // O estado `focused` do Pressable só chega na próxima renderização
    await waitFor(() =>
      expect(screen.getByTestId("icon")).toHaveProp("color", "#4f9dff"),
    );
  });

  it("keeps the unfocused color while focused off TV", async () => {
    await render(<IconButton name="home" accessibilityLabel="Início" />);

    fireEvent(screen.getByLabelText("Início"), "focus");

    await waitFor(() =>
      expect(screen.getByTestId("icon")).toHaveProp("color", "#1e1e1e"),
    );
  });
});
