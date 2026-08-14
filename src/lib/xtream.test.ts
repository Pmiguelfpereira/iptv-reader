import { createXtreamClient } from "@/lib/xtream";
import { logger } from "@/utils/logger";

jest.mock("@/utils/logger", () => ({
  logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const CREDENTIALS = {
  baseUrl: "http://example.com:8080",
  username: "user",
  password: "pass",
};

function mockResponse(body: unknown, init: { ok?: boolean; status?: number }) {
  const { ok = true, status = 200 } = init;
  const json = jest.fn(async () => body);
  fetchMock.mockResolvedValueOnce({ ok, status, json });
  return json;
}

function requestedUrl(call = 0) {
  return new URL(fetchMock.mock.calls[call][0] as string);
}

const client = () => createXtreamClient(CREDENTIALS);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createXtreamClient", () => {
  describe("url building", () => {
    it("always sends the credentials on the player_api endpoint", async () => {
      mockResponse({}, {});

      await client().getProfile();

      const url = requestedUrl();
      expect(url.origin + url.pathname).toBe(
        "http://example.com:8080/player_api.php",
      );
      expect(url.searchParams.get("username")).toBe("user");
      expect(url.searchParams.get("password")).toBe("pass");
    });

    it("strips a single trailing slash from the base url", async () => {
      mockResponse([], {});

      await createXtreamClient({
        ...CREDENTIALS,
        baseUrl: "http://example.com:8080/",
      }).getLiveCategories();

      expect(requestedUrl().pathname).toBe("/player_api.php");
    });

    it("percent-encodes credentials and params", async () => {
      mockResponse({}, {});

      await createXtreamClient({
        ...CREDENTIALS,
        username: "us er&x",
        password: "p/a=ss",
      }).getProfile();

      const raw = fetchMock.mock.calls[0][0] as string;
      expect(raw).toContain("username=us%20er%26x");
      expect(raw).toContain("password=p%2Fa%3Dss");

      const url = requestedUrl();
      expect(url.searchParams.get("username")).toBe("us er&x");
      expect(url.searchParams.get("password")).toBe("p/a=ss");
    });

    it("omits params that are undefined", async () => {
      mockResponse([], {});

      await client().getLiveStreams();

      const raw = fetchMock.mock.calls[0][0] as string;
      expect(raw).not.toContain("category_id");
      expect(requestedUrl().searchParams.get("action")).toBe(
        "get_live_streams",
      );
    });
  });

  describe("data endpoints", () => {
    it.each([
      ["getLiveCategories", "get_live_categories"],
      ["getVodCategories", "get_vod_categories"],
      ["getSeriesCategories", "get_series_categories"],
    ] as const)("%s calls action=%s", async (method, action) => {
      const payload = [{ category_id: "1", category_name: "Sport" }];
      mockResponse(payload, {});

      await expect(client()[method]()).resolves.toEqual(payload);

      expect(requestedUrl().searchParams.get("action")).toBe(action);
    });

    it.each([
      ["getLiveStreams", "get_live_streams"],
      ["getVodStreams", "get_vod_streams"],
      ["getSeries", "get_series"],
    ] as const)("%s forwards the category id", async (method, action) => {
      mockResponse([], {});

      await client()[method]("42");

      const params = requestedUrl().searchParams;
      expect(params.get("action")).toBe(action);
      expect(params.get("category_id")).toBe("42");
    });

    it("getSeriesInfo sends the series id as a number", async () => {
      const info = { info: { name: "Show" }, episodes: {} };
      mockResponse(info, {});

      await expect(client().getSeriesInfo(7)).resolves.toEqual(info);

      const params = requestedUrl().searchParams;
      expect(params.get("action")).toBe("get_series_info");
      expect(params.get("series_id")).toBe("7");
    });

    it("getProfile sends no action", async () => {
      mockResponse({ user_info: {} }, {});

      await client().getProfile();

      expect(requestedUrl().searchParams.has("action")).toBe(false);
    });
  });

  describe("responses", () => {
    it("returns the parsed json body", async () => {
      const json = mockResponse([{ num: 1 }], {});

      await expect(client().getLiveStreams()).resolves.toEqual([{ num: 1 }]);
      expect(json).toHaveBeenCalledTimes(1);
    });

    it.each([204, 205])("returns null for %i with no body", async (status) => {
      const json = mockResponse(undefined, { status });

      await expect(client().getLiveCategories()).resolves.toBeNull();
      expect(json).not.toHaveBeenCalled();
    });

    it.each([400, 401, 403, 404, 500])(
      "throws and logs on %i",
      async (status) => {
        mockResponse(null, { ok: false, status });

        await expect(client().getSeries()).rejects.toThrow(
          `Xtream API ${status} em get_series`,
        );
        expect(logger.error).toHaveBeenCalledWith(
          `Xtream API ${status} em get_series`,
        );
      },
    );

    it("names the failing call 'auth' when there is no action", async () => {
      mockResponse(null, { ok: false, status: 401 });

      await expect(client().getProfile()).rejects.toThrow(
        "Xtream API 401 em auth",
      );
    });

    it("propagates network failures", async () => {
      fetchMock.mockRejectedValueOnce(new Error("offline"));

      await expect(client().getProfile()).rejects.toThrow("offline");
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe("playback urls", () => {
    it("builds the live url with the default ts extension", () => {
      expect(client().liveUrl(101)).toBe(
        "http://example.com:8080/live/user/pass/101.ts",
      );
    });

    it("builds the live url with an explicit extension", () => {
      expect(client().liveUrl(101, "m3u8")).toBe(
        "http://example.com:8080/live/user/pass/101.m3u8",
      );
    });

    it("builds the vod url", () => {
      expect(client().vodUrl(55, "mkv")).toBe(
        "http://example.com:8080/movie/user/pass/55.mkv",
      );
    });

    it.each([[9], ["9"]])("builds the series url for %p", (episodeId) => {
      expect(client().seriesUrl(episodeId, "mp4")).toBe(
        "http://example.com:8080/series/user/pass/9.mp4",
      );
    });

    it("uses the normalised root", () => {
      const withSlash = createXtreamClient({
        ...CREDENTIALS,
        baseUrl: "http://example.com:8080/",
      });

      expect(withSlash.liveUrl(1)).toBe(
        "http://example.com:8080/live/user/pass/1.ts",
      );
    });

    it("does not hit the network", () => {
      const c = client();

      c.liveUrl(1);
      c.vodUrl(2, "mp4");
      c.seriesUrl(3, "mp4");

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
