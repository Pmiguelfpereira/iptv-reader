import MediaBrowser from "@/components/MediaBrowser";
import { MediaItem } from "@/components/MediaCard";
import { SelectOption } from "@/components/Select";
import { fireEvent, render, screen } from "@testing-library/react-native";

// Select e MediaGrid são testados à parte — aqui só interessa o que o
// MediaBrowser lhes passa, por isso ficam stubs que expõem os props.
jest.mock("@/components/Select", () => {
  const { Pressable, Text, View } = require("react-native");
  return {
    __esModule: true,
    default: ({ options, value, onChange, placeholder }: any) => (
      <View testID="select" accessibilityValue={{ text: value ?? "" }}>
        <Text testID="select-placeholder">{placeholder}</Text>
        {options.map((o: any) => (
          <Pressable
            key={o.value}
            testID={`select-option-${o.value}`}
            onPress={() => onChange(o.value)}
          >
            <Text>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    ),
  };
});

jest.mock("@/components/MediaGrid", () => {
  const { Pressable, Text, View } = require("react-native");
  return {
    __esModule: true,
    default: ({ data, onPressItem }: any) => (
      <View testID="media-grid">
        {data.map((item: any) => (
          <Pressable
            key={item.id}
            testID={`media-item-${item.id}`}
            onPress={() => onPressItem(item)}
          >
            <Text>{item.title}</Text>
          </Pressable>
        ))}
      </View>
    ),
  };
});

const OPTIONS: SelectOption[] = [
  { label: "Ação", value: "20" },
  { label: "Comédia", value: "21" },
];

const MEDIA: MediaItem[] = [
  { id: "1", title: "Matrix", poster: "http://poster/1.jpg" },
  { id: "2", title: "Alien", poster: null },
];

async function setup(
  props: Partial<React.ComponentProps<typeof MediaBrowser>> = {},
) {
  const onChange = jest.fn();
  const onPressItem = jest.fn();
  const utils = await render(
    <MediaBrowser
      options={OPTIONS}
      value={null}
      onChange={onChange}
      media={MEDIA}
      onPressItem={onPressItem}
      {...props}
    />,
  );
  return { ...utils, onChange, onPressItem };
}

describe("MediaBrowser", () => {
  it("hides the select by default", async () => {
    await setup();

    expect(screen.queryByTestId("select")).not.toBeOnTheScreen();
  });

  it("uses 'Categories' as the default placeholder", async () => {
    await setup({ useSelect: true });

    expect(screen.getByTestId("select-placeholder")).toHaveTextContent(
      "Categories",
    );
  });

  it("forwards a custom placeholder to the select", async () => {
    await setup({ useSelect: true, placeholder: "Séries" });

    expect(screen.getByTestId("select-placeholder")).toHaveTextContent(
      "Séries",
    );
  });

  it("forwards the options and the selected value to the select", async () => {
    await setup({ useSelect: true, value: "21" });

    expect(screen.getByTestId("select")).toHaveAccessibilityValue({
      text: "21",
    });
    expect(screen.getByText("Ação")).toBeOnTheScreen();
    expect(screen.getByText("Comédia")).toBeOnTheScreen();
  });

  it("calls onChange with the value picked in the select", async () => {
    const { onChange } = await setup({ useSelect: true });

    await fireEvent.press(screen.getByTestId("select-option-21"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("21");
  });

  it("renders the media in the grid", async () => {
    await setup();

    expect(screen.getByTestId("media-grid")).toBeOnTheScreen();
    expect(screen.getByText("Matrix")).toBeOnTheScreen();
    expect(screen.getByText("Alien")).toBeOnTheScreen();
    expect(screen.queryByText("No media available")).not.toBeOnTheScreen();
  });

  it("calls onPressItem with the pressed item", async () => {
    const { onPressItem } = await setup();

    await fireEvent.press(screen.getByTestId("media-item-2"));

    expect(onPressItem).toHaveBeenCalledTimes(1);
    expect(onPressItem).toHaveBeenCalledWith(MEDIA[1]);
  });

  it("shows the empty state instead of the grid when there is no media", async () => {
    await setup({ media: [] });

    expect(screen.getByText("No media available")).toBeOnTheScreen();
    expect(screen.queryByTestId("media-grid")).not.toBeOnTheScreen();
  });

  it("keeps the select visible in the empty state", async () => {
    await setup({ media: [], useSelect: true });

    expect(screen.getByTestId("select")).toBeOnTheScreen();
  });
});
