import { Category, CategoryRow } from "@/components/CategoryRow";
import { fireEvent, render, screen } from "@testing-library/react-native";

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

const CATEGORY: Category = {
  id: 1,
  categoryId: 10,
  name: "Desporto",
  type: "live",
  hidden: false,
};

async function setup(
  props: Partial<React.ComponentProps<typeof CategoryRow>> = {},
) {
  const onPress = jest.fn();
  const view = await render(
    <CategoryRow item={CATEGORY} onPress={onPress} {...props} />,
  );
  return { ...view, onPress };
}

// O ActivityIndicator não expõe testID nem role — procura-se pelo tipo do host
function spinners() {
  return screen.root?.queryAll((node) => node.type === "ActivityIndicator");
}

describe("CategoryRow", () => {
  it("shows the category name", async () => {
    await setup();

    expect(screen.getByText("Desporto")).toBeOnTheScreen();
  });

  it("calls onPress with the item when the row is pressed", async () => {
    const { onPress } = await setup();

    fireEvent.press(screen.getByText("Desporto"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(CATEGORY);
  });

  it("does not call onPress by itself", async () => {
    const { onPress } = await setup();

    expect(onPress).not.toHaveBeenCalled();
  });

  it("does not call onPress while loading", async () => {
    const { onPress } = await setup({ loading: true });

    fireEvent.press(screen.getByText("Desporto"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("replaces the icon with a spinner while loading", async () => {
    await setup({ loading: true });

    expect(screen.getByText("Desporto")).toBeOnTheScreen();
    expect(screen.queryByTestId("icon")).toBeNull();
    expect(spinners()).toHaveLength(1);
  });

  it("uses the sync icon for a visible category", async () => {
    await setup();

    expect(screen.getByTestId("icon")).toHaveProp("name", "sync");
    expect(spinners()).toHaveLength(0);
  });

  it("uses the eye-invisible icon for a hidden category", async () => {
    await setup({ item: { ...CATEGORY, hidden: true } });

    expect(screen.getByTestId("icon")).toHaveProp("name", "eye-invisible");
  });
});
