import { CatalogType, useSyncStore } from "@/store/sync";

const types = ["live", "movie", "series"] as const;

const bumpCategories = () => useSyncStore.getState().bumpCategories;
const bumpContent = () => useSyncStore.getState().bumpContent;
const categoryVersions = () => useSyncStore.getState().categoryVersions;
const contentVersions = () => useSyncStore.getState().contentVersions;

beforeEach(() => {
  useSyncStore.setState({
    categoryVersions: { live: 0, movie: 0, series: 0 },
    contentVersions: { live: 0, movie: 0, series: 0 },
  });
});

describe("useSyncStore", () => {
  it("starts every version at zero", () => {
    expect(categoryVersions()).toEqual({ live: 0, movie: 0, series: 0 });
    expect(contentVersions()).toEqual({ live: 0, movie: 0, series: 0 });
  });

  it.each(types)("bumps the %s category version", (type) => {
    bumpCategories()(type);

    expect(categoryVersions()[type]).toBe(1);
  });

  it.each(types)("bumps the %s content version", (type) => {
    bumpContent()(type);

    expect(contentVersions()[type]).toBe(1);
  });

  it("increments on every call", () => {
    bumpCategories()("live");
    bumpCategories()("live");
    bumpCategories()("live");

    expect(categoryVersions().live).toBe(3);
  });

  it("leaves the other types untouched when bumping categories", () => {
    bumpCategories()("movie");

    expect(categoryVersions()).toEqual({ live: 0, movie: 1, series: 0 });
  });

  it("leaves the other types untouched when bumping content", () => {
    bumpContent()("series");

    expect(contentVersions()).toEqual({ live: 0, movie: 0, series: 1 });
  });

  it("keeps category and content versions independent", () => {
    bumpCategories()("live");

    expect(categoryVersions().live).toBe(1);
    expect(contentVersions().live).toBe(0);

    bumpContent()("live");
    bumpContent()("live");

    expect(categoryVersions().live).toBe(1);
    expect(contentVersions().live).toBe(2);
  });

  it("replaces the version map so subscribers see a new reference", () => {
    const before = categoryVersions();

    bumpCategories()("live");

    expect(categoryVersions()).not.toBe(before);
    expect(before).toEqual({ live: 0, movie: 0, series: 0 });
  });

  it("does not touch the content map when only categories change", () => {
    const before = contentVersions();

    bumpCategories()("live");

    expect(contentVersions()).toBe(before);
  });

  it("tracks each type separately", () => {
    const plan: CatalogType[] = ["live", "movie", "movie", "series"];

    plan.forEach((type) => bumpContent()(type));

    expect(contentVersions()).toEqual({ live: 1, movie: 2, series: 1 });
  });
});
