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

// A raiz é a View que mede a área disponível; a lista só aparece depois do layout.
const area = () => screen.root as TestInstance;

const layout = (height: number) =>
  fireEvent(area(), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 400, height } },
  });

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
  it("não renderiza a lista antes de conhecer a altura da área", async () => {
    await setup();

    expect(screen.queryByTestId("card-1")).not.toBeOnTheScreen();
  });

  it("renderiza os itens depois do layout", async () => {
    await setup();

    await layout(600);

    expect(screen.getByTestId("card-1")).toBeOnTheScreen();
    expect(screen.getByText("Matrix")).toBeOnTheScreen();
    expect(screen.getByText("Alien")).toBeOnTheScreen();
  });

  it("limita a lista à altura medida", async () => {
    await setup();

    await layout(600);

    expect(allOfType("RCTScrollView")[0]).toHaveStyle({ height: 600 });
  });

  it("distribui a largura da janela pelas colunas que couberem", async () => {
    // 400 - 8*2 = 384 → 3 colunas de 110; (384 - 12*2) / 3 = 120
    await setup({ width: 400 });

    await layout(600);

    expect(cardWidth("1")).toBe(120);
  });

  it("usa menos colunas numa janela estreita", async () => {
    // 240 - 8*2 = 224 → 2 colunas; (224 - 12) / 2 = 106
    await setup({ width: 240 });

    await layout(600);

    expect(cardWidth("1")).toBe(106);
  });

  it("nunca desce abaixo de 2 colunas", async () => {
    // 120 - 8*2 = 104, nem cabe uma coluna de 110; (104 - 12) / 2 = 46
    await setup({ width: 120 });

    await layout(600);

    expect(cardWidth("1")).toBe(46);
  });

  it("chama onPressItem com o item premido", async () => {
    const { onPressItem } = await setup();

    await layout(600);
    await fireEvent.press(screen.getByTestId("card-2"));

    expect(onPressItem).toHaveBeenCalledTimes(1);
    expect(onPressItem).toHaveBeenCalledWith(MEDIA[1]);
  });

  it("não falha ao premir um item sem onPressItem", async () => {
    mockWindowWidth(400);
    await render(<MediaGrid data={MEDIA} />);

    await layout(600);

    await expect(
      fireEvent.press(screen.getByTestId("card-1")),
    ).resolves.not.toThrow();
  });

  it("não renderiza itens quando não há dados", async () => {
    await setup({ data: [] });

    await layout(600);

    expect(allOfType("RCTScrollView")).toHaveLength(1);
    expect(screen.queryByTestId("card-1")).not.toBeOnTheScreen();
  });

  it("na TV embrulha a lista num guia de foco com autoFocus", async () => {
    jest.spyOn(Platform, "isTV", "get").mockReturnValue(true);

    await setup();
    await layout(600);

    const guides = area().queryAll((node) => node.props?.autoFocus === true);
    expect(guides).not.toHaveLength(0);
    expect(guides[0]).toHaveStyle({ height: 600 });
    expect(screen.getByTestId("card-1")).toBeOnTheScreen();
  });
});
