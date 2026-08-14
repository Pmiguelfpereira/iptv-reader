import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import Select, { SelectOption } from "@/components/Select";

// Sem SafeAreaProvider o hook rebenta — o mock oficial devolve insets fixos
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);

// O ícone real carrega fontes nativas — basta expor as props na árvore renderizada
jest.mock("@react-native-vector-icons/ant-design/static", () => {
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => (
      <Text testID={`icon-${props.name}`} {...props} />
    ),
  };
});

const OPTIONS: SelectOption[] = [
  { label: "Ação", value: "20" },
  { label: "Comédia", value: "21" },
  { label: "Documentários", value: "22" },
];

async function setup(props: Partial<React.ComponentProps<typeof Select>> = {}) {
  const onChange = jest.fn();
  const utils = await render(
    <Select options={OPTIONS} value={null} onChange={onChange} {...props} />,
  );
  return { ...utils, onChange };
}

const openSheet = async () => {
  await fireEvent.press(screen.getByText("Selecionar"));
};

const searchInput = () => screen.getByPlaceholderText("Search...");

describe("Select", () => {
  describe("field", () => {
    it("shows the default placeholder when nothing is selected", async () => {
      await setup();

      const field = screen.getByText("Selecionar");

      expect(field).toBeOnTheScreen();
      expect(field).toHaveStyle({ color: "#8a8a8a" });
    });

    it("shows a custom placeholder", async () => {
      await setup({ placeholder: "Categorias" });

      expect(screen.getByText("Categorias")).toBeOnTheScreen();
      expect(screen.queryByText("Selecionar")).not.toBeOnTheScreen();
    });

    it("shows the label of the selected option", async () => {
      await setup({ value: "21" });

      const field = screen.getByText("Comédia");

      expect(field).toBeOnTheScreen();
      expect(field).toHaveStyle({ color: "#fff", fontSize: 16 });
      expect(screen.queryByText("Selecionar")).not.toBeOnTheScreen();
    });

    it("falls back to the placeholder when the value has no matching option", async () => {
      await setup({ value: "999" });

      expect(screen.getByText("Selecionar")).toBeOnTheScreen();
    });

    it("renders the chevron", async () => {
      await setup();

      const chevron = screen.getByTestId("icon-down");

      expect(chevron).toHaveProp("size", 18);
      expect(chevron).toHaveProp("color", "#8a8a8a");
    });
  });

  describe("opening and closing", () => {
    it("keeps the sheet closed until the field is pressed", async () => {
      await setup();

      expect(screen.queryByText("Ação")).not.toBeOnTheScreen();
      expect(screen.queryByPlaceholderText("Search...")).not.toBeOnTheScreen();
    });

    it("opens the sheet with every option when the field is pressed", async () => {
      await setup();

      await openSheet();

      expect(screen.getByText("Ação")).toBeOnTheScreen();
      expect(screen.getByText("Comédia")).toBeOnTheScreen();
      expect(screen.getByText("Documentários")).toBeOnTheScreen();
    });
  });

  describe("search", () => {
    it("renders the search box by default", async () => {
      await setup();

      await openSheet();

      expect(searchInput()).toBeOnTheScreen();
      expect(screen.getByTestId("icon-search")).toBeOnTheScreen();
    });

    it("hides the search box when searchable is false", async () => {
      await setup({ searchable: false });

      await openSheet();

      expect(screen.queryByPlaceholderText("Search...")).not.toBeOnTheScreen();
      expect(screen.queryByTestId("icon-search")).not.toBeOnTheScreen();
      expect(screen.getByText("Ação")).toBeOnTheScreen();
    });

    it("filters the options ignoring case", async () => {
      await setup();
      await openSheet();

      await fireEvent.changeText(searchInput(), "cOm");

      expect(screen.getByText("Comédia")).toBeOnTheScreen();
      expect(screen.queryByText("Ação")).not.toBeOnTheScreen();
      expect(screen.queryByText("Documentários")).not.toBeOnTheScreen();
    });

    it("keeps every option when the query is only whitespace", async () => {
      await setup();
      await openSheet();

      await fireEvent.changeText(searchInput(), "   ");

      expect(screen.getByText("Ação")).toBeOnTheScreen();
      expect(screen.getByText("Comédia")).toBeOnTheScreen();
      expect(screen.getByText("Documentários")).toBeOnTheScreen();
    });

    it("shows the empty state when nothing matches", async () => {
      await setup();
      await openSheet();

      await fireEvent.changeText(searchInput(), "terror");

      expect(screen.getByText("Sem resultados")).toBeOnTheScreen();
      expect(screen.queryByText("Ação")).not.toBeOnTheScreen();
    });

    it("highlights the search icon while the input is focused", async () => {
      await setup();
      await openSheet();

      await fireEvent(searchInput(), "focus");

      // O estado `searchFocused` só chega na próxima renderização
      await waitFor(() =>
        expect(screen.getByTestId("icon-search")).toHaveStyle({
          color: "#4f9dff",
        }),
      );

      await fireEvent(searchInput(), "blur");

      await waitFor(() =>
        expect(screen.getByTestId("icon-search")).not.toHaveStyle({
          color: "#4f9dff",
        }),
      );
    });
  });

  describe("selection", () => {
    it("calls onChange with the value of the pressed option", async () => {
      const { onChange } = await setup();
      await openSheet();

      await fireEvent.press(screen.getByText("Comédia"));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("21");
    });

    it("closes the sheet after picking an option", async () => {
      await setup();
      await openSheet();

      await fireEvent.press(screen.getByText("Comédia"));

      expect(screen.queryByText("Ação")).not.toBeOnTheScreen();
      expect(screen.queryByPlaceholderText("Search...")).not.toBeOnTheScreen();
    });

    it("marks the selected option as active", async () => {
      await setup({ value: "21" });

      await fireEvent.press(screen.getByText("Comédia"));

      expect(screen.getByTestId("icon-check")).toBeOnTheScreen();
      expect(screen.getByTestId("icon-check")).toHaveProp("color", "#4f9dff");
    });

    it("clears the search when the sheet is reopened", async () => {
      await setup();
      await openSheet();

      await fireEvent.changeText(searchInput(), "com");
      await fireEvent.press(screen.getByText("Comédia"));
      await openSheet();

      expect(searchInput()).toHaveProp("value", "");
      expect(screen.getByText("Ação")).toBeOnTheScreen();
      expect(screen.getByText("Documentários")).toBeOnTheScreen();
    });
  });
});
