const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 1280;

interface VideoThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
}

function waitForEvent(target: HTMLVideoElement, event: "loadeddata" | "seeked") {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("O vídeo demorou demais para ser processado."));
    }, 15_000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      target.removeEventListener(event, handleSuccess);
      target.removeEventListener("error", handleError);
    };
    const handleSuccess = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Este vídeo não pôde ser lido pelo navegador."));
    };

    target.addEventListener(event, handleSuccess, { once: true });
    target.addEventListener("error", handleError, { once: true });
  });
}

export async function createVideoThumbnail(
  file: File,
  {
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    quality = 0.84,
  }: VideoThumbnailOptions = {}
): Promise<Blob> {
  if (!file.type.startsWith("video/")) {
    throw new Error("Selecione um vídeo para gerar a capa automática.");
  }

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;

  try {
    const loaded = waitForEvent(video, "loadeddata");
    video.src = objectUrl;
    video.load();
    await loaded;

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const frameTime = duration > 0.2 ? Math.min(Math.max(duration * 0.1, 0.1), duration - 0.1) : 0;

    if (frameTime > 0) {
      const seeked = waitForEvent(video, "seeked");
      video.currentTime = frameTime;
      await seeked;
    }

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error("Não foi possível identificar as dimensões do vídeo.");
    }

    const sourceRatio = video.videoWidth / video.videoHeight;
    const outputRatio = width / height;
    let sourceWidth = video.videoWidth;
    let sourceHeight = video.videoHeight;
    let sourceX = 0;
    let sourceY = 0;

    if (sourceRatio > outputRatio) {
      sourceWidth = video.videoHeight * outputRatio;
      sourceX = (video.videoWidth - sourceWidth) / 2;
    } else {
      sourceHeight = video.videoWidth / outputRatio;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });

    if (!context) throw new Error("Não foi possível gerar a capa automática.");

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height
    );

    const thumbnail = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", quality);
    });

    if (!thumbnail) throw new Error("O navegador não conseguiu converter a capa para WebP.");
    return thumbnail;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
