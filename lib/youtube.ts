const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function extractYouTubeVideoId(value: string): string | null {
  const input = value.trim();
  if (!input) return null;
  if (YOUTUBE_ID_PATTERN.test(input)) return input;

  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        const id = parts[1];
        return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function isYouTubeUrl(value: string | null | undefined): value is string {
  return Boolean(value && extractYouTubeVideoId(value));
}

export function getYouTubeThumbnailUrl(videoId: string, quality: "hq" | "max" = "hq") {
  const file = quality === "max" ? "maxresdefault.jpg" : "hqdefault.jpg";
  return `https://i.ytimg.com/vi/${videoId}/${file}`;
}

export function getYouTubeEmbedUrl(videoId: string) {
  const params = new URLSearchParams({
    enablejsapi: "1",
    controls: "0",
    rel: "0",
    playsinline: "1",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    modestbranding: "1",
    origin: typeof window === "undefined" ? "" : window.location.origin,
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
