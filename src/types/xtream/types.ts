export interface XtreamUserInfo {
  username: string;
  password: string;
  message: string;
  auth: 0 | 1;
  status: string;
  exp_date: string | null;
  is_trial: string;
  active_cons: string;
  created_at: string;
  max_connections: string;
  allowed_output_formats: string[];
}

export interface XtreamServerInfo {
  url: string;
  port: string;
  https_port: string;
  server_protocol: "http" | "https";
  timezone: string;
  timestamp_now: number;
  time_now: string;
}

export interface XtreamProfile {
  user_info: XtreamUserInfo;
  server_info: XtreamServerInfo;
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamLiveStream {
  num: number;
  name: string;
  stream_type: "live";
  stream_id: number;
  stream_icon: string;
  category_id: string;
}

export interface XtreamVodStream {
  num: number;
  name: string;
  stream_type: "movie";
  stream_id: number;
  stream_icon: string;
  category_id: string;
  container_extension: string;
}

export interface XtreamSeries {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  category_id: string;
}

export interface XtreamEpisode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  season: number;
}

export interface XtreamSeriesInfo {
  info: XtreamSeries;
  seasons: Array<{
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    cover: string;
  }>;
  episodes: Record<string, XtreamEpisode[]>;
}
