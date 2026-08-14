import { usePlayInVlc } from "@/hook/usePlayInVlc";
import { useToastStore } from "@/store/toast";
import { playInVlc } from "@/utils/vlc";
import { act, renderHook } from "@testing-library/react-native";

jest.mock("@/utils/vlc", () => ({ playInVlc: jest.fn() }));

const playInVlcMock = playInVlc as jest.Mock;
const current = () => useToastStore.getState().current;

beforeEach(() => {
  playInVlcMock.mockClear();
  useToastStore.setState({ current: null });
});

describe("usePlayInVlc", () => {
  it("opens the stream in VLC with the url and title", async () => {
    const { result } = await renderHook(() => usePlayInVlc());

    await act(() =>
      result.current?.("http://example.com/live/1.m3u8", "Canal 1"),
    );

    expect(playInVlcMock).toHaveBeenCalledWith(
      "http://example.com/live/1.m3u8",
      "Canal 1",
    );
    expect(current()).toBeNull();
  });

  it("shows an error toast and does not open VLC without a url", async () => {
    const { result } = await renderHook(() => usePlayInVlc());

    await act(() => result.current?.("", "Canal 1"));

    expect(playInVlcMock).not.toHaveBeenCalled();
    expect(current()).toMatchObject({
      message: "Stream indisponível",
      type: "error",
    });
  });

  it("keeps the same callback across renders", async () => {
    const { result, rerender } = await renderHook(() => usePlayInVlc());
    const first = result.current;
    expect(typeof first).toBe("function");

    await rerender({});

    expect(result.current).toBe(first);
  });

  it("plays every time it is called", async () => {
    const { result } = await renderHook(() => usePlayInVlc());

    await act(() => {
      result.current?.("http://example.com/a.ts", "A");
      result.current?.("http://example.com/b.ts", "B");
    });

    expect(playInVlcMock).toHaveBeenCalledTimes(2);
    expect(playInVlcMock).toHaveBeenLastCalledWith(
      "http://example.com/b.ts",
      "B",
    );
  });
});
