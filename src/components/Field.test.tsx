import { render, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";

import Field from "@/components/Field";

describe("Field", () => {
  it("renders the label", async () => {
    await render(
      <Field label="Username">
        <Text>input</Text>
      </Field>,
    );

    expect(screen.getByText("Username")).toBeTruthy();
  });

  it("renders its children", async () => {
    await render(
      <Field label="Password">
        <Text testID="child">secret</Text>
      </Field>,
    );

    expect(screen.getByTestId("child")).toBeTruthy();
  });

  it("renders the label before the children", async () => {
    await render(
      <Field label="Server URL">
        <Text>http://example.com</Text>
      </Field>,
    );

    const texts = screen.getAllByText(/Server URL|http:\/\/example\.com/);

    expect(texts.map((node) => node.props.children)).toEqual([
      "Server URL",
      "http://example.com",
    ]);
  });

  it("renders multiple children", async () => {
    await render(
      <Field label="Categories">
        <Text>Movies</Text>
        <Text>Series</Text>
      </Field>,
    );

    expect(screen.getByText("Movies")).toBeTruthy();
    expect(screen.getByText("Series")).toBeTruthy();
  });

  it("renders without children", async () => {
    await render(<Field label="Empty">{null}</Field>);

    expect(screen.getByText("Empty")).toBeTruthy();
  });

  it("styles the label as dark 14px medium text", async () => {
    await render(
      <Field label="Styled">
        <View />
      </Field>,
    );

    expect(screen.getByText("Styled")).toHaveStyle({
      fontSize: 14,
      fontWeight: "500",
      color: "#1e1e1e",
    });
  });

  it("spaces the label and children apart", async () => {
    await render(
      <Field label="Gap">
        <Text>child</Text>
      </Field>,
    );

    expect(screen.getByText("Gap").parent).toHaveStyle({ gap: 6 });
  });
});
