import { Category, CategoryRow } from "@/components/CategoryRow";
import { fireEvent, render, screen } from "@testing-library/react-native";

// A linha só lê o conjunto de chaves em execução — cada teste define-o à mão,
// para não depender da fila real (que é partilhada entre testes).
const mockRunning = { current: new Set<string>() };
jest.mock("@/store/syncQueue", () => ({
  useSyncQueue: (selector: (state: { running: Set<string> }) => unknown) =>
    selector({ running: mockRunning.current }),
}));

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

// A linha entra em loading quando a sua chave está a correr na fila de sync
const RUNNING_KEY = `${CATEGORY.type}:cat:${CATEGORY.categoryId}`;

function markRunning(...keys: string[]) {
  mockRunning.current = new Set(keys);
}

async function setup(
  props: Partial<React.ComponentProps<typeof CategoryRow>> = {},
) {
  const onPress = jest.fn();
  const onLongPress = jest.fn();
  const view = await render(
    <CategoryRow
      item={CATEGORY}
      onPress={onPress}
      onLongPress={onLongPress}
      {...props}
    />,
  );
  return { ...view, onPress, onLongPress };
}

// O ActivityIndicator não expõe testID nem role — procura-se pelo tipo do host
function spinners() {
  return screen.root?.queryAll((node) => node.type === "ActivityIndicator");
}

describe("CategoryRow", () => {
  beforeEach(() => {
    markRunning();
  });

  it("shows the category name", async () => {
    await setup();

    expect(screen.getByText("Desporto")).toBeOnTheScreen();
  });

  it("calls onPress with the item when the row is pressed", async () => {
    const { onPress } = await setup();

    await fireEvent.press(screen.getByText("Desporto"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(CATEGORY);
  });

  it("calls onLongPress with the item on a long press", async () => {
    const { onLongPress } = await setup();

    await fireEvent(screen.getByText("Desporto"), "longPress");

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledWith(CATEGORY);
  });

  it("does not call onPress by itself", async () => {
    const { onPress } = await setup();

    expect(onPress).not.toHaveBeenCalled();
  });

  it("does not call onPress while its own key is running", async () => {
    markRunning(RUNNING_KEY);
    const { onPress, onLongPress } = await setup();

    await fireEvent.press(screen.getByText("Desporto"));
    await fireEvent(screen.getByText("Desporto"), "longPress");

    expect(onPress).not.toHaveBeenCalled();
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("replaces the icon with a spinner while its own key is running", async () => {
    markRunning(RUNNING_KEY);
    await setup();

    expect(screen.getByText("Desporto")).toBeOnTheScreen();
    expect(screen.queryByTestId("icon")).toBeNull();
    expect(spinners()).toHaveLength(1);
  });

  it("ignores keys belonging to other categories", async () => {
    markRunning("live:cat:99", "movie:cat:10");
    await setup();

    expect(screen.getByTestId("icon")).toBeOnTheScreen();
    expect(spinners()).toHaveLength(0);
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
