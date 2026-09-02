import { useContentPaged } from "@/hook/useContent";
import { CatalogType, useSyncStore } from "@/store/sync";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { db } from "../../db";

jest.mock("../../db", () => ({ db: { select: jest.fn() } }));

const selectMock = db.select as unknown as jest.Mock;

const PAGE = 60;

type Row = { id: number; name: string; image: string | null; ext?: string };

type Query = {
  select: unknown;
  table: unknown;
  where: unknown;
  limit: number;
  offset: number;
};

let queries: { query: Query; resolve: (rows: Row[]) => void }[] = [];

function mockDb() {
  selectMock.mockImplementation((select: unknown) => ({
    from: (table: unknown) => ({
      innerJoin: () => ({
        where: (where: unknown) => ({
          orderBy: () => ({
            limit: (limit: number) => ({
              offset: (offset: number) =>
                new Promise<Row[]>((resolve) => {
                  queries.push({
                    query: { select, table, where, limit, offset },
                    resolve,
                  });
                }),
            }),
          }),
        }),
      }),
    }),
  }));
}

// Resolve a última query pendente e deixa o React aplicar o setState
async function respond(rows: Row[]) {
  const pending = queries[queries.length - 1];
  await act(async () => {
    pending.resolve(rows);
  });
}

function rows(count: number, from = 0): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: from + i,
    name: `Item ${from + i}`,
    image: `poster-${from + i}.jpg`,
  }));
}

function paramsOf(condition: unknown, out: unknown[] = []): unknown[] {
  const node = condition as any;
  if (node === null || typeof node !== "object") {
    out.push(node);
    return out;
  }
  if (Array.isArray(node.queryChunks)) {
    node.queryChunks.forEach((chunk: unknown) => paramsOf(chunk, out));
  } else if ("value" in node && !Array.isArray(node.value)) {
    out.push(node.value); // Param
  }
  return out;
}

function whereParams(index = 0) {
  return paramsOf(queries[index].query.where);
}

beforeEach(() => {
  queries = [];
  selectMock.mockReset();
  mockDb();
  useSyncStore.setState({ contentVersions: { live: 0, movie: 0, series: 0 } });
});

