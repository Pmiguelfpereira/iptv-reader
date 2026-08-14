import { ToastHost } from "@/components/ToastHost";
import { ToastType, useToastStore } from "@/store/toast";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

const show = (message: string, type?: ToastType) =>
  act(async () => {
    useToastStore.getState().show(message, type);
  });

const current = () => useToastStore.getState().current;

// A saída faz um fade de 200ms antes de limpar o toast
const FADE_OUT = 200;

const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

beforeEach(() => {
  jest.useFakeTimers();
  useToastStore.setState({ current: null });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("ToastHost", () => {
  it("renders nothing while there is no toast", async () => {
    await render(<ToastHost />);

    expect(screen.toJSON()).toBeNull();
  });

  it("renders the message of the current toast", async () => {
    await render(<ToastHost />);

    await show("Canais atualizados");

    expect(screen.getByText("Canais atualizados")).toBeOnTheScreen();
  });

  it("swaps the message when another toast replaces the current one", async () => {
    await render(<ToastHost />);

    await show("primeiro");
    await show("segundo");

    expect(screen.queryByText("primeiro")).not.toBeOnTheScreen();
    expect(screen.getByText("segundo")).toBeOnTheScreen();
  });

  it.each([
    ["info", "#334155"],
    ["success", "#15803d"],
    ["error", "#b91c1c"],
  ] as const)("paints the %s toast with its color", async (type, color) => {
    await render(<ToastHost />);

    await show("mensagem", type);

    expect(screen.root).toHaveStyle({ backgroundColor: color });
  });

  it("hides the toast after the default duration", async () => {
    await render(<ToastHost />);

    await show("Canais atualizados");

    await advance(3000 - 1);
    expect(current()).not.toBeNull();

    await advance(1 + FADE_OUT);
    expect(current()).toBeNull();
    expect(screen.toJSON()).toBeNull();
  });

  it("hides the toast after the given duration", async () => {
    await render(<ToastHost duration={500} />);

    await show("Canais atualizados");

    await advance(500 - 1);
    expect(current()).not.toBeNull();

    await advance(1 + FADE_OUT);
    expect(current()).toBeNull();
  });

  it("hides the toast when it is pressed", async () => {
    await render(<ToastHost />);

    await show("Canais atualizados");

    const toast = screen.getByText("Canais atualizados");
    await act(async () => {
      fireEvent.press(toast);
    });

    expect(current()).toBeNull();
    expect(screen.toJSON()).toBeNull();
  });

  it("restarts the countdown for a toast shown while another is visible", async () => {
    await render(<ToastHost duration={1000} />);

    await show("primeiro");
    await advance(900);

    await show("segundo");
    await advance(900);

    // O temporizador do primeiro já não pode apagar o segundo
    expect(current()).toMatchObject({ message: "segundo" });

    await advance(100 + FADE_OUT);
    expect(current()).toBeNull();
  });

  it("does not hide a newer toast with the timer of the unmounted host", async () => {
    const view = await render(<ToastHost duration={1000} />);

    await show("primeiro");
    await view.unmount();

    await show("segundo");
    await advance(1000 + FADE_OUT);

    expect(current()).toMatchObject({ message: "segundo" });
  });
});
