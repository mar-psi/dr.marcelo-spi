import { EMPTY_IMAGE, getSignedStorageUrl } from "@/lib/storage";
import { clampProgress } from "@/lib/utils";
import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from "@/lib/youtube";

type ThumbnailSource = {
  thumbnail_url?: string | null;
  thumbnail_path?: string | null;
  video_url?: string | null;
};

export function formatLessonDuration(seconds: number) {
  if (seconds <= 0) return "Live";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

export function getLessonProgressPercent(progressSeconds: number, durationSeconds: number) {
  if (progressSeconds <= 0 || durationSeconds <= 0) return undefined;
  return clampProgress(Math.round((progressSeconds / durationSeconds) * 100));
}

export async function resolveContentThumbnail(item: ThumbnailSource) {
  if (item.thumbnail_url) return item.thumbnail_url;

  const signedThumbnail = await getSignedStorageUrl("content-media", item.thumbnail_path);
  if (signedThumbnail) return signedThumbnail;

  const youtubeId = extractYouTubeVideoId(item.video_url ?? "");
  if (youtubeId) return getYouTubeThumbnailUrl(youtubeId);

  return EMPTY_IMAGE;
}
