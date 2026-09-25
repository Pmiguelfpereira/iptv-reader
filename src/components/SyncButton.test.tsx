import { SyncButton } from "@/components/SyncButton";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Platform } from "react-native";

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

afterEach(() => {
  jest.restoreAllMocks();
});

// O ActivityIndicator não expõe testID nem role — procura-se pelo tipo do host
function spinners() {
  return screen.root?.queryAll((node) => node.type === "ActivityIndicator");
}

describe("SyncButton", () => {
  it("renders the sync icon when not syncing", async () => {
    await render(<SyncButton label="Sincronizar" onPress={jest.fn()} />);

    expect(screen.getByTestId("icon")).toHaveProp("name", "sync");
    expect(spinners()).toHaveLength(0);
  });

  it("renders the label and exposes it as accessibility label", async () => {
    await render(<SyncButton label="Sincronizar" onPress={jest.fn()} />);

    expect(screen.getByText("Sincronizar")).toBeOnTheScreen();
    expect(screen.getByLabelText("Sincronizar")).toBeOnTheScreen();
  });

  it("renders no label text when label is omitted", async () => {
    await render(<SyncButton onPress={jest.fn()} />);

    expect(screen.getByTestId("icon")).toBeOnTheScreen();
    expect(screen.queryByText(/.+/)).toBeNull();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    await render(<SyncButton label="Sincronizar" onPress={onPress} />);

    fireEvent.press(screen.getByLabelText("Sincronizar"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows a spinner instead of the icon while syncing", async () => {
    await render(
      <SyncButton label="Sincronizar" onPress={jest.fn()} syncing />,
    );

    expect(spinners()).toHaveLength(1);
    expect(screen.queryByTestId("icon")).toBeNull();
    expect(screen.getByText("Sincronizar")).toBeOnTheScreen();
  });

  it("ignores presses while syncing", async () => {
    const onPress = jest.fn();
    await render(
      <SyncButton label="Sincronizar" onPress={onPress} syncing />,
    );

    fireEvent.press(screen.getByLabelText("Sincronizar"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("uses the unfocused color by default", async () => {
    await render(<SyncButton label="Sincronizar" onPress={jest.fn()} />);

    expect(screen.getByTestId("icon")).toHaveProp("color", "#000");
    expect(screen.getByText("Sincronizar")).toHaveStyle({ color: "#000" });
  });

  it("uses the highlight color while focused on TV", async () => {
    jest.spyOn(Platform, "isTV", "get").mockReturnValue(true);

    await render(<SyncButton label="Sincronizar" onPress={jest.fn()} />);

    fireEvent(screen.getByLabelText("Sincronizar"), "focus");

    // O estado `focused` do Pressable só chega na próxima renderização
    await waitFor(() =>
      expect(screen.getByTestId("icon")).toHaveProp("color", "#4f9dff"),
    );
    expect(screen.getByText("Sincronizar")).toHaveStyle({ color: "#4f9dff" });
  });

  it("keeps the unfocused color while focused off TV", async () => {
    await render(<SyncButton label="Sincronizar" onPress={jest.fn()} />);

    fireEvent(screen.getByLabelText("Sincronizar"), "focus");

    await waitFor(() =>
      expect(screen.getByTestId("icon")).toHaveProp("color", "#000"),
    );
    expect(screen.getByText("Sincronizar")).toHaveStyle({ color: "#000" });
  });

  it("highlights the border while focused", async () => {
    await render(<SyncButton label="Sincronizar" onPress={jest.fn()} />);

    fireEvent(screen.getByLabelText("Sincronizar"), "focus");

    await waitFor(() =>
      expect(screen.getByLabelText("Sincronizar")).toHaveStyle({
        borderColor: "#4f9dff",
      }),
    );
  });

  it("forwards TV focus props on TV", async () => {
    jest.spyOn(Platform, "isTV", "get").mockReturnValue(true);

    await render(
      <SyncButton
        label="Sincronizar"
        onPress={jest.fn()}
        preferFocus
        nextFocusUp={42}
      />,
    );

    const button = screen.getByLabelText("Sincronizar");
    expect(button).toHaveProp("hasTVPreferredFocus", true);
    expect(button).toHaveProp("nextFocusUp", 42);
  });

  it("does not forward TV focus props off TV", async () => {
    await render(
      <SyncButton
        label="Sincronizar"
        onPress={jest.fn()}
        preferFocus
        nextFocusUp={42}
      />,
    );

    const button = screen.getByLabelText("Sincronizar");
    expect(button).not.toHaveProp("hasTVPreferredFocus");
    expect(button).not.toHaveProp("nextFocusUp");
  });
});
