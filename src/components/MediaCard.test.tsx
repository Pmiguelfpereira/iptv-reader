import MediaCard, { MediaItem } from "@/components/MediaCard";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Platform } from "react-native";
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

// O `expo-image` monta-se como uma view nativa própria, não como o `Image` da RN.
const IMAGE_TYPE = "ViewManagerAdapter_ExpoImage";

// A raiz é a View do Pressable; dentro dela vêm o wrapper do poster e o título.
const card = () => screen.root as TestInstance;
const poster = () => allOfType(IMAGE_TYPE)[0];

// O realce de foco do poster e do título só existe na TV.
function mockTV() {
  jest.spyOn(Platform, "isTV", "get").mockReturnValue(true);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("MediaCard", () => {
  it("mostra o título", async () => {
    await setup();

    expect(screen.getByText("O Padrinho")).toBeOnTheScreen();
  });

  it("mostra o poster quando existe uri", async () => {
    await setup();

    expect(poster().props.source).toEqual([{ uri: ITEM.poster }]);
    expect(poster().props.contentFit).toBe("cover");
  });

  it("mostra um placeholder quando não há poster", async () => {
    await setup({ ...ITEM, poster: null });

    expect(allOfType(IMAGE_TYPE)).toHaveLength(0);

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

  it("no telemóvel o foco não realça o poster", async () => {
    await setup();

    await fireEvent(card(), "focus");

    expect(poster()).not.toHaveStyle({ borderColor: "#4f9dff" });
  });

  it("na TV realça o poster quando ganha foco e reverte no blur", async () => {
    mockTV();
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
