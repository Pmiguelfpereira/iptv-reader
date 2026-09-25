import type { MediaItem } from "@/components/MediaCard";
import MediaList from "@/components/MediaList";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { TestInstance } from "test-renderer";

const MEDIA: MediaItem[] = [
  { id: "1", title: "Matrix", poster: "http://poster/1.jpg" },
  { id: "2", title: "Alien", poster: null },
  { id: "3", title: "Dune", poster: null },
];

// A raiz é a View que ocupa a área disponível.
const area = () => screen.root as TestInstance;

function allOfType(type: string): TestInstance[] {
  return screen.root?.queryAll((node) => node.type === type) ?? [];
}

// A FlashList não põe a altura no scroll view: envolve-o numa View própria,
// que é o primeiro descendente da área medida.
const list = () => allOfType("View")[0];

// A linha é a View que envolve o id e o título de cada item.
const row = (title: string) => screen.getByText(title).parent as TestInstance;

// A célula é a View com que a FlashList embrulha cada linha e o seu separador.
const cell = (title: string) => row(title).parent as TestInstance;

// O separador é uma View de 1px que a FlashList insere a seguir à linha.
const separatorOf = (title: string) =>
  cell(title).children.filter(
    (child): child is TestInstance =>
      typeof child !== "string" && child !== row(title),
  );

async function setup({ data = MEDIA }: { data?: MediaItem[] } = {}) {
  const onPressItem = jest.fn();
  await render(
    <MediaList data={data} onPressItem={onPressItem} resetKey="all" />,
  );
  return { onPressItem };
}

describe("MediaList", () => {
  it("renders the id and title of each item", async () => {
    await setup();

    expect(screen.getByText("Matrix")).toBeOnTheScreen();
    expect(screen.getByText("Alien")).toBeOnTheScreen();
    expect(screen.getByText("Dune")).toBeOnTheScreen();
    expect(screen.getByText("1")).toBeOnTheScreen();
    expect(screen.getByText("2")).toBeOnTheScreen();
    expect(screen.getByText("3")).toBeOnTheScreen();
  });

  it("stretches the list over the available area", async () => {
    await setup();

    expect(area()).toHaveStyle({ flex: 1 });
    expect(list()).toHaveStyle({ flex: 1, overflow: "hidden" });
  });

  it("separates every item except the last", async () => {
    await setup();

    expect(separatorOf("Matrix")[0]).toHaveStyle({ height: 1 });
    expect(separatorOf("Alien")[0]).toHaveStyle({ height: 1 });
    expect(separatorOf("Dune")).toHaveLength(0);
  });

  it("separates nothing when there is only one item", async () => {
    await setup({ data: [MEDIA[0]] });

    expect(separatorOf("Matrix")).toHaveLength(0);
  });

  it("calls onPressItem with the pressed item", async () => {
    const { onPressItem } = await setup();

    await fireEvent.press(screen.getByText("Alien"));

    expect(onPressItem).toHaveBeenCalledTimes(1);
    expect(onPressItem).toHaveBeenCalledWith(MEDIA[1]);
  });

  it("does not fail when pressing an item without onPressItem", async () => {
    await render(<MediaList data={MEDIA} resetKey="all" />);

    await expect(
      fireEvent.press(screen.getByText("Matrix")),
    ).resolves.not.toThrow();
  });

  it("renders no items when there is no data", async () => {
    await setup({ data: [] });

    expect(allOfType("RCTScrollView")).toHaveLength(1);
    expect(screen.queryByText("Matrix")).not.toBeOnTheScreen();
  });
});