describe("useContentPaged", () => {
  it("does not query without a category and without a search query", async () => {
    const { result } = await renderHook(() => useContentPaged("live", null));

    expect(selectMock).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("treats a whitespace-only query as no query", async () => {
    await renderHook(() => useContentPaged("live", null, "   "));

    expect(selectMock).not.toHaveBeenCalled();
  });

  it("loads the first page for the given category", async () => {
    const { result } = await renderHook(() => useContentPaged("live", "10"));

    expect(queries).toHaveLength(1);
    expect(queries[0].query.limit).toBe(PAGE);
    expect(queries[0].query.offset).toBe(0);
    expect(whereParams()).toEqual(expect.arrayContaining(["live", false, 10]));

    await respond(rows(PAGE));

    expect(result.current.items).toHaveLength(PAGE);
    expect(result.current.loading).toBe(false);
  });

  it("is loading while the query is in flight", async () => {
    const { result } = await renderHook(() => useContentPaged("live", "10"));

    await waitFor(() => expect(result.current.loading).toBe(true));

    await respond(rows(1));

    expect(result.current.loading).toBe(false);
  });

  it("maps a live row into a media item without extension", async () => {
    const { result } = await renderHook(() => useContentPaged("live", "10"));

    await respond([{ id: 7, name: "SIC", image: "sic.png" }]);

    expect(result.current.items).toEqual([
      { id: "7", title: "SIC", poster: "sic.png", ext: undefined },
    ]);
  });

  it("keeps the poster null when the row has no image", async () => {
    const { result } = await renderHook(() => useContentPaged("live", "10"));

    await respond([{ id: 7, name: "SIC", image: null }]);

    expect(result.current.items[0].poster).toBeNull();
  });

  it("maps the extension for movies and falls back to an empty string", async () => {
    const { result } = await renderHook(() => useContentPaged("movie", "20"));

    await respond([
      { id: 1, name: "Heat", image: null, ext: "mkv" },
      { id: 2, name: "Alien", image: null, ext: undefined },
    ]);

    expect(result.current.items.map((i) => i.ext)).toEqual(["mkv", ""]);
  });

  it("queries the table of the requested type", async () => {
    await renderHook(() => useContentPaged("series", "30"));
    const seriesTable = queries[0].query.table;

    queries = [];
    await renderHook(() => useContentPaged("movie", "30"));

    expect(queries[0].query.table).not.toBe(seriesTable);
  });

  it("appends the next page and advances the offset", async () => {
    const { result } = await renderHook(() => useContentPaged("live", "10"));
    await respond(rows(PAGE));

    await act(async () => {
      result.current.loadMore();
    });

    expect(queries).toHaveLength(2);
    expect(queries[1].query.offset).toBe(PAGE);

    await respond(rows(30, PAGE));

    expect(result.current.items).toHaveLength(PAGE + 30);
    expect(result.current.items[PAGE].id).toBe(String(PAGE));
  });

  it("stops paging after a page shorter than the page size", async () => {
    const { result } = await renderHook(() => useContentPaged("live", "10"));
    await respond(rows(10));

    await act(async () => {
      result.current.loadMore();
    });

    expect(queries).toHaveLength(1);
    expect(result.current.items).toHaveLength(10);
  });

  it("does not start a second query while one is in flight", async () => {
    const { result } = await renderHook(() => useContentPaged("live", "10"));
    expect(queries).toHaveLength(1);

    await act(async () => {
      result.current.loadMore();
    });

    expect(queries).toHaveLength(1);
  });

  it("searches by name across the type, ignoring the category", async () => {
    await renderHook(() => useContentPaged("movie", null, "bat"));

    expect(queries).toHaveLength(1);
    expect(whereParams()).toEqual(
      expect.arrayContaining(["movie", false, "%bat%"]),
    );
  });

  it("prefers the search query over the selected category", async () => {
    await renderHook(() => useContentPaged("movie", "20", " bat "));

    const params = whereParams();
    expect(params).toContain("%bat%");
    expect(params).not.toContain(20);
  });

  it("resets the items and the offset when the category changes", async () => {
    const { result, rerender } = await renderHook(
      ({ categoryId }: { categoryId: string }) =>
        useContentPaged("live", categoryId),
      { initialProps: { categoryId: "10" } },
    );
    await respond(rows(PAGE));

    await rerender({ categoryId: "11" });

    expect(queries).toHaveLength(2);
    expect(queries[1].query.offset).toBe(0);
    expect(whereParams(1)).toEqual(expect.arrayContaining([11]));
    expect(result.current.items).toEqual([]);

    await respond(rows(5));

    expect(result.current.items).toHaveLength(5);
  });

  it("resets and re-queries when the type changes", async () => {
    const { result, rerender } = await renderHook(
      ({ type }: { type: CatalogType }) => useContentPaged(type, "10"),
      { initialProps: { type: "live" as CatalogType } },
    );
    await respond(rows(3));

    await rerender({ type: "movie" });

    expect(queries).toHaveLength(2);
    expect(whereParams(1)).toEqual(expect.arrayContaining(["movie"]));
    expect(result.current.items).toEqual([]);
  });

  it("resets and re-queries when the search query changes", async () => {
    const { result, rerender } = await renderHook(
      ({ query }: { query: string }) => useContentPaged("movie", null, query),
      { initialProps: { query: "bat" } },
    );
    await respond(rows(3));

    await rerender({ query: "man" });

    expect(queries).toHaveLength(2);
    expect(whereParams(1)).toContain("%man%");
    expect(result.current.items).toEqual([]);
  });

  it("does not re-query when only the untrimmed part of the query changes", async () => {
    const { rerender } = await renderHook(
      ({ query }: { query: string }) => useContentPaged("movie", null, query),
      { initialProps: { query: "bat" } },
    );
    await respond(rows(3));

    await rerender({ query: "  bat  " });

    expect(queries).toHaveLength(1);
  });

  it("re-queries when the content version for its type is bumped", async () => {
    const { result } = await renderHook(() => useContentPaged("live", "10"));
    await respond(rows(3));

    await act(async () => {
      useSyncStore.getState().bumpContent("live");
    });

    expect(queries).toHaveLength(2);
    expect(queries[1].query.offset).toBe(0);
    expect(result.current.items).toEqual([]);

    await respond(rows(4));

    expect(result.current.items).toHaveLength(4);
  });

  it("ignores a bump for another type", async () => {
    const { result } = await renderHook(() => useContentPaged("live", "10"));
    await respond(rows(3));

    await act(async () => {
      useSyncStore.getState().bumpContent("movie");
    });

    expect(queries).toHaveLength(1);
    expect(result.current.items).toHaveLength(3);
  });

  it("clears the items when the category is deselected", async () => {
    const { result, rerender } = await renderHook(
      ({ categoryId }: { categoryId: string | null }) =>
        useContentPaged("live", categoryId),
      { initialProps: { categoryId: "10" as string | null } },
    );
    await respond(rows(3));

    await rerender({ categoryId: null });

    expect(queries).toHaveLength(1);
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});
