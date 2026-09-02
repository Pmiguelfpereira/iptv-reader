import {
  XtreamLiveStream,
  XtreamSeries,
  XtreamVodStream,
} from "@/types/xtream/types";
import { movies, series, tv } from "../../db/schema";
import { XtreamClient } from "./xtream";

export const CONFIG = {
  live: {
    table: tv,
    getCategories: (xtreamClient: XtreamClient) =>
      xtreamClient.getLiveCategories(),
    getStreams: (xtreamClient: XtreamClient, id: string) =>
      xtreamClient.getLiveStreams(id),
    select: { id: tv.tvId, name: tv.name, image: tv.image },
    map: (liveStream: XtreamLiveStream, categoryId: number) => ({
      tvId: liveStream.stream_id,
      name: liveStream.name,
      image: liveStream.stream_icon,
      categoryId,
    }),
  },
  movie: {
    table: movies,
    getCategories: (xtreamClient: XtreamClient) =>
      xtreamClient.getVodCategories(),
    getStreams: (xtreamClient: XtreamClient, id: string) =>
      xtreamClient.getVodStreams(id),
    select: {
      id: movies.movieId,
      name: movies.name,
      image: movies.image,
      ext: movies.containerExtension,
    },
    map: (vodStream: XtreamVodStream, categoryId: number) => ({
      movieId: vodStream.stream_id,
      name: vodStream.name,
      image: vodStream.stream_icon,
      categoryId,
      containerExtension: vodStream.container_extension,
    }),
  },
  series: {
    table: series,
    getCategories: (xtreamClient: XtreamClient) =>
      xtreamClient.getSeriesCategories(),
    getStreams: (xtreamClient: XtreamClient, id: string) =>
      xtreamClient.getSeries(id),
    select: { id: series.serieId, name: series.name, image: series.image },
    map: (series: XtreamSeries, categoryId: number) => ({
      serieId: series.series_id,
      name: series.name,
      image: series.cover,
      categoryId,
    }),
  },
} as const;
