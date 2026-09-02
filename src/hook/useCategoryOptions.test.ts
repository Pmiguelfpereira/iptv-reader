import { useCategoryOptions } from "@/hook/useCategoryOptions";
import { CatalogType, useSyncStore } from "@/store/sync";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { db } from "../../db";
import { categories } from "../../db/schema";

jest.mock("../../db", () => ({ db: { select: jest.fn() } }));

const selectMock = db.select as unknown as jest.Mock;

type Category = typeof categories.$inferSelect;

const LIVE: Category[] = [
  { id: 1, categoryId: 10, name: "Desporto", type: "live", hidden: false },
  { id: 2, categoryId: 11, name: "Notícias", type: "live", hidden: false },
];

const MOVIE: Category[] = [
  { id: 3, categoryId: 20, name: "Ação", type: "movie", hidden: false },
];

let queries: { where: unknown; resolve: (rows: Category[]) => void }[] = [];

function mockDb() {
  selectMock.mockImplementation(() => ({
    from: () => ({
      where: (where: unknown) => ({
        orderBy: () =>
          new Promise<Category[]>((resolve) => {
            queries.push({ where, resolve });
          }),
      }),
    }),
  }));
}

async function respond(rows: Category[], index = queries.length - 1) {
  await act(async () => {
    queries[index].resolve(rows);
  });
}

function paramsOf(condition: unknown, out: unknown[] = []): unknown[] {
  const node = condition as any;
  if (node === null || typeof node !== "object") return out;
  if (Array.isArray(node.queryChunks)) {
    node.queryChunks.forEach((chunk: unknown) => paramsOf(chunk, out));
  } else if ("value" in node && !Array.isArray(node.value)) {
    out.push(node.value); // Param
  }
  return out;
}

function whereParams(index = 0) {
  return paramsOf(queries[index].where);
}

beforeEach(() => {
  queries = [];
  selectMock.mockReset();
  mockDb();
  useSyncStore.setState({
    categoryVersions: { live: 0, movie: 0, series: 0 },
  });
});

describe("useCategoryOptions", () => {
  it("starts empty before the query resolves", async () => {
    const { result } = await renderHook(() => useCategoryOptions("live"));

    expect(result.current).toEqual([]);
  });

  it("queries the visible categories of the given type", async () => {
    await renderHook(() => useCategoryOptions("live"));

    expect(queries).toHaveLength(1);
    expect(whereParams()).toEqual(expect.arrayContaining(["live", false]));
  });

  it("maps each category into a select option", async () => {
    const { result } = await renderHook(() => useCategoryOptions("live"));

    await respond(LIVE);

    expect(result.current).toEqual([
      { label: "Desporto", value: "10" },
      { label: "Notícias", value: "11" },
    ]);
  });

  it("stays empty when there are no categories", async () => {
    const { result } = await renderHook(() => useCategoryOptions("live"));

    await respond([]);

    expect(result.current).toEqual([]);
  });

  it("tolerates a query that resolves without rows", async () => {
    const { result } = await renderHook(() => useCategoryOptions("live"));

    await respond(undefined as unknown as Category[]);

    expect(result.current).toEqual([]);
  });

  it("re-queries when the type changes", async () => {
    const { result, rerender } = await renderHook(
      ({ type }: { type: CatalogType }) => useCategoryOptions(type),
      { initialProps: { type: "live" as CatalogType } },
    );
    await respond(LIVE);

    await rerender({ type: "movie" });

    expect(queries).toHaveLength(2);
    expect(whereParams(1)).toEqual(expect.arrayContaining(["movie", false]));

    await respond(MOVIE);

    expect(result.current).toEqual([{ label: "Ação", value: "20" }]);
  });

  it("re-queries when the category version for its type is bumped", async () => {
    const { result } = await renderHook(() => useCategoryOptions("live"));
    await respond(LIVE);

    await act(async () => {
      useSyncStore.getState().bumpCategories("live");
    });

    expect(queries).toHaveLength(2);

    await respond([...LIVE, ...MOVIE]);

    expect(result.current).toHaveLength(3);
  });

  it("ignores a bump for another type", async () => {
    const { result } = await renderHook(() => useCategoryOptions("live"));
    await respond(LIVE);

    await act(async () => {
      useSyncStore.getState().bumpCategories("movie");
    });

    expect(queries).toHaveLength(1);
    expect(result.current).toHaveLength(2);
  });

  it("ignores a query that resolves after the type changed", async () => {
    const { result, rerender } = await renderHook(
      ({ type }: { type: CatalogType }) => useCategoryOptions(type),
      { initialProps: { type: "live" as CatalogType } },
    );
    await rerender({ type: "movie" });
    expect(queries).toHaveLength(2);

    await respond(MOVIE, 1);
    await respond(LIVE, 0);

    expect(result.current).toEqual([{ label: "Ação", value: "20" }]);
  });

  it("does not re-query on an unrelated re-render", async () => {
    const { rerender } = await renderHook(() => useCategoryOptions("live"));
    await respond(LIVE);

    await rerender(undefined);

    expect(queries).toHaveLength(1);
  });
});
