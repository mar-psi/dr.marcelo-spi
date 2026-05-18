"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, ImageIcon, Video } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils";

interface StoryUploadProps {
  isOpen: boolean;
  onClose: () => void;
  mobileOnly?: boolean;
  onSubmit?: (data: StoryUploadData) => Promise<void> | void;
}

export interface StoryUploadData {
  file: File | null;
  title: string;
  theme: string;
  category: "doencas" | "transtornos" | "curiosidades";
  access: "free" | "subscriber";
  durationSeconds: number;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function getVideoDuration(file: File): Promise<number> {
  if (!file.type.startsWith("video/")) return Promise.resolve(15);

  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.max(1, Math.round(video.duration || 0)));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.src = url;
  });
}

export function StoryUpload({ isOpen, onClose, mobileOnly = false, onSubmit }: StoryUploadProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [category, setCategory] = useState<StoryUploadData["category"]>("curiosidades");
  const [access, setAccess] = useState<StoryUploadData["access"]>("subscriber");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (f: File) => {
    setError("");
    if (!ALLOWED_TYPES.has(f.type)) {
      setError("Use MP4, WebM, MOV, JPG, PNG ou WebP.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError("O arquivo deve ter no máximo 100MB.");
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setIsVideo(f.type.startsWith("video/"));
    setDurationSeconds(await getVideoDuration(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) void handleFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;
    setUploading(true);
    setError("");
    try {
      await onSubmit?.({ file, title, theme, category, access, durationSeconds });
      onClose();
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível publicar o story.");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setTitle("");
    setTheme("");
    setCategory("curiosidades");
    setAccess("subscriber");
    setDurationSeconds(0);
    setIsVideo(false);
    setError("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto bg-background-secondary rounded-t-2xl sm:rounded-2xl border border-border-subtle shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div>
                <h2 className="text-lg font-bold text-content-primary">
                  Publicar Story
                </h2>
                <p className="text-xs text-content-secondary mt-0.5">
                  Grave pelo celular ou envie mídia vertical 9:16
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-5 p-5 sm:p-6">
                {mobileOnly && (
                  <div className="rounded-xl border border-accent-primary/30 bg-accent-primary/10 px-3 py-2">
                    <p className="text-xs font-medium text-accent-secondary">
                      Publicação de stories liberada apenas no mobile.
                    </p>
                  </div>
                )}

                {/* Left: upload area + preview */}
                <div className="w-full max-w-[190px] mx-auto shrink-0">
                  {!preview ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={cn(
                        "aspect-story rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-200 p-4",
                        isDragging
                          ? "border-accent-primary bg-accent-primary/10"
                          : "border-border-DEFAULT bg-background-tertiary"
                      )}
                    >
                      <Upload size={24} className="text-content-disabled" />
                      <p className="text-[10px] text-content-disabled text-center px-2">
                        Escolha uma origem para o story
                      </p>
                      <div className="grid w-full gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          leftIcon={<Camera size={14} />}
                          onClick={() => cameraRef.current?.click()}
                        >
                          Gravar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          leftIcon={<ImageIcon size={14} />}
                          onClick={() => galleryRef.current?.click()}
                        >
                          Galeria
                        </Button>
                      </div>
                      <Video size={12} className="text-content-disabled" />
                    </div>
                  ) : (
                    <div className="relative aspect-story rounded-xl overflow-hidden">
                      {isVideo ? (
                        <video
                          src={preview}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
                      {isVideo && (
                        <div className="absolute top-2 left-2">
                          <span className="text-[9px] bg-accent-primary/80 text-white px-1.5 py-0.5 rounded font-medium">
                            VÍDEO
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={reset}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <X size={12} />
                      </button>
                      <p className="absolute bottom-2 left-2 right-2 text-[10px] text-white/80 text-center leading-tight">
                        Preview em tempo real
                      </p>
                    </div>
                  )}
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="video/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFile(f);
                    }}
                  />
                  <input
                    ref={galleryRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFile(f);
                    }}
                  />
                </div>

                {/* Right: form fields */}
                <div className="space-y-4">
                  <Input
                    label="Título do story"
                    placeholder="Título curto"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Input
                    label="Tema / descrição curta"
                    placeholder="Descrição rápida"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  />
                  <Select
                    label="Categoria"
                    placeholder="Selecione a categoria"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as StoryUploadData["category"])}
                    options={[
                      { value: "doencas", label: "Doenças" },
                      { value: "transtornos", label: "Transtornos e Tratamentos" },
                      { value: "curiosidades", label: "Curiosidades" },
                    ]}
                  />
                  <Select
                    label="Visibilidade"
                    value={access}
                    onChange={(e) => setAccess(e.target.value as StoryUploadData["access"])}
                    options={[
                      { value: "free", label: "Todos os usuários" },
                      { value: "subscriber", label: "Apenas assinantes" },
                    ]}
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-status-error/40 bg-status-errorBg px-3 py-2 text-xs text-status-error">
                    {error}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-3 px-5 sm:px-6 py-4 border-t border-border-subtle">
                <p className="text-xs text-content-disabled">
                  Formatos: MP4, WebM, MOV, JPG, PNG, WebP · Máx. 100MB
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    loading={uploading}
                    disabled={!file || !title}
                    leftIcon={<Upload size={14} />}
                  >
                    Publicar Story
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
