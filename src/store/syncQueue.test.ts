type SyncQueue = typeof import("@/store/syncQueue").useSyncQueue;

// The queue and its slot counter live at module scope, so every test needs a
// fresh copy of the module to start from an empty queue.
const load = (): SyncQueue => {
  let store!: SyncQueue;
  jest.isolateModules(() => {
    store = require("@/store/syncQueue").useSyncQueue;
  });
  return store;
};

const deferred = () => {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

/** Lets every pending microtask (and thus the queue's drain) settle. */
const flush = () => new Promise<void>((r) => setImmediate(r));

describe("useSyncQueue", () => {
  let useSyncQueue: SyncQueue;

  const enqueue = () => useSyncQueue.getState().enqueue;
  const running = () => useSyncQueue.getState().running;

  beforeEach(() => {
    useSyncQueue = load();
  });

  it("starts with nothing running", () => {
    expect(running().size).toBe(0);
  });

  it("runs the task it is given", async () => {
    const fn = jest.fn().mockResolvedValue(undefined);

    enqueue()("live", fn);
    await flush();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("marks the key as running as soon as the task starts", () => {
    const task = deferred();

    enqueue()("live", () => task.promise);

    expect(running().has("live")).toBe(true);
  });

  it("clears the key once the task resolves", async () => {
    const task = deferred();
    enqueue()("live", () => task.promise);

    task.resolve();
    await flush();

    expect(running().has("live")).toBe(false);
  });

  it("ignores a key that is already running", async () => {
    const task = deferred();
    const second = jest.fn().mockResolvedValue(undefined);

    enqueue()("live", () => task.promise);
    enqueue()("live", second);
    task.resolve();
    await flush();

    expect(second).not.toHaveBeenCalled();
  });

  it("accepts the same key again after it finished", async () => {
    const first = deferred();
    const second = jest.fn().mockResolvedValue(undefined);

    enqueue()("live", () => first.promise);
    first.resolve();
    await flush();
    enqueue()("live", second);
    await flush();

    expect(second).toHaveBeenCalledTimes(1);
  });

  it("runs at most two tasks at a time", async () => {
    const tasks = [deferred(), deferred(), deferred()];
    const fns = tasks.map((t) => jest.fn(() => t.promise));

    fns.forEach((fn, i) => enqueue()(`key-${i}`, fn));
    await flush();

    expect(fns[0]).toHaveBeenCalled();
    expect(fns[1]).toHaveBeenCalled();
    expect(fns[2]).not.toHaveBeenCalled();
    expect(running()).toEqual(new Set(["key-0", "key-1"]));
  });

  it("starts the next task when a slot frees up", async () => {
    const tasks = [deferred(), deferred(), deferred()];
    const fns = tasks.map((t) => jest.fn(() => t.promise));
    fns.forEach((fn, i) => enqueue()(`key-${i}`, fn));
    await flush();

    tasks[0].resolve();
    await flush();

    expect(fns[2]).toHaveBeenCalledTimes(1);
    expect(running()).toEqual(new Set(["key-1", "key-2"]));
  });

  it("drains the whole backlog in order", async () => {
    const order: string[] = [];
    const keys = ["a", "b", "c", "d", "e"];

    keys.forEach((key) =>
      enqueue()(key, async () => {
        order.push(key);
      }),
    );
    await flush();

    expect(order).toEqual(keys);
    expect(running().size).toBe(0);
  });

  it("keeps draining after a task rejects", async () => {
    const failing = deferred();
    const later = jest.fn().mockResolvedValue(undefined);
    enqueue()("bad", () => failing.promise);
    enqueue()("busy", () => deferred().promise);
    enqueue()("next", later);

    failing.reject(new Error("network down"));
    await flush();

    expect(running().has("bad")).toBe(false);
    expect(later).toHaveBeenCalledTimes(1);
  });

  it("replaces the running set instead of mutating it", () => {
    const before = running();

    enqueue()("live", () => deferred().promise);

    expect(running()).not.toBe(before);
    expect(before.size).toBe(0);
  });

  it("notifies subscribers when a key starts and stops", async () => {
    const listener = jest.fn();
    const task = deferred();
    useSyncQueue.subscribe(listener);

    enqueue()("live", () => task.promise);
    task.resolve();
    await flush();

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("does not dedupe a key that is still waiting for a slot", async () => {
    const blockers = [deferred(), deferred()];
    const queued = jest.fn().mockResolvedValue(undefined);
    blockers.forEach((b, i) => enqueue()(`blocker-${i}`, () => b.promise));

    enqueue()("live", queued);
    enqueue()("live", queued);
    blockers.forEach((b) => b.resolve());
    await flush();

    expect(queued).toHaveBeenCalledTimes(2);
  });
});
