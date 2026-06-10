"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  Eye,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { StoryUpload, type StoryUploadData } from "@/components/stories/StoryUpload";
import { StoryCoverUpload } from "@/components/stories/StoryCoverUpload";
import { Badge, Button, Input, useToast } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import type { Database } from "@/types/database";

type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
type StoryViewRow = Database["public"]["Tables"]["story_views"]["Row"];
type StoryStatusFilter = "todos" | "published" | "archived";

interface AdminStoryItem {
  id: string;
  title: string;
  theme: string;
  category: StoryRow["category"];
  status: StoryRow["status"];
  mediaPath: string | null;
  thumbnailPath: string | null;
  mediaUrl: string | null;
  duration: number;
  views: number;
  publishedAt: string | null;
  createdAt: string;
}

const categoryVariant: Record<StoryRow["category"], "doencas" | "transtornos" | "curiosidades"> = {
  doencas: "doencas",
  transtornos: "transtornos",
  curiosidades: "curiosidades",
};

const categoryLabel: Record<StoryRow["category"], string> = {
  doencas: "Doenças",
  transtornos: "Transtornos",
  curiosidades: "Curiosidades",
};

const statusLabel: Record<StoryRow["status"], string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px) and (pointer: coarse)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function isVideoPath(path: string | null) {
  return /\.(mp4|webm|mov)$/i.test(path ?? "");
}

function safeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

async function getSignedMediaUrl(path: string | null) {
  if (!path) return null;
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from("story-media")
    .createSignedUrl(path, 60 * 30);

  if (error) return null;
  return data.signedUrl;
}

