type ImageFit = "cover" | "contain";

type CompressImageOptions = {
  width: number;
  height: number;
  quality?: number;
  fit?: ImageFit;
  maxSourceSize?: number;
};

const DEFAULT_MAX_SOURCE_SIZE = 12 * 1024 * 1024;

export async function compressImageToWebp(
  file: File,
  {
    width,
    height,
    quality = 0.82,
    fit = "cover",
    maxSourceSize = DEFAULT_MAX_SOURCE_SIZE,
  }: CompressImageOptions
): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Envie uma imagem em PNG ou JPG.");
  }

  if (file.size > maxSourceSize) {
    throw new Error(`A imagem deve ter no máximo ${Math.round(maxSourceSize / 1024 / 1024)}MB.`);
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();

    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const outputRatio = width / height;
    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;
    let sourceX = 0;
    let sourceY = 0;

    if (fit === "cover") {
      if (sourceRatio > outputRatio) {
        sourceWidth = image.naturalHeight * outputRatio;
        sourceX = (image.naturalWidth - sourceWidth) / 2;
      } else {
        sourceHeight = image.naturalWidth / outputRatio;
        sourceY = (image.naturalHeight - sourceHeight) / 2;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });

    if (!context) {
      throw new Error("Não foi possível processar a imagem.");
    }

    context.fillStyle = "#050509";
    context.fillRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    if (fit === "contain") {
      const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      context.drawImage(
        image,
        (width - drawWidth) / 2,
        (height - drawHeight) / 2,
        drawWidth,
        drawHeight
      );
    } else {
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        width,
        height
      );
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", quality);
    });

    if (!blob) {
      throw new Error("Não foi possível preparar a imagem.");
    }

    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
