"use client";

import React, { useEffect, useRef, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { compressImageToWebp } from "@/lib/image-compression";

interface StoryCoverUploadProps {
  isOpen: boolean;
  storyTitle: string;
  currentCoverUrl: string | null;
  onClose: () => void;
  onSubmit: (cover: Blob) => Promise<void>;
}

const COVER_WIDTH = 720;
const COVER_HEIGHT = 1280;

export function StoryCoverUpload({
  isOpen,
  storyTitle,
  currentCoverUrl,
  onClose,
  onSubmit,
}: StoryCoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cover, setCover] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = () => {
    setCover(null);
    setPreviewUrl(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    setProcessing(true);
    setError("");

    try {
      const optimized = await compressImageToWebp(file, {
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
        quality: 0.84,
      });
      setCover(optimized);
      setPreviewUrl(URL.createObjectURL(optimized));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível preparar a capa.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!cover) return;
    setUploading(true);
    setError("");

    try {
      await onSubmit(cover);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a capa.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Capa do story"
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            loading={uploading}
            disabled={!cover || processing}
            onClick={() => void handleSubmit()}
          >
            Salvar capa
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-content-secondary">
        Escolha uma imagem para <strong className="text-content-primary">{storyTitle}</strong>.
        Ela será recortada em 9:16 e otimizada para WebP.
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={processing || uploading}
        className="group relative mx-auto block aspect-story w-full max-w-[225px] overflow-hidden rounded-xl border-2 border-dashed border-border-DEFAULT bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:cursor-wait"
        aria-label="Selecionar imagem para a capa"
      >
        {previewUrl || currentCoverUrl ? (
          <>
            <img
              src={previewUrl ?? currentCoverUrl ?? ""}
              alt={`Prévia da capa de ${storyTitle}`}
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-x-3 bottom-3 rounded-lg bg-black/70 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">
              {processing ? "Otimizando..." : "Toque para trocar a imagem"}
            </span>
          </>
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-3 px-6 text-content-secondary">
            <ImagePlus size={30} className="text-accent-secondary" />
            <span className="text-sm font-semibold text-content-primary">Selecionar capa</span>
            <span className="text-xs">JPG, PNG ou WebP, até 12 MB</span>
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-content-disabled">
        <Upload size={13} />
        Saída: {COVER_WIDTH} x {COVER_HEIGHT}px em WebP
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-status-error/40 bg-status-errorBg px-3 py-2 text-xs text-status-error">
          {error}
        </p>
      )}
    </Modal>
  );
}
