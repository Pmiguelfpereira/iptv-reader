import { useToastStore } from "@/store/toast";

const show = () => useToastStore.getState().show;
const hide = () => useToastStore.getState().hide;
const current = () => useToastStore.getState().current;

beforeEach(() => {
  useToastStore.setState({ current: null });
});

describe("useToastStore", () => {
  it("starts with no toast", () => {
    expect(current()).toBeNull();
  });

  it("defaults to the info type", () => {
    show()("Loading channels");

    expect(current()).toMatchObject({
      message: "Loading channels",
      type: "info",
    });
  });

  it.each(["info", "success", "error"] as const)(
    "keeps the %s type it was given",
    (type) => {
      show()("message", type);

      expect(current()?.type).toBe(type);
    },
  );

  it("replaces the current toast instead of queueing", () => {
    show()("first");
    const first = current();

    show()("second", "error");
    const second = current();

    expect(second).toMatchObject({ message: "second", type: "error" });
    expect(second?.id).not.toBe(first?.id);
  });

  it("gives every toast a unique id", () => {
    const ids = new Set<number>();

    for (let i = 0; i < 5; i++) {
      show()(`toast ${i}`);
      ids.add(current()!.id);
    }

    expect(ids.size).toBe(5);
  });

  it("hides the current toast when called without an id", () => {
    show()("goodbye");

    hide()();

    expect(current()).toBeNull();
  });

  it("hides the current toast when the id matches", () => {
    show()("goodbye");
    const { id } = current()!;

    hide()(id);

    expect(current()).toBeNull();
  });

  it("ignores hide for a stale id", () => {
    show()("first");
    const stale = current()!.id;
    show()("second");
    const active = current();

    hide()(stale);

    expect(current()).toBe(active);
  });

  it("is a no-op when hiding with nothing shown", () => {
    hide()();
    hide()(123);

    expect(current()).toBeNull();
  });
});
