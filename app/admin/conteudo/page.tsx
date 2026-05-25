"use client";

import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit2, EyeOff, Trash2, X,
  FileVideo, BookOpen, Eye,
} from "lucide-react";
import { Input, Select, Button, Badge, useToast } from "@/components/ui";
import { resolveContentThumbnail } from "@/lib/content";
import { compressImageToWebp } from "@/lib/image-compression";
import { formatDate, cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSignedStorageUrl } from "@/lib/storage";
import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from "@/lib/youtube";
import type { Database } from "@/types/database";

type ContentTab = "video" | "ebook";
type StatusFilter = "todos" | "publicado" | "rascunho";
type ContentRow = Database["public"]["Tables"]["content_items"]["Row"];

const categoryLabel: Record<string, string> = {
  doencas: "Doenças",
  transtornos: "Transtornos",
  curiosidades: "Curiosidades",
};

const categoryVariant: Record<string, "doencas" | "transtornos" | "curiosidades"> = {
  doencas: "doencas",
  transtornos: "transtornos",
  curiosidades: "curiosidades",
};

const safeFileName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

function AddContentModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const supabase = createSupabaseBrowserClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("doencas");
  const [type, setType] = useState("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [access, setAccess] = useState("free");
  const [status, setStatus] = useState("publicado");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Media states
  const [thumbnail, setThumbnail] = useState<Blob | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null); // For PDF
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const youtubeId = extractYouTubeVideoId(videoUrl);
  const youtubeThumbnail = youtubeId ? getYouTubeThumbnailUrl(youtubeId) : null;

  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsAnimated(false);
    }
  }, [isOpen]);

  const createSlug = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("doencas");
    setType("video");
    setVideoUrl("");
    setAccess("free");
    setStatus("publicado");
    setTags([]);
    setTagInput("");
    setThumbnail(null);
    setThumbPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setMediaFile(null);
    setUploadProgress(0);
    setShowErrors(false);
  };

  // Handlers
  const clearThumbnail = () => {
    setThumbnail(null);
    setThumbPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  };

  const handleThumbnailSelect = async (file: File) => {
    try {
      const optimized = await compressImageToWebp(file, {
        width: 1280,
        height: 720,
        quality: 0.82,
        fit: "cover",
      });
      const previewUrl = URL.createObjectURL(optimized);
      setThumbnail(optimized);
      setThumbPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return previewUrl;
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Não foi possível usar essa capa",
        message: error instanceof Error ? error.message : "Escolha outra imagem.",
      });
    }
  };

  const handleMediaSelect = (file: File) => {
    // This is only for PDF now
    if (file.size > 50 * 1024 * 1024) {
      toast({ variant: "error", title: "Arquivo muito grande", message: "Máximo 50MB para o PDF." });
      return;
    }

    setMediaFile(file);
    setUploadProgress(100);
  };

  const addTag = () => {
    const val = tagInput.trim().replace(/,$/, "");
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
    }
    setTagInput("");
  };

  const removeTag = (t: string) => setTags(tags.filter((tag) => tag !== t));

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validation
    const isVideoValid = type === "video" && Boolean(youtubeId);
    const isEbookValid = type === "ebook" && mediaFile !== null;
    
    if (!title || !(isVideoValid || isEbookValid)) {
      setShowErrors(true);
      toast({ variant: "error", title: "Campos obrigatórios", message: "Confira título e link válido do YouTube." });
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const baseSlug = createSlug(title);
    const slug = `${baseSlug || "conteudo"}-${Date.now().toString().slice(-5)}`;
    let uploadedThumbnailPath: string | null = null;
    let uploadedMaterialPath: string | null = null;

    if (thumbnail) {
      const fileId =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const fileName = safeFileName(`${baseSlug || "conteudo"}-cover.webp`);
      const path = `${user?.id ?? "admin"}/covers/${fileId}-${fileName}`;

      const uploadResult = await supabase.storage.from("content-media").upload(path, thumbnail, {
        cacheControl: "3600",
        contentType: "image/webp",
        upsert: false,
      });

      if (uploadResult.error) {
        setLoading(false);
        toast({
          variant: "error",
          title: "Não foi possível enviar a capa",
          message: uploadResult.error.message,
        });
        return;
      }

      uploadedThumbnailPath = uploadResult.data.path;
    }

    const { data: content, error } = await supabase
      .from("content_items")
      .insert({
        slug,
        title: title.trim(),
        description: description.trim() || title.trim(),
        body: description.trim() || title.trim(),
        type: type === "video" ? "lesson" : "ebook",
        category: category as Database["public"]["Enums"]["content_category"],
        status: status === "publicado" ? "published" : "draft",
        access: access === "free" ? "free" : "subscriber",
        thumbnail_path: uploadedThumbnailPath,
        thumbnail_url: !uploadedThumbnailPath && type === "video" ? youtubeThumbnail : null,
        video_url: type === "video" ? videoUrl.trim() : null,
        duration_seconds: 0,
        published_at: status === "publicado" ? new Date().toISOString() : null,
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();

    if (error || !content) {
      if (uploadedThumbnailPath) {
        await supabase.storage.from("content-media").remove([uploadedThumbnailPath]);
      }
      setLoading(false);
      toast({ variant: "error", title: "Não foi possível publicar", message: error?.message });
      return;
    }

    if (type === "ebook" && mediaFile) {
      const fileId =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const materialName = safeFileName(`${baseSlug || "ebook"}.pdf`);
      const materialPath = `${user?.id ?? "admin"}/ebooks/${fileId}-${materialName}`;
      const uploadResult = await supabase.storage.from("content-materials").upload(materialPath, mediaFile, {
        cacheControl: "3600",
        contentType: mediaFile.type || "application/pdf",
        upsert: false,
      });

      if (uploadResult.error) {
        if (uploadedThumbnailPath) {
          await supabase.storage.from("content-media").remove([uploadedThumbnailPath]);
        }
        await supabase.from("content_items").delete().eq("id", content.id);
        setLoading(false);
        toast({ variant: "error", title: "Não foi possível enviar o PDF", message: uploadResult.error.message });
        return;
      }

      uploadedMaterialPath = uploadResult.data.path;
      const materialInsert = await supabase.from("content_materials").insert({
        content_id: content.id,
        title: title.trim(),
        type: "ebook",
        storage_path: uploadedMaterialPath,
        pages: 0,
        sort_order: 0,
      });

      if (materialInsert.error) {
        await supabase.storage.from("content-materials").remove([uploadedMaterialPath]);
        if (uploadedThumbnailPath) {
          await supabase.storage.from("content-media").remove([uploadedThumbnailPath]);
        }
        await supabase.from("content_items").delete().eq("id", content.id);
        setLoading(false);
        toast({ variant: "error", title: "Não foi possível vincular o PDF", message: materialInsert.error.message });
        return;
      }
    }

    if (tags.length > 0) {
      await supabase.from("content_tags").insert(
        tags.map((tag) => ({
          content_id: content.id,
          tag,
        }))
      );
    }

    setLoading(false);
    toast({ variant: "success", title: "Conteúdo publicado com sucesso!" });
    resetForm();
    onCreated();
    onClose();
  };

  const isFormValid = 
    title.trim().length > 0 && 
    (type === "video" ? Boolean(youtubeId) : mediaFile !== null);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onAnimationComplete={() => setIsAnimated(true)}
            style={{ transform: isAnimated ? "none" : undefined }}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background-secondary rounded-2xl border border-border-subtle shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background-secondary flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div>
                <h2 className="text-lg font-bold text-content-primary">Adicionar Novo Conteúdo</h2>
                <p className="text-xs text-content-secondary mt-0.5">Preencha os campos abaixo para publicar na plataforma.</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-content-secondary hover:bg-background-tertiary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Seção 1: Básicas */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 bg-accent-primary rounded-full" />
                  <h3 className="text-sm font-bold text-content-primary uppercase tracking-wider">Informações Básicas</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-content-secondary uppercase mb-1.5 block">Título *</label>
                    <input
                      type="text"
                      placeholder="Ex: Entendendo o Transtorno Bipolar"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={cn(
                        "w-full h-11 bg-background-tertiary border rounded-xl px-4 text-sm outline-none transition-all",
                        showErrors && !title ? "border-status-error" : "border-border-subtle focus:border-accent-primary"
                      )}
                    />
                    {showErrors && !title && <p className="text-[10px] text-status-error mt-1 ml-1">O título é obrigatório.</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-content-secondary uppercase mb-1.5 block">Descrição Curta</label>
                    <textarea
                      placeholder="Uma breve introdução sobre o que será abordado..."
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-background-tertiary border border-border-subtle rounded-xl p-4 text-sm outline-none focus:border-accent-primary transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Categoria"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      options={[
                        { value: "doencas", label: "Doenças" },
                        { value: "transtornos", label: "Transtornos" },
                        { value: "curiosidades", label: "Curiosidades" },
                      ]}
                    />
                    <Select
                      label="Tipo"
                      value={type}
                      onChange={(e) => {
                        setType(e.target.value);
                        setMediaFile(null);
                        setVideoUrl("");
                        setUploadProgress(0);
                      }}
                      options={[
                        { value: "video", label: "Vídeo / Aula" },
                        { value: "ebook", label: "E-book / PDF" },
                      ]}
                    />
                  </div>
                </div>
              </section>

              <hr className="border-border-subtle" />

              {/* Seção 2: Mídia */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 bg-accent-primary rounded-full" />
                  <h3 className="text-sm font-bold text-content-primary uppercase tracking-wider">Arquivos e Mídia</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Thumbnail Upload */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-content-secondary uppercase block">
                      Capa {type === "video" ? "(personalizada opcional)" : "*"}
                    </label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingThumb(true); }}
                      onDragLeave={() => setIsDraggingThumb(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingThumb(false);
                        if (e.dataTransfer.files?.[0]) handleThumbnailSelect(e.dataTransfer.files[0]);
                      }}
                      onClick={() => thumbInputRef.current?.click()}
                      className={cn(
                        "relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-background-tertiary group",
                        isDraggingThumb ? "border-accent-primary bg-accent-primary/5" : "border-border-subtle hover:border-accent-primary/50 hover:bg-background-tertiary/80"
                      )}
                    >
                      <input type="file" ref={thumbInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleThumbnailSelect(e.target.files[0])} />
                      
                      {thumbPreview || youtubeThumbnail ? (
                        <>
                          <img src={thumbPreview ?? youtubeThumbnail ?? ""} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="text-white rotate-45" size={24} />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); clearThumbnail(); }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-status-error transition-colors z-10"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <motion.div animate={isDraggingThumb ? { scale: 1.1 } : { scale: 1 }}>
                            <Edit2 size={24} className="text-content-disabled mx-auto mb-2 group-hover:text-accent-secondary transition-colors" />
                          </motion.div>
                          <p className="text-xs font-medium text-content-primary">Clique ou arraste a thumbnail</p>
                          <p className="text-[10px] text-content-disabled mt-1">
                            {type === "video"
                              ? "Envie uma capa própria ou deixe vazio para usar a thumb do YouTube"
                              : "JPG ou PNG · Máx. 12MB"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Media (Video Link or PDF Upload) */}
                  <div className="space-y-2">
                    {type === "video" ? (
                      <div className="h-full flex flex-col">
                        <label className="text-xs font-semibold text-content-secondary uppercase mb-1.5 block">Link do YouTube *</label>
                        <div className="flex-1 flex flex-col">
                          <div className="relative flex-1 min-h-[100px] sm:min-h-0">
                            <input
                              type="text"
                              placeholder="https://youtu.be/..."
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              className={cn(
                                "w-full h-full min-h-[100px] bg-background-tertiary border rounded-2xl px-4 text-sm outline-none transition-all flex items-center justify-center",
                                showErrors && !youtubeId ? "border-status-error" : "border-border-subtle focus:border-accent-primary"
                              )}
                            />
                            <div className="absolute top-3 right-4 text-content-disabled">
                              <FileVideo size={18} />
                            </div>
                          </div>
                          {showErrors && !youtubeId && <p className="text-[10px] text-status-error mt-1 ml-1">Informe um link válido do YouTube.</p>}
                          <p className="text-[10px] text-content-disabled mt-2 leading-tight">
                            Publique como não listado no YouTube e cole o link aqui. A plataforma usa um player próprio.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col">
                        <label className="text-xs font-semibold text-content-secondary uppercase mb-1.5 block">Arquivo PDF *</label>
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDraggingMedia(true); }}
                          onDragLeave={() => setIsDraggingMedia(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingMedia(false);
                            if (e.dataTransfer.files?.[0]) handleMediaSelect(e.dataTransfer.files[0]);
                          }}
                          onClick={() => mediaInputRef.current?.click()}
                          className={cn(
                            "relative flex-1 min-h-[100px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all bg-background-tertiary group",
                            isDraggingMedia ? "border-accent-primary bg-accent-primary/5" : "border-border-subtle hover:border-accent-primary/50",
                            mediaFile && "border-solid border-accent-primary/30",
                            showErrors && !mediaFile && "border-status-error"
                          )}
                        >
                          <input
                            type="file"
                            ref={mediaInputRef}
                            className="hidden"
                            accept=".pdf"
                            onChange={(e) => e.target.files?.[0] && handleMediaSelect(e.target.files[0])}
                          />

                          {mediaFile ? (
                            <div className="w-full px-5 text-center">
                              <BookOpen className="mx-auto mb-2 text-accent-secondary" />
                              <p className="text-xs font-bold text-content-primary truncate max-w-full px-2">{mediaFile.name}</p>
                              <p className="text-[10px] text-content-disabled mb-3">{(mediaFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                              
                              <div className="w-full h-1.5 bg-background-primary rounded-full overflow-hidden relative">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${uploadProgress}%` }}
                                  className="h-full bg-accent-primary"
                                />
                              </div>
                              <p className="text-[10px] font-bold text-accent-secondary mt-1.5">{Math.round(uploadProgress)}% concluído</p>
                              
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setMediaFile(null); setUploadProgress(0); }}
                                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-status-error transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center p-4">
                              <BookOpen size={24} className="text-content-disabled mx-auto mb-2 group-hover:text-accent-secondary transition-colors" />
                              <p className="text-xs font-medium text-content-primary">Clique ou arraste o PDF</p>
                              <p className="text-[10px] text-content-disabled mt-1">PDF · Máx. 50MB</p>
                            </div>
                          )}
                        </div>
                        {showErrors && !mediaFile && <p className="text-[10px] text-status-error mt-1 ml-1">O arquivo PDF é obrigatório.</p>}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <hr className="border-border-subtle" />

              {/* Seção 3: Configurações */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 bg-accent-primary rounded-full" />
                  <h3 className="text-sm font-bold text-content-primary uppercase tracking-wider">Configurações e Tags</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Visibilidade de Acesso"
                    value={access}
                    onChange={(e) => setAccess(e.target.value)}
                    options={[
                      { value: "free", label: "Gratuito" },
                      { value: "paid", label: "Exclusivo (Assinantes)" },
                    ]}
                  />
                  <Select
                    label="Status Inicial"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    options={[
                      { value: "publicado", label: "Publicado" },
                      { value: "rascunho", label: "Rascunho" },
                    ]}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-content-secondary uppercase mb-1.5 block">Tags (opcional)</label>
                  <div className="w-full bg-background-tertiary border border-border-subtle rounded-xl p-1.5 flex flex-wrap gap-1.5 focus-within:border-accent-primary transition-all">
                    {tags.map((t) => (
                      <span key={t} className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-primary/10 border border-accent-primary/20 rounded-lg text-xs font-medium text-accent-secondary">
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="hover:text-status-error transition-colors">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Pressione Enter para adicionar"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="bg-transparent border-none outline-none text-sm px-2 py-1 flex-1 min-w-[120px]"
                    />
                  </div>
                </div>
              </section>
            </form>

            {/* Footer */}
            <div className="sticky bottom-0 z-20 bg-background-secondary border-t border-border-subtle px-6 py-4 flex items-center justify-between gap-4">
              <span className="text-[10px] text-content-disabled italic">* Campos obrigatórios</span>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSubmit()}
                  loading={loading}
                  disabled={!isFormValid || loading}
                  className={cn("px-6 whitespace-nowrap shrink-0", isFormValid && "shadow-glowStrong")}
                >
                  + Publicar conteúdo
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function AdminConteudoPage() {
  const supabase = createSupabaseBrowserClient();
  const [activeTab, setActiveTab] = useState<ContentTab>("video");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [contents, setContents] = useState<
    Array<{
      id: string;
      title: string;
      category: "doencas" | "transtornos" | "curiosidades";
      type: "video" | "ebook";
      status: "publicado" | "rascunho";
      publishedAt: string;
      views: number;
      thumbnailUrl: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  const tabs: { key: ContentTab; label: string; icon: React.ElementType }[] = [
    { key: "video", label: "Aulas", icon: FileVideo },
    { key: "ebook", label: "E-books", icon: BookOpen },
  ];

  useEffect(() => {
    let active = true;

    const loadContents = async () => {
      setLoading(true);
      const [contentResponse, progressResponse] = await Promise.all([
        supabase
          .from("content_items")
          .select(
            "id,slug,title,description,type,category,status,access,thumbnail_path,thumbnail_url,video_path,video_url,duration_seconds,published_at,created_by,created_at,updated_at,body"
          )
          .in("type", ["lesson", "ebook"])
          .order("created_at", { ascending: false }),
        supabase.from("lesson_progress").select("user_id,content_id,progress_seconds,completed_at,updated_at"),
      ]);

      if (!active) return;
      if (contentResponse.error || progressResponse.error) {
        setContents([]);
        setLoading(false);
        return;
      }

      const viewsByContent = new Map<string, number>();
      (progressResponse.data ?? []).forEach((progress) => {
        viewsByContent.set(progress.content_id, (viewsByContent.get(progress.content_id) ?? 0) + 1);
      });

      const mapped = await Promise.all(
        ((contentResponse.data ?? []) as ContentRow[]).map(async (item) => {
          return {
            id: item.id,
            title: item.title,
            category: item.category,
            type: (item.type === "lesson" ? "video" : "ebook") as "video" | "ebook",
            status: (item.status === "published" ? "publicado" : "rascunho") as "publicado" | "rascunho",
            publishedAt: item.published_at ?? item.created_at,
            views: viewsByContent.get(item.id) ?? 0,
            thumbnailUrl: await resolveContentThumbnail(item),
          };
        })
      );

      setContents(mapped);
      setLoading(false);
    };

    void loadContents();

    return () => {
      active = false;
    };
  }, [supabase, refreshKey]);

  const filtered = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    return contents.filter((content) => {
      const matchTab = content.type === activeTab;
      const matchStatus = statusFilter === "todos" || content.status === statusFilter;
      const matchSearch = !normalizedSearch || content.title.toLowerCase().includes(normalizedSearch);
      return matchTab && matchStatus && matchSearch;
    });
  }, [contents, deferredSearch, activeTab, statusFilter]);

  return (
    <div className="px-5 lg:px-8 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-content-primary mb-1">Conteúdo</h1>
          <p className="text-sm text-content-secondary">
            Gerencie aulas, e-books e artigos do blog
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={15} />}
          onClick={() => setModalOpen(true)}
          className="whitespace-nowrap shrink-0"
        >
          Novo conteúdo
        </Button>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                activeTab === tab.key
                  ? "bg-accent-primary text-white border-accent-primary shadow-glow"
                  : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/40"
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar conteúdo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
            rightIcon={search ? <button onClick={() => setSearch("")}><X size={14} /></button> : null}
          />
        </div>
        <div className="flex gap-2">
          {(["todos", "publicado", "rascunho"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 capitalize",
                statusFilter === s
                  ? "bg-accent-primary/15 border-accent-primary/50 text-accent-secondary"
                  : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/30"
              )}
            >
              {s === "todos" ? "Todos" : s === "publicado" ? "Publicados" : "Rascunhos"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border-subtle bg-background-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-background-tertiary">
                <th className="text-left px-5 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider">Conteúdo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider hidden sm:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider hidden md:table-cell">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider hidden lg:table-cell">Views</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-content-secondary">
                    Carregando conteúdo...
                  </td>
                </tr>
              ) : filtered.map((content, i) => (
                <motion.tr
                  key={content.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-background-tertiary transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 aspect-[2/3] rounded-xl overflow-hidden shrink-0 bg-background-tertiary">
                        <img
                          src={content.thumbnailUrl}
                          alt={content.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm font-medium text-content-primary line-clamp-2 max-w-xs">
                        {content.title}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <Badge variant={categoryVariant[content.category]} size="sm">
                      {categoryLabel[content.category]}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "text-xs font-semibold px-2 py-1 rounded-full",
                      content.status === "publicado"
                        ? "bg-status-successBg text-status-success"
                        : "bg-background-tertiary text-content-disabled"
                    )}>
                      {content.status === "publicado" ? "Publicado" : "Rascunho"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-content-secondary hidden md:table-cell">
                    {formatDate(content.publishedAt)}
                  </td>
                  <td className="px-4 py-4 text-xs text-content-primary font-semibold hidden lg:table-cell">
                    {content.views > 0 ? content.views.toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-content-disabled hover:text-content-primary hover:bg-background-tertiary transition-colors"
                        aria-label="Visualizar"
                        title="Visualizar"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-content-disabled hover:text-accent-secondary hover:bg-accent-primary/10 transition-colors"
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-content-disabled hover:text-status-warning hover:bg-status-warningBg transition-colors"
                        aria-label={content.status === "publicado" ? "Despublicar" : "Publicar"}
                        title={content.status === "publicado" ? "Despublicar" : "Publicar"}
                      >
                        <EyeOff size={14} />
                      </button>
                      <button
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-content-disabled hover:text-status-error hover:bg-status-errorBg transition-colors"
                        aria-label="Excluir"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-content-secondary">
            Nenhum conteúdo encontrado.
          </div>
        )}
      </div>

      <AddContentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => setRefreshKey((current) => current + 1)}
      />
    </div>
  );
}
