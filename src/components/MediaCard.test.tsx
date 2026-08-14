import MediaCard, { MediaItem } from "@/components/MediaCard";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { TestInstance } from "test-renderer";

const ITEM: MediaItem = {
  id: "1",
  title: "O Padrinho",
  poster: "https://example.com/poster.jpg",
  ext: "mp4",
};

async function setup(item: MediaItem = ITEM) {
  const onPress = jest.fn();
  await render(<MediaCard item={item} width={120} onPress={onPress} />);
  return { onPress };
}

// O componente não expõe testIDs e a RNTL 14 já não tem `UNSAFE_getByType`,
// por isso procuramos os elementos host pelo tipo a partir da raiz.
function allOfType(type: string): TestInstance[] {
  return screen.root?.queryAll((node) => node.type === type) ?? [];
}

// A raiz é a View do Pressable; dentro dela vêm o wrapper do poster e o título.
const card = () => screen.root as TestInstance;
const poster = () => allOfType("Image")[0];

describe("MediaCard", () => {
  it("mostra o título", async () => {
    await setup();

    expect(screen.getByText("O Padrinho")).toBeOnTheScreen();
  });

  it("mostra o poster quando existe uri", async () => {
    await setup();

    expect(poster().props.source).toEqual({ uri: ITEM.poster });
    expect(poster().props.resizeMode).toBe("cover");
  });

  it("mostra um placeholder quando não há poster", async () => {
    await setup({ ...ITEM, poster: null });

    expect(allOfType("Image")).toHaveLength(0);

    // [0] é o wrapper do poster, [1] o placeholder que substitui a imagem
    const placeholder = allOfType("View")[1];
    expect(placeholder).toHaveStyle({ aspectRatio: 2 / 3, borderRadius: 8 });
  });

  it("aplica a largura recebida", async () => {
    await setup();

    expect(card()).toHaveStyle({ width: 120 });
  });

  it("chama onPress ao premir", async () => {
    const { onPress } = await setup();

    await fireEvent.press(screen.getByText(ITEM.title));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("realça o título e o poster quando ganha foco e reverte no blur", async () => {
    await setup();

    expect(screen.getByText(ITEM.title)).toHaveStyle({ color: "#000" });
    expect(poster()).not.toHaveStyle({ borderColor: "#4f9dff" });

    await fireEvent(card(), "focus");

    expect(screen.getByText(ITEM.title)).toHaveStyle({ color: "#000" });
    expect(poster()).toHaveStyle({ borderWidth: 3, borderColor: "#4f9dff" });
    expect(card()).toHaveStyle({ zIndex: 1 });

    await fireEvent(card(), "blur");

    expect(screen.getByText(ITEM.title)).toHaveStyle({ color: "#000" });
    expect(poster()).not.toHaveStyle({ borderColor: "#4f9dff" });
  });
});
