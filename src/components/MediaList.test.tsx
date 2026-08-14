import type { MediaItem } from "@/components/MediaCard";
import MediaList from "@/components/MediaList";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { TestInstance } from "test-renderer";

const MEDIA: MediaItem[] = [
  { id: "1", title: "Matrix", poster: "http://poster/1.jpg" },
  { id: "2", title: "Alien", poster: null },
  { id: "3", title: "Dune", poster: null },
];

// A raiz é a View que mede a área disponível; a lista herda essa altura.
const area = () => screen.root as TestInstance;

const layout = (height: number) =>
  fireEvent(area(), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 400, height } },
  });

function allOfType(type: string): TestInstance[] {
  return screen.root?.queryAll((node) => node.type === type) ?? [];
}

// A linha é a View que envolve o id e o título de cada item.
const row = (title: string) => screen.getByText(title).parent as TestInstance;

async function setup({ data = MEDIA }: { data?: MediaItem[] } = {}) {
  const onPressItem = jest.fn();
  await render(<MediaList data={data} onPressItem={onPressItem} />);
  return { onPressItem };
}

describe("MediaList", () => {
  it("renderiza o id e o título de cada item", async () => {
    await setup();

    expect(screen.getByText("Matrix")).toBeOnTheScreen();
    expect(screen.getByText("Alien")).toBeOnTheScreen();
    expect(screen.getByText("Dune")).toBeOnTheScreen();
    expect(screen.getByText("1")).toBeOnTheScreen();
    expect(screen.getByText("2")).toBeOnTheScreen();
    expect(screen.getByText("3")).toBeOnTheScreen();
  });

  it("arranca sem altura enquanto não houver layout", async () => {
    await setup();

    expect(allOfType("RCTScrollView")[0]).toHaveStyle({ height: 0 });
  });

  it("limita a lista à altura medida", async () => {
    await setup();

    await layout(600);

    expect(allOfType("RCTScrollView")[0]).toHaveStyle({ height: 600 });
  });

  it("separa todos os itens menos o último", async () => {
    await setup();

    expect(row("Matrix")).toHaveStyle({ borderBottomWidth: 1 });
    expect(row("Alien")).toHaveStyle({ borderBottomWidth: 1 });
    expect(row("Dune")).not.toHaveStyle({ borderBottomWidth: 1 });
  });

  it("não separa nada quando só há um item", async () => {
    await setup({ data: [MEDIA[0]] });

    expect(row("Matrix")).not.toHaveStyle({ borderBottomWidth: 1 });
  });

  it("chama onPressItem com o item premido", async () => {
    const { onPressItem } = await setup();

    await fireEvent.press(screen.getByText("Alien"));

    expect(onPressItem).toHaveBeenCalledTimes(1);
    expect(onPressItem).toHaveBeenCalledWith(MEDIA[1]);
  });

  it("não falha ao premir um item sem onPressItem", async () => {
    await render(<MediaList data={MEDIA} />);

    await expect(
      fireEvent.press(screen.getByText("Matrix")),
    ).resolves.not.toThrow();
  });

  it("não renderiza itens quando não há dados", async () => {
    await setup({ data: [] });

    await layout(600);

    expect(allOfType("RCTScrollView")).toHaveLength(1);
    expect(screen.queryByText("Matrix")).not.toBeOnTheScreen();
  });
});