export default function AdminStoriesPage() {
  const supabase = createSupabaseBrowserClient();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [stories, setStories] = useState<AdminStoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StoryStatusFilter>("todos");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [coverStory, setCoverStory] = useState<AdminStoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStories = async () => {
    setLoading(true);
    const [storiesResponse, viewsResponse] = await Promise.all([
      supabase
        .from("stories")
        .select("id,title,theme,category,status,media_path,thumbnail_path,duration_seconds,published_at,created_at")
        .order("created_at", { ascending: false }),
      supabase.from("story_views").select("story_id,user_id,seen_at"),
    ]);

    if (storiesResponse.error || viewsResponse.error) {
      toast({
        variant: "error",
        title: "Não foi possível carregar stories",
        message: storiesResponse.error?.message ?? viewsResponse.error?.message,
      });
      setLoading(false);
      return;
    }

    const viewsByStory = new Map<string, number>();
    ((viewsResponse.data ?? []) as StoryViewRow[]).forEach((view) => {
      viewsByStory.set(view.story_id, (viewsByStory.get(view.story_id) ?? 0) + 1);
    });

    const nextStories = await Promise.all(
      (storiesResponse.data ?? []).map(async (story) => {
        const displayPath = story.thumbnail_path ?? story.media_path;
        return {
          id: story.id,
          title: story.title,
          theme: story.theme,
          category: story.category,
          status: story.status,
          mediaPath: story.media_path,
          thumbnailPath: story.thumbnail_path,
          mediaUrl: await getSignedMediaUrl(displayPath),
          duration: story.duration_seconds,
          views: viewsByStory.get(story.id) ?? 0,
          publishedAt: story.published_at,
          createdAt: story.created_at,
        };
      })
    );

    setStories(nextStories);
    setLoading(false);
  };

  useEffect(() => {
    void loadStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return stories.filter((story) => {
      const matchSearch =
        !search ||
        story.title.toLowerCase().includes(search.toLowerCase()) ||
        story.theme.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "todos" || story.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, stories]);

  const publishedCount = stories.filter((story) => story.status === "published").length;

  const handleOpenUpload = () => {
    if (!isMobile) {
      toast({
        variant: "warning",
        title: "Stories apenas no mobile",
        message: "Abra o painel admin pelo celular para gravar e publicar stories.",
      });
      return;
    }
    setUploadOpen(true);
  };

  const handleSubmit = async (data: StoryUploadData) => {
    if (!isMobile) {
      throw new Error("A publicação de stories está liberada apenas em dispositivos móveis.");
    }
    if (!data.file) {
      throw new Error("Selecione ou grave um arquivo para publicar.");
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Faça login novamente antes de publicar.");
    }

    const fileId =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const path = `${user.id}/${fileId}-${safeFileName(data.file.name)}`;
    let uploadedPath: string | null = null;
    let uploadedThumbnailPath: string | null = null;

    const uploadResult = await supabase.storage
      .from("story-media")
      .upload(path, data.file, {
        cacheControl: "3600",
        contentType: data.file.type,
        upsert: false,
      });

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message);
    }
    uploadedPath = uploadResult.data.path;

    const isImage = data.file.type.startsWith("image/");
    if (!isImage) {
      if (!data.generatedThumbnail) {
        await supabase.storage.from("story-media").remove([uploadedPath]);
        throw new Error("Não foi possível gerar a capa automática deste vídeo.");
      }

      const thumbnailPath = `${user.id}/${fileId}-cover.webp`;
      const thumbnailUpload = await supabase.storage
        .from("story-media")
        .upload(thumbnailPath, data.generatedThumbnail, {
          cacheControl: "31536000",
          contentType: "image/webp",
          upsert: false,
        });

      if (thumbnailUpload.error) {
        await supabase.storage.from("story-media").remove([uploadedPath]);
        throw new Error(thumbnailUpload.error.message);
      }
      uploadedThumbnailPath = thumbnailUpload.data.path;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const insertResult = await supabase.from("stories").insert({
      title: data.title.trim(),
      theme: data.theme.trim(),
      category: data.category,
      status: "published",
      access: data.access,
      media_path: uploadedPath,
      thumbnail_path: isImage ? uploadedPath : uploadedThumbnailPath,
      duration_seconds: data.durationSeconds || (isImage ? 15 : 0),
      published_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    });

    if (insertResult.error) {
      if (uploadedPath) {
        await supabase.storage
          .from("story-media")
          .remove([uploadedPath, uploadedThumbnailPath].filter((path): path is string => Boolean(path)));
      }
      throw new Error(insertResult.error.message);
    }

    toast({
      variant: "success",
      title: "Story publicado",
      message: "O story já está salvo no Supabase.",
    });
    await loadStories();
  };

  const archiveStory = async (storyId: string) => {
    const { error } = await supabase
      .from("stories")
      .update({ status: "archived" })
      .eq("id", storyId);

    if (error) {
      toast({ variant: "error", title: "Não foi possível arquivar", message: error.message });
      return;
    }

    toast({ variant: "success", title: "Story arquivado" });
    await loadStories();
  };

  const updateStoryCover = async (cover: Blob) => {
    if (!coverStory) return;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Faça login novamente antes de salvar a capa.");
    }

    const fileId =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const newPath = `${user.id}/${coverStory.id}/cover-${fileId}.webp`;

    const uploadResult = await supabase.storage.from("story-media").upload(newPath, cover, {
      cacheControl: "31536000",
      contentType: "image/webp",
      upsert: false,
    });

    if (uploadResult.error) throw new Error(uploadResult.error.message);

    const updateResult = await supabase
      .from("stories")
      .update({ thumbnail_path: uploadResult.data.path })
      .eq("id", coverStory.id);

    if (updateResult.error) {
      await supabase.storage.from("story-media").remove([uploadResult.data.path]);
      throw new Error(updateResult.error.message);
    }

    if (coverStory.thumbnailPath && coverStory.thumbnailPath !== coverStory.mediaPath) {
      await supabase.storage.from("story-media").remove([coverStory.thumbnailPath]);
    }

    toast({
      variant: "success",
      title: "Capa atualizada",
      message: "A nova capa já está disponível para os alunos.",
    });
    await loadStories();
  };

  return (
    <div className="px-5 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-content-primary mb-1">Stories</h1>
          <p className="text-sm text-content-secondary">
            {stories.length} stories · {publishedCount} publicados · {stories.reduce((sum, story) => sum + story.views, 0).toLocaleString("pt-BR")} visualizações
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={handleOpenUpload} className="whitespace-nowrap shrink-0">
          Novo story
        </Button>
      </div>

      <div className="mb-6 rounded-xl border border-border-subtle bg-background-secondary p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-primary/15 flex items-center justify-center shrink-0">
            {isMobile ? (
              <ShieldCheck size={18} className="text-status-success" />
            ) : (
              <Smartphone size={18} className="text-accent-secondary" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-content-primary">
              {isMobile ? "Gravação mobile ativa" : "Publicação disponível apenas no mobile"}
            </p>
            <p className="text-xs text-content-secondary mt-1 leading-relaxed">
              {isMobile
                ? "Use a câmera do celular ou selecione um vídeo/imagem vertical para publicar no Supabase."
                : "Para gravar e enviar stories, acesse este painel pelo celular. No desktop a listagem continua disponível, mas a publicação fica bloqueada."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar story por título ou tema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
            rightIcon={search ? <button onClick={() => setSearch("")}><X size={14} /></button> : null}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["todos", "published", "archived"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap",
                statusFilter === status
                  ? "bg-accent-primary text-white border-accent-primary shadow-glow"
                  : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/40"
              )}
            >
              {status === "todos" ? "Todos" : statusLabel[status]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center text-content-secondary">
          <Loader2 size={22} className="animate-spin mr-2" />
          Carregando stories...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-border-subtle bg-background-secondary">
          <Smartphone size={34} className="mx-auto mb-3 text-content-disabled" />
          <p className="text-sm font-semibold text-content-primary">Nenhum story encontrado</p>
          <p className="text-xs text-content-secondary mt-1">
            Publique o primeiro story pelo celular para preencher esta área.
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
        >
          {filtered.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04 }}
              className="group relative rounded-xl overflow-hidden bg-background-secondary border border-border-subtle hover:border-accent-primary/40 hover:shadow-glow transition-all duration-200"
            >
              <div className="relative" style={{ aspectRatio: "9/16" }}>
                {story.mediaUrl ? (
                  isVideoPath(story.thumbnailPath ?? story.mediaPath) ? (
                    <video
                      src={story.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={story.mediaUrl}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full bg-background-tertiary flex items-center justify-center text-xs text-content-disabled text-center px-4">
                    Mídia privada
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-2 left-2">
                  <Badge variant={categoryVariant[story.category]} size="sm">
                    {categoryLabel[story.category]}
                  </Badge>
                </div>

                <div className="absolute top-2 right-2">
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                      story.status === "published"
                        ? "bg-status-successBg text-status-success"
                        : "bg-background-tertiary text-content-disabled"
                    )}
                  >
                    {statusLabel[story.status]}
                  </span>
                </div>

                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs font-bold text-white line-clamp-2 leading-snug mb-1">
                    {story.title}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-white/60">
                    <span>{formatDate(story.publishedAt ?? story.createdAt)}</span>
                    <span>{story.views.toLocaleString("pt-BR")} views · {story.duration}s</span>
                  </div>
                </div>

                <div className="absolute inset-0 bg-black/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200">
                  {story.mediaUrl && (
                    <a
                      href={story.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-content-secondary hover:text-content-primary transition-colors"
                      aria-label="Visualizar"
                    >
                      <Eye size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => setCoverStory(story)}
                    className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-accent-secondary hover:text-content-primary transition-colors"
                    aria-label={story.thumbnailPath ? "Trocar capa" : "Adicionar capa"}
                    title={story.thumbnailPath ? "Trocar capa" : "Adicionar capa"}
                  >
                    <ImagePlus size={14} />
                  </button>
                  {story.status !== "archived" && (
                    <button
                      onClick={() => void archiveStory(story.id)}
                      className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-status-error hover:opacity-80 transition-opacity"
                      aria-label="Arquivar"
                    >
                      <Archive size={14} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <StoryUpload
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleSubmit}
        mobileOnly
      />
      <StoryCoverUpload
        isOpen={Boolean(coverStory)}
        storyTitle={coverStory?.title ?? ""}
        currentCoverUrl={coverStory?.thumbnailPath ? coverStory.mediaUrl : null}
        onClose={() => setCoverStory(null)}
        onSubmit={updateStoryCover}
      />
    </div>
  );
}
