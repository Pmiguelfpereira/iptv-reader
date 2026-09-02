import type { MediaItem } from "@/components/MediaCard";
import MediaGrid from "@/components/MediaGrid";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Dimensions, Platform } from "react-native";
import type { TestInstance } from "test-renderer";

// O MediaCard é testado à parte — aqui só interessa o que a grelha lhe passa.
jest.mock("@/components/MediaCard", () => {
  const { Pressable, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ item, width, onPress }: any) => (
      <Pressable testID={`card-${item.id}`} onPress={onPress} style={{ width }}>
        <Text>{item.title}</Text>
      </Pressable>
    ),
  };
});

const MEDIA: MediaItem[] = [
  { id: "1", title: "Matrix", poster: "http://poster/1.jpg" },
  { id: "2", title: "Alien", poster: null },
];

function mockWindowWidth(width: number) {
  jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ width, height: 800, scale: 2, fontScale: 1 });
}

// A raiz é a View que ocupa a área disponível — na TV é o guia de foco.
const area = () => screen.root as TestInstance;

// A FlashList envolve o scroll view numa View própria, o primeiro descendente da raiz.
const list = () => allOfType("View")[0];

function allOfType(type: string): TestInstance[] {
  return screen.root?.queryAll((node) => node.type === type) ?? [];
}

const cardWidth = (id: string) => {
  const style = screen.getByTestId(`card-${id}`).props.style;
  return [style].flat(Infinity).find((s) => s?.width !== undefined)?.width;
};

async function setup({
  width = 400,
  data = MEDIA,
}: { width?: number; data?: MediaItem[] } = {}) {
  mockWindowWidth(width);
  const onPressItem = jest.fn();
  await render(<MediaGrid data={data} onPressItem={onPressItem} />);
  return { onPressItem };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("MediaGrid", () => {
  it("renderiza os itens assim que monta", async () => {
    await setup();

    expect(screen.getByTestId("card-1")).toBeOnTheScreen();
    expect(screen.getByText("Matrix")).toBeOnTheScreen();
    expect(screen.getByText("Alien")).toBeOnTheScreen();
  });

  it("estica a lista por toda a área disponível", async () => {
    await setup();

    expect(area()).toHaveStyle({ flex: 1 });
    expect(list()).toHaveStyle({ flex: 1, overflow: "hidden" });
  });

  it("distribui a largura da janela pelas colunas que couberem", async () => {
    // 400 - 8*2 = 384 → 3 colunas de 110; (384 - 20*2) / 3 = 114,67
    await setup({ width: 400 });

    expect(cardWidth("1")).toBeCloseTo(344 / 3);
  });

  it("usa menos colunas numa janela estreita", async () => {
    // 240 - 8*2 = 224 → 2 colunas; (224 - 20) / 2 = 102
    await setup({ width: 240 });

    expect(cardWidth("1")).toBe(102);
  });

  it("nunca desce abaixo de 2 colunas", async () => {
    // 120 - 8*2 = 104, nem cabe uma coluna de 110; (104 - 20) / 2 = 42
    await setup({ width: 120 });

    expect(cardWidth("1")).toBe(42);
  });

  it("chama onPressItem com o item premido", async () => {
    const { onPressItem } = await setup();

    await fireEvent.press(screen.getByTestId("card-2"));

    expect(onPressItem).toHaveBeenCalledTimes(1);
    expect(onPressItem).toHaveBeenCalledWith(MEDIA[1]);
  });

  it("não falha ao premir um item sem onPressItem", async () => {
    mockWindowWidth(400);
    await render(<MediaGrid data={MEDIA} />);

    await expect(
      fireEvent.press(screen.getByTestId("card-1")),
    ).resolves.not.toThrow();
  });

  it("não renderiza itens quando não há dados", async () => {
    await setup({ data: [] });

    expect(allOfType("RCTScrollView")).toHaveLength(1);
    expect(screen.queryByTestId("card-1")).not.toBeOnTheScreen();
  });

  it("no telemóvel não embrulha a lista num guia de foco", async () => {
    await setup();

    expect(area().props.autoFocus).toBeUndefined();
  });

  it("na TV embrulha a lista num guia de foco com autoFocus", async () => {
    jest.spyOn(Platform, "isTV", "get").mockReturnValue(true);

    await setup();

    // O TVFocusGuideView é a própria raiz, por isso não aparece em `queryAll`.
    expect(area().props.autoFocus).toBe(true);
    expect(area()).toHaveStyle({ flex: 1 });
    expect(screen.getByTestId("card-1")).toBeOnTheScreen();
  });
});
