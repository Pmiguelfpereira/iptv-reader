import {
  XtreamCategory,
  XtreamLiveStream,
  XtreamProfile,
  XtreamSeries,
  XtreamSeriesInfo,
  XtreamVodStream,
} from "@/types/xtream/types";

export interface XtreamCredentials {
  baseUrl: string;
  username: string;
  password: string;
}

type Params = Record<string, string | number | undefined>;

export function createXtreamClient({
  baseUrl,
  username,
  password,
}: XtreamCredentials) {
  const root = baseUrl.replace(/\/$/, "");

  function buildUrl(params: Params) {
    const query: Params = { username, password, ...params };
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined)
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
      )
      .join("&");
    return `${root}/player_api.php?${qs}`;
  }

  async function call<T>(params: Params): Promise<T | null> {
    const res = await fetch(buildUrl(params));
    if (!res.ok)
      throw new Error(`Xtream API ${res.status} em ${params.action ?? "auth"}`);

    if (res.status === 204 || res.status === 205) return null;

    return res.json() as Promise<T>;
  }

  return {
    // --- dados (JSON) ---
    getProfile: () => call<XtreamProfile>({}),

    getLiveCategories: () => {
      return call<XtreamCategory[]>({ action: "get_live_categories" });
    },
    getLiveStreams: (categoryId?: string) => {
      return call<XtreamLiveStream[]>({
        action: "get_live_streams",
        category_id: categoryId,
      });
    },
    getVodCategories: () => {
      return call<XtreamCategory[]>({ action: "get_vod_categories" });
    },
    getVodStreams: (categoryId?: string) => {
      return call<XtreamVodStream[]>({
        action: "get_vod_streams",
        category_id: categoryId,
      });
    },
    getSeriesCategories: () => {
      return call<XtreamCategory[]>({ action: "get_series_categories" });
    },

    getSeries: (categoryId?: string) => {
      return call<XtreamSeries[]>({
        action: "get_series",
        category_id: categoryId,
      });
    },
    getSeriesInfo: (seriesId: number) => {
      return call<XtreamSeriesInfo>({
        action: "get_series_info",
        series_id: seriesId,
      });
    },
    // --- URLs de playback (para expo-video / expo-av) ---
    liveUrl: (streamId: number, ext = "ts") =>
      `${root}/live/${username}/${password}/${streamId}.${ext}`,
    vodUrl: (streamId: number, ext: string) =>
      `${root}/movie/${username}/${password}/${streamId}.${ext}`,
    seriesUrl: (episodeId: number | string, ext: string) =>
      `${root}/series/${username}/${password}/${episodeId}.${ext}`,
  };
}

export type XtreamClient = ReturnType<typeof createXtreamClient>;
