import { Category } from "@/components/CategoryRow";
import { useCategorySync } from "@/hook/useCategorySync";
import { XtreamClient } from "@/lib/xtream";
import { useAccountStore } from "@/store/account";
import { CatalogType, useSyncStore } from "@/store/sync";
import { useSyncQueue } from "@/store/syncQueue";
import { useToastStore } from "@/store/toast";
import { logger } from "@/utils/logger";
import { act, renderHook } from "@testing-library/react-native";
import { db } from "../../db";
import { categories, movies, series, tv } from "../../db/schema";

jest.mock("../../db", () => ({
  db: { transaction: jest.fn(), update: jest.fn() },
}));

jest.mock("@/utils/logger", () => ({
  logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const transactionMock = db.transaction as unknown as jest.Mock;
const updateMock = db.update as unknown as jest.Mock;

// --- escritas registadas pelos mocks da db -------------------------------

type Write = { table: unknown; arg: unknown };

let deletes: Write[];
let inserts: Write[];
let updates: { table: unknown; values: unknown; where: unknown }[];

// eq(coluna, valor) guarda o valor num Param dos queryChunks — os outros
// chunks são StringChunk, cujo value é um array.
function paramOf(condition: unknown): unknown {
  return (condition as any)?.queryChunks?.find(
    (c: any) =>
      c && typeof c === "object" && "value" in c && !Array.isArray(c.value),
  )?.value;
}

function mockDb() {
  deletes = [];
  inserts = [];
  updates = [];

  transactionMock.mockImplementation(async (cb: (tx: unknown) => unknown) => {
    const tx = {
      delete: (table: unknown) => ({
        where: async (condition: unknown) => {
          deletes.push({ table, arg: paramOf(condition) });
        },
      }),
      insert: (table: unknown) => ({
        values: async (values: unknown) => {
          inserts.push({ table, arg: values });
        },
      }),
    };
    return cb(tx);
  });

  updateMock.mockImplementation((table: unknown) => ({
    set: (values: unknown) => ({
      where: async (condition: unknown) => {
        updates.push({ table, values, where: paramOf(condition) });
      },
    }),
  }));
}

// --- fila de sync --------------------------------------------------------

// A fila real é global e limitada a 2 slots; aqui interessa só que a tarefa
// corre e sob que chave, por isso corre-se logo (fire and forget, como o hook).
let enqueued: string[];

function mockQueue() {
  enqueued = [];
  useSyncQueue.setState({
    enqueue: (key, fn) => {
      enqueued.push(key);
      void fn();
    },
  });
}

// --- cliente Xtream -----------------------------------------------------

type ClientMocks = {
  getLiveCategories: jest.Mock;
  getLiveStreams: jest.Mock;
  getVodCategories: jest.Mock;
  getVodStreams: jest.Mock;
  getSeriesCategories: jest.Mock;
  getSeries: jest.Mock;
};

function mockClient(): ClientMocks {
  const client: ClientMocks = {
    getLiveCategories: jest.fn().mockResolvedValue([]),
    getLiveStreams: jest.fn().mockResolvedValue([]),
    getVodCategories: jest.fn().mockResolvedValue([]),
    getVodStreams: jest.fn().mockResolvedValue([]),
    getSeriesCategories: jest.fn().mockResolvedValue([]),
    getSeries: jest.fn().mockResolvedValue([]),
  };
  useAccountStore.setState({ client: client as unknown as XtreamClient });
  return client;
}

// --- helpers ------------------------------------------------------------

const flush = () => new Promise<void>((r) => setImmediate(r));

const visible: Category = {
  id: 1,
  categoryId: 10,
  name: "Desporto",
  type: "live",
  hidden: false,
};
const hidden: Category = { ...visible, id: 2, categoryId: 11, hidden: true };

const liveStream = (stream_id: number) => ({
  num: stream_id,
  name: `Canal ${stream_id}`,
  stream_type: "live" as const,
  stream_id,
  stream_icon: `icon-${stream_id}`,
  category_id: "10",
});

const vodStream = (stream_id: number) => ({
  ...liveStream(stream_id),
  stream_type: "movie" as const,
  container_extension: "mkv",
});

const serie = (series_id: number) => ({
  num: series_id,
  name: `Série ${series_id}`,
  series_id,
  cover: `cover-${series_id}`,
  category_id: "10",
});

let setHidden: jest.Mock;
let toastShow: jest.Mock;

// renderHook é assíncrono nesta versão do testing-library
async function render(type: CatalogType = "live") {
  return renderHook(() => useCategorySync(type, setHidden));
}

/** Corre a callback e deixa a tarefa da fila (e as writes) assentar. */
async function run(fn: () => void) {
  await act(async () => {
    fn();
    await flush();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setHidden = jest.fn();
  toastShow = jest.fn();
  mockDb();
  mockQueue();
  mockClient();
  useToastStore.setState({ show: toastShow });
  useSyncStore.setState({
    categoryVersions: { live: 0, movie: 0, series: 0 },
    contentVersions: { live: 0, movie: 0, series: 0 },
  });
});

describe("useCategorySync - syncCategories", () => {
  it("enqueues under a key scoped to the type", async () => {
    const { result } = await render("movie");

    await run(() => result.current.syncCategories());

    expect(enqueued).toEqual(["movie:cats"]);
  });

  it("replaces the categories of its own type", async () => {
    const client = mockClient();
    client.getLiveCategories.mockResolvedValue([
      { category_id: "10", category_name: "Desporto", parent_id: 0 },
      { category_id: "11", category_name: "Notícias", parent_id: 0 },
    ]);
    const { result } = await render("live");

    await run(() => result.current.syncCategories());

    expect(deletes).toEqual([{ table: categories, arg: "live" }]);
    expect(inserts).toEqual([
      {
        table: categories,
        arg: [
          { categoryId: 10, name: "Desporto", type: "live" },
          { categoryId: 11, name: "Notícias", type: "live" },
        ],
      },
    ]);
  });

  it("asks the client for the categories of the given type", async () => {
    const client = mockClient();

    const { result } = await render("series");

    await run(() => result.current.syncCategories());

    expect(client.getSeriesCategories).toHaveBeenCalledTimes(1);
    expect(client.getLiveCategories).not.toHaveBeenCalled();
    expect(client.getVodCategories).not.toHaveBeenCalled();
  });

  it("deletes but does not insert when the API returns nothing", async () => {
    const client = mockClient();
    client.getLiveCategories.mockResolvedValue(null);
    const { result } = await render("live");

    await run(() => result.current.syncCategories());

    expect(deletes).toHaveLength(1);
    expect(inserts).toEqual([]);
  });

  it("bumps the category version and reports success", async () => {
    const { result } = await render("live");

    await run(() => result.current.syncCategories());

    expect(useSyncStore.getState().categoryVersions.live).toBe(1);
    expect(toastShow).toHaveBeenCalledWith("Sync live", "success");
  });

  it("does nothing without an account client", async () => {
    useAccountStore.setState({ client: null });
    const { result } = await render("live");

    await run(() => result.current.syncCategories());

    expect(transactionMock).not.toHaveBeenCalled();
    expect(toastShow).not.toHaveBeenCalled();
    expect(useSyncStore.getState().categoryVersions.live).toBe(0);
  });

  it("reports a failure without bumping the version", async () => {
    const client = mockClient();
    const boom = new Error("network down");
    client.getLiveCategories.mockRejectedValue(boom);
    const { result } = await render("live");

    await run(() => result.current.syncCategories());

    expect(toastShow).toHaveBeenCalledWith("Failed live", "error");
    expect(logger.error).toHaveBeenCalledWith("Failed live", boom);
    expect(useSyncStore.getState().categoryVersions.live).toBe(0);
  });
});

describe("useCategorySync - onRowPress on a visible category", () => {
  it("enqueues under a key scoped to type and category", async () => {
    const { result } = await render("live");

    await run(() => result.current.onRowPress(visible));

    expect(enqueued).toEqual(["live:cat:10"]);
  });

  it("replaces the streams of that category only", async () => {
    const client = mockClient();
    client.getLiveStreams.mockResolvedValue([liveStream(1), liveStream(2)]);
    const { result } = await render("live");

    await run(() => result.current.onRowPress(visible));

    expect(client.getLiveStreams).toHaveBeenCalledWith("10");
    expect(deletes).toEqual([{ table: tv, arg: 10 }]);
    expect(inserts).toEqual([
      {
        table: tv,
        arg: [
          { tvId: 1, name: "Canal 1", image: "icon-1", categoryId: 10 },
          { tvId: 2, name: "Canal 2", image: "icon-2", categoryId: 10 },
        ],
      },
    ]);
  });

  it("maps a vod stream with its container extension", async () => {
    const client = mockClient();
    client.getVodStreams.mockResolvedValue([vodStream(7)]);
    const { result } = await render("movie");

    await run(() => result.current.onRowPress({ ...visible, type: "movie" }));

    expect(inserts).toEqual([
      {
        table: movies,
        arg: [
          {
            movieId: 7,
            name: "Canal 7",
            image: "icon-7",
            categoryId: 10,
            containerExtension: "mkv",
          },
        ],
      },
    ]);
  });

  it("maps a series with its cover as the image", async () => {
    const client = mockClient();
    client.getSeries.mockResolvedValue([serie(5)]);
    const { result } = await render("series");

    await run(() => result.current.onRowPress({ ...visible, type: "series" }));

    expect(inserts).toEqual([
      {
        table: series,
        arg: [
          { serieId: 5, name: "Série 5", image: "cover-5", categoryId: 10 },
        ],
      },
    ]);
  });

  it("inserts in chunks of 400", async () => {
    const client = mockClient();
    const streams = Array.from({ length: 901 }, (_, i) => liveStream(i + 1));
    client.getLiveStreams.mockResolvedValue(streams);
    const { result } = await render("live");

    await run(() => result.current.onRowPress(visible));

    expect(inserts.map((i) => (i.arg as unknown[]).length)).toEqual([
      400, 400, 101,
    ]);
  });

  it("deletes but does not insert when the category has no streams", async () => {
    const client = mockClient();
    client.getLiveStreams.mockResolvedValue([]);
    const { result } = await render("live");

    await run(() => result.current.onRowPress(visible));

    expect(deletes).toHaveLength(1);
    expect(inserts).toEqual([]);
  });

  it("bumps the content version and reports success", async () => {
    const { result } = await render("live");

    await run(() => result.current.onRowPress(visible));

    expect(useSyncStore.getState().contentVersions.live).toBe(1);
    expect(useSyncStore.getState().categoryVersions.live).toBe(0);
    expect(toastShow).toHaveBeenCalledWith("Sync live - 10", "success");
  });

  it("does not touch the db without an account client", async () => {
    useAccountStore.setState({ client: null });
    const { result } = await render("live");

    await run(() => result.current.onRowPress(visible));

    expect(transactionMock).not.toHaveBeenCalled();
    expect(toastShow).not.toHaveBeenCalled();
  });

  it("reports a failure for that category", async () => {
    const client = mockClient();
    const boom = new Error("timeout");
    client.getLiveStreams.mockRejectedValue(boom);
    const { result } = await render("live");

    await run(() => result.current.onRowPress(visible));

    expect(toastShow).toHaveBeenCalledWith("Failed live - 10", "error");
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to fetch/insert",
      10,
      boom,
    );
  });

  it("leaves the hidden flag alone", async () => {
    const { result } = await render("live");

    await run(() => result.current.onRowPress(visible));

    expect(setHidden).not.toHaveBeenCalled();
    expect(updates).toEqual([]);
  });
});

describe("useCategorySync - onRowPress on a hidden category", () => {
  it("unhides it in the local state and in the db", async () => {
    const { result } = await render("live");

    await run(() => result.current.onRowPress(hidden));

    expect(setHidden).toHaveBeenCalledWith(11, false);
    expect(updates).toEqual([
      { table: categories, values: { hidden: false }, where: 11 },
    ]);
  });

  it("fetches the content it was missing", async () => {
    const client = mockClient();
    client.getLiveStreams.mockResolvedValue([liveStream(1)]);
    const { result } = await render("live");

    await run(() => result.current.onRowPress(hidden));

    expect(enqueued).toEqual(["live:cat:11"]);
    expect(client.getLiveStreams).toHaveBeenCalledWith("11");
    expect(inserts).toEqual([
      {
        table: tv,
        arg: [{ tvId: 1, name: "Canal 1", image: "icon-1", categoryId: 11 }],
      },
    ]);
  });

  it("bumps both versions so lists and rows refresh", async () => {
    const { result } = await render("live");

    await run(() => result.current.onRowPress(hidden));

    expect(useSyncStore.getState().contentVersions.live).toBe(1);
    expect(useSyncStore.getState().categoryVersions.live).toBe(1);
  });
});

describe("useCategorySync - onRowLongPress", () => {
  it("hides a visible category without fetching anything", async () => {
    const client = mockClient();
    const { result } = await render("live");

    await run(() => result.current.onRowLongPress(visible));

    expect(setHidden).toHaveBeenCalledWith(10, true);
    expect(updates).toEqual([
      { table: categories, values: { hidden: true }, where: 10 },
    ]);
    expect(enqueued).toEqual([]);
    expect(client.getLiveStreams).not.toHaveBeenCalled();
    expect(useSyncStore.getState().contentVersions.live).toBe(0);
    expect(useSyncStore.getState().categoryVersions.live).toBe(0);
  });

  it("unhides a hidden category and syncs it", async () => {
    const { result } = await render("live");

    await run(() => result.current.onRowLongPress(hidden));

    expect(setHidden).toHaveBeenCalledWith(11, false);
    expect(enqueued).toEqual(["live:cat:11"]);
  });
});
