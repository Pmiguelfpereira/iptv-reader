import useCategories from "@/hook/useCategories";
import { CatalogType, useSyncStore } from "@/store/sync";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { db } from "../../db";
import { categories } from "../../db/schema";

jest.mock("../../db", () => ({ db: { select: jest.fn() } }));

const selectMock = db.select as unknown as jest.Mock;

type Category = typeof categories.$inferSelect;

const LIVE: Category[] = [
  { id: 1, categoryId: 10, name: "Desporto", type: "live", hidden: false },
  { id: 2, categoryId: 11, name: "Notícias", type: "live", hidden: true },
];

const MOVIE: Category[] = [
  { id: 3, categoryId: 20, name: "Ação", type: "movie", hidden: false },
];

// eq(categories.type, type) guarda o tipo num Param dos queryChunks
function typeOf(condition: unknown): CatalogType | undefined {
  return (condition as any)?.queryChunks?.find(
    (c: any) => typeof c?.value === "string",
  )?.value;
}

// db.select().from().where().orderBy() é thenable — o hook usa .then() diretamente
function mockRowsByType(rowsByType: Partial<Record<CatalogType, Category[]>>) {
  selectMock.mockImplementation(() => ({
    from: () => ({
      where: (condition: unknown) => ({
        orderBy: () => Promise.resolve(rowsByType[typeOf(condition)!] ?? []),
      }),
    }),
  }));
}

// Igual, mas cada query fica pendente até ser resolvida à mão
function mockPendingQueries() {
  const pending: ((rows: Category[]) => void)[] = [];
  selectMock.mockImplementation(() => ({
    from: () => ({
      where: () => ({
        orderBy: () =>
          new Promise<Category[]>((resolve) => {
            pending.push(resolve);
          }),
      }),
    }),
  }));
  return pending;
}

beforeEach(() => {
  selectMock.mockReset();
  useSyncStore.setState({
    categoryVersions: { live: 0, movie: 0, series: 0 },
  });
});

describe("useCategories", () => {
  it("starts empty before the query resolves", async () => {
    mockPendingQueries();

    const { result } = await renderHook(() => useCategories("live"));

    expect(result.current.data).toEqual([]);
  });

  it("loads the categories for the given type", async () => {
    mockRowsByType({ live: LIVE, movie: MOVIE });

    const { result } = await renderHook(() => useCategories("live"));

    await waitFor(() => expect(result.current.data).toEqual(LIVE));
  });

  it("re-queries when the type changes", async () => {
    mockRowsByType({ live: LIVE, movie: MOVIE });

    const { result, rerender } = await renderHook(
      ({ type }: { type: CatalogType }) => useCategories(type),
      { initialProps: { type: "live" as CatalogType } },
    );
    await waitFor(() => expect(result.current.data).toEqual(LIVE));

    await rerender({ type: "movie" });

    await waitFor(() => expect(result.current.data).toEqual(MOVIE));
  });

  it("re-queries when the category version for its type is bumped", async () => {
    mockRowsByType({ live: LIVE });

    const { result } = await renderHook(() => useCategories("live"));
    await waitFor(() => expect(result.current.data).toEqual(LIVE));
    expect(selectMock).toHaveBeenCalledTimes(1);

    mockRowsByType({ live: [...LIVE, ...MOVIE] });
    await act(async () => {
      useSyncStore.getState().bumpCategories("live");
    });

    await waitFor(() => expect(result.current.data).toHaveLength(3));
  });

  it("ignores a bump for another type", async () => {
    mockRowsByType({ live: LIVE });

    const { result } = await renderHook(() => useCategories("live"));
    await waitFor(() => expect(result.current.data).toEqual(LIVE));

    await act(async () => {
      useSyncStore.getState().bumpCategories("movie");
    });

    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(LIVE);
  });

  it("ignores a query that resolves after the type changed", async () => {
    const pending = mockPendingQueries();

    const { result, rerender } = await renderHook(
      ({ type }: { type: CatalogType }) => useCategories(type),
      { initialProps: { type: "live" as CatalogType } },
    );
    await rerender({ type: "movie" });
    expect(pending).toHaveLength(2);

    await act(async () => {
      pending[1](MOVIE); // query atual
      pending[0](LIVE); // query cancelada, a chegar tarde
    });

    expect(result.current.data).toEqual(MOVIE);
  });

  it("toggles hidden for a single category", async () => {
    mockRowsByType({ live: LIVE });

    const { result } = await renderHook(() => useCategories("live"));
    await waitFor(() => expect(result.current.data).toEqual(LIVE));

    await act(async () => {
      result.current.setHidden(10, true);
    });

    expect(result.current.data).toEqual([
      { ...LIVE[0], hidden: true },
      LIVE[1],
    ]);
  });

  it("leaves the data untouched for an unknown category id", async () => {
    mockRowsByType({ live: LIVE });

    const { result } = await renderHook(() => useCategories("live"));
    await waitFor(() => expect(result.current.data).toEqual(LIVE));
    const before = result.current.data;

    await act(async () => {
      result.current.setHidden(999, true);
    });

    expect(result.current.data).toEqual(before);
  });

  it("keeps setHidden stable across renders", async () => {
    mockRowsByType({ live: LIVE });

    const { result, rerender } = await renderHook(() => useCategories("live"));
    const first = result.current.setHidden;
    await waitFor(() => expect(result.current.data).toEqual(LIVE));

    await rerender(undefined);

    expect(result.current.setHidden).toBe(first);
  });
});
