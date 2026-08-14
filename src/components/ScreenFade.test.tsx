import { ScreenFade } from "@/components/ScreenFade";
import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

// O reanimated real precisa dos módulos nativos — basta uma View que
// exponha o `entering` e um FadeIn que guarde a duração pedida
jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: {
      View: (props: Record<string, unknown>) => (
        <View testID="screen-fade" {...props} />
      ),
    },
    FadeIn: {
      duration: (duration: number) => ({ animation: "FadeIn", duration }),
    },
  };
});

describe("ScreenFade", () => {
  it("renders its children", async () => {
    await render(
      <ScreenFade>
        <Text>Conteúdo</Text>
      </ScreenFade>,
    );

    expect(screen.getByText("Conteúdo")).toBeOnTheScreen();
  });

  it("fills the available space", async () => {
    await render(
      <ScreenFade>
        <Text>Conteúdo</Text>
      </ScreenFade>,
    );

    expect(screen.getByTestId("screen-fade")).toHaveStyle({ flex: 1 });
  });

  it("merges the given style with the default one", async () => {
    await render(
      <ScreenFade style={{ backgroundColor: "#000" }}>
        <Text>Conteúdo</Text>
      </ScreenFade>,
    );

    expect(screen.getByTestId("screen-fade")).toHaveStyle({
      flex: 1,
      backgroundColor: "#000",
    });
  });

  it("lets the given style override the default one", async () => {
    await render(
      <ScreenFade style={{ flex: 2 }}>
        <Text>Conteúdo</Text>
      </ScreenFade>,
    );

    expect(screen.getByTestId("screen-fade")).toHaveStyle({ flex: 2 });
  });

  it("fades in with the default duration", async () => {
    await render(
      <ScreenFade>
        <Text>Conteúdo</Text>
      </ScreenFade>,
    );

    expect(screen.getByTestId("screen-fade")).toHaveProp("entering", {
      animation: "FadeIn",
      duration: 180,
    });
  });

  it("fades in with the given duration", async () => {
    await render(
      <ScreenFade duration={500}>
        <Text>Conteúdo</Text>
      </ScreenFade>,
    );

    expect(screen.getByTestId("screen-fade")).toHaveProp("entering", {
      animation: "FadeIn",
      duration: 500,
    });
  });
});
