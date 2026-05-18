"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  BookOpen,
  History,
  Trophy,
  CreditCard,
  Trash2,
  Camera,
  CheckCircle2,
  Play,
  FileText,
  HelpCircle,
  Clock,
  Flame,
  ChevronRight,
  Edit2,
  X,
  Loader2,
} from "lucide-react";
import {
  badgesData,
  getUserLevel,
  getLevelProgress,
  getXpToNextLevel,
  XP_ACTIONS,
} from "@/data/badges";
import { Avatar, Badge, useToast } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { getLessonProgressPercent, resolveContentThumbnail } from "@/lib/content";
import { compressImageToWebp } from "@/lib/image-compression";
import { formatDate, formatDuration, cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

// ── Types ─────────────────────────────────────────────────

type ProfileTab = "salvos" | "historico" | "conquistas" | "configuracoes";
type ContentRow = Database["public"]["Tables"]["content_items"]["Row"];
type SavedRow = Database["public"]["Tables"]["saved_content"]["Row"];
type ProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];
type QuizAttemptRow = Database["public"]["Tables"]["quiz_attempts"]["Row"];
type StoryViewRow = Database["public"]["Tables"]["story_views"]["Row"];
type EbookDownloadRow = Database["public"]["Tables"]["user_ebook_downloads"]["Row"];
type PreferencesRow = Database["public"]["Tables"]["user_preferences"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type ProfileIdentity = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

interface ProfileStats {
  xp: number;
  aulasConcluidas: number;
  quizzesRespondidos: number;
  storiesVistos: number;
  streakDays: number;
  memberSince: string;
}

interface ProfileContentItem {
  id: string;
  slug: string;
  title: string;
  type: "aula" | "ebook" | "quiz";
  category: "doencas" | "transtornos" | "curiosidades";
  thumbnailUrl: string;
  savedAt?: string;
  watchedAt?: string;
  progress?: number;
  duration?: number;
}

const tabs: { key: ProfileTab; label: string; icon: React.ElementType }[] = [
  { key: "salvos", label: "Minha Lista", icon: BookOpen },
  { key: "historico", label: "Histórico", icon: History },
  { key: "conquistas", label: "Conquistas", icon: Trophy },
  { key: "configuracoes", label: "Configurações", icon: Settings },
];

const typeIcon: Record<string, React.ElementType> = {
  aula: Play,
  ebook: FileText,
  quiz: HelpCircle,
};

const typeLabel: Record<string, string> = {
  aula: "Aula",
  ebook: "E-book",
  quiz: "Quiz",
};

const categoryVariant: Record<string, "doencas" | "transtornos" | "curiosidades"> = {
  doencas: "doencas",
  transtornos: "transtornos",
  curiosidades: "curiosidades",
};

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}

// ── Edit Profile Modal ─────────────────────────────────────

function EditProfileModal({
  isOpen,
  onClose,
  initialName,
  initialEmail,
  initialAvatarUrl,
  onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  initialEmail: string;
  initialAvatarUrl: string | null;
  onUpdated: (data: ProfileIdentity) => void;
}) {
  const supabase = createSupabaseBrowserClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingAvatar, setProcessingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName);
    setEmail(initialEmail);
    setAvatarUrl(initialAvatarUrl);
    setAvatarBlob(null);
    setAvatarPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setSaved(false);
  }, [initialAvatarUrl, initialEmail, initialName, isOpen]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setProcessingAvatar(true);
    try {
      const webpBlob = await compressImageToWebp(file, {
        width: 512,
        height: 512,
        quality: 0.82,
        fit: "cover",
      });
      const previewUrl = URL.createObjectURL(webpBlob);
      setAvatarBlob(webpBlob);
      setAvatarPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return previewUrl;
      });
      setSaved(false);
    } catch (error) {
      toast({
        variant: "error",
        title: "Não foi possível usar essa imagem",
        message: error instanceof Error ? error.message : "Escolha outra foto.",
      });
    } finally {
      setProcessingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData.user;

    if (!authUser || !trimmedName || !trimmedEmail) {
      setLoading(false);
      toast({ variant: "error", title: "Confira os dados do perfil" });
      return;
    }

    let nextAvatarUrl = avatarUrl;
    if (avatarBlob) {
      const avatarPath = `${authUser.id}/avatar.webp`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(avatarPath, avatarBlob, {
          cacheControl: "31536000",
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        setLoading(false);
        toast({
          variant: "error",
          title: "Não foi possível enviar a foto",
          message: uploadError.message,
        });
        return;
      }

      const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
      nextAvatarUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;
    }

    const { error: authError } = await supabase.auth.updateUser({
      email: trimmedEmail === authUser.email ? undefined : trimmedEmail,
      data: {
        full_name: trimmedName,
        name: trimmedName,
        avatar_url: nextAvatarUrl,
      },
    });

    if (authError) {
      setLoading(false);
      toast({ variant: "error", title: "Não foi possível atualizar", message: authError.message });
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: trimmedName,
        email: trimmedEmail,
        avatar_url: nextAvatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authUser.id);

    if (profileError) {
      setLoading(false);
      toast({ variant: "error", title: "Perfil parcialmente atualizado", message: profileError.message });
      return;
    }

    setLoading(false);
    setSaved(true);
    setAvatarUrl(nextAvatarUrl);
    setAvatarBlob(null);
    onUpdated({ name: trimmedName, email: trimmedEmail, avatarUrl: nextAvatarUrl });
    window.dispatchEvent(
      new CustomEvent("app:profile-updated", {
        detail: { name: trimmedName, email: trimmedEmail, avatarUrl: nextAvatarUrl },
      })
    );
    toast({ variant: "success", title: "Perfil atualizado!", message: "Suas informações foram salvas." });
    setTimeout(onClose, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            className="relative z-10 w-full max-w-md bg-background-secondary rounded-2xl border border-border-subtle shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <h2 className="text-base font-bold text-content-primary">Editar perfil</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-content-secondary hover:bg-background-tertiary transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="flex justify-center mb-2">
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processingAvatar || loading}
                    className="relative group cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Alterar foto de perfil"
                  >
                    <Avatar
                      src={avatarPreviewUrl ?? avatarUrl ?? undefined}
                      name={name}
                      size="lg"
                      className="w-20 h-20"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {processingAvatar ? (
                        <Loader2 size={18} className="text-white animate-spin" />
                      ) : (
                        <Camera size={18} className="text-white" />
                      )}
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processingAvatar || loading}
                    className="text-xs font-semibold text-accent-secondary hover:text-accent-primary disabled:opacity-60 transition-colors"
                  >
                    {processingAvatar ? "Preparando foto..." : "Alterar foto"}
                  </button>
                  <div className="text-center text-[11px] leading-relaxed text-content-disabled max-w-56">
                    PNG ou JPG até 12MB.
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    "w-full h-11 bg-background-tertiary border border-border-subtle rounded-xl px-4",
                    "text-sm text-content-primary placeholder:text-content-disabled",
                    "outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
                    "transition-all duration-200"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full h-11 bg-background-tertiary border border-border-subtle rounded-xl px-4",
                    "text-sm text-content-primary placeholder:text-content-disabled",
                    "outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
                    "transition-all duration-200"
                  )}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl border border-border-subtle text-sm font-medium text-content-secondary hover:text-content-primary hover:border-accent-primary/40 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || saved || processingAvatar}
                  className={cn(
                    "flex-1 h-11 rounded-xl text-sm font-semibold text-white",
                    "bg-accent-primary shadow-glow hover:bg-accent-primaryHover",
                    "transition-all duration-200 disabled:opacity-60",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {saved && <CheckCircle2 size={14} />}
                  {loading ? "Salvando..." : saved ? "Salvo!" : "Salvar alterações"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Saved Tab ──────────────────────────────────────────────

function SavedTab({ items, loading }: { items: ProfileContentItem[]; loading: boolean }) {
  return (
    <div className="space-y-3">
      {loading ? (
        <div className="py-16 text-center text-sm text-content-secondary">
          Carregando sua lista...
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen size={32} className="text-content-disabled mx-auto mb-3" />
          <p className="text-sm text-content-secondary">
            Você ainda não salvou nenhum conteúdo.
          </p>
          <Link
            href="/aulas"
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-accent-secondary hover:text-accent-primary transition-colors font-medium"
          >
            Explorar aulas <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        items.map((item, i) => {
          const Icon = typeIcon[item.type];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-background-secondary border border-border-subtle hover:border-accent-primary/30 transition-all duration-200"
            >
              <div className="w-20 aspect-video rounded-xl overflow-hidden shrink-0 bg-background-tertiary relative">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.progress === 100 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <CheckCircle2 size={18} className="text-status-success" />
                  </div>
                )}
                {item.progress !== undefined && item.progress > 0 && item.progress < 100 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                    <div className="h-full bg-accent-primary" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-background-tertiary border border-border-subtle">
                    <Icon size={10} className="text-content-disabled" />
                    <span className="text-[10px] text-content-disabled">{typeLabel[item.type]}</span>
                  </div>
                  <Badge variant={categoryVariant[item.category]} size="sm">
                    {item.category === "doencas" ? "Doenças" : item.category === "transtornos" ? "Transtornos" : "Curiosidades"}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-content-primary line-clamp-2 leading-snug mb-1">
                  {item.title}
                </p>
                <p className="text-xs text-content-disabled">
                  Salvo em {item.savedAt ? formatDate(item.savedAt) : "recentemente"}
                </p>
              </div>

              <Link
                href={item.type === "aula" ? `/aulas/${item.slug}` : item.type === "quiz" ? `/quizzes/${item.slug}` : `/ebooks`}
                className="shrink-0 w-9 h-9 rounded-xl bg-accent-primary/15 border border-accent-primary/30 flex items-center justify-center text-accent-secondary hover:bg-accent-primary hover:text-white hover:shadow-glow transition-all duration-200"
              >
                <ChevronRight size={15} />
              </Link>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

// ── History Tab ────────────────────────────────────────────

function HistoryTab({ items, loading }: { items: ProfileContentItem[]; loading: boolean }) {
  return (
    <div className="space-y-3">
      {loading ? (
        <div className="py-16 text-center text-sm text-content-secondary">
          Carregando histórico...
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <History size={32} className="text-content-disabled mx-auto mb-3" />
          <p className="text-sm text-content-secondary">
            Seu histórico aparece automaticamente quando você assistir aulas.
          </p>
        </div>
      ) : items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="group flex items-center gap-4 p-4 rounded-2xl bg-background-secondary border border-border-subtle hover:border-accent-primary/30 transition-all"
        >
          <div className="w-20 aspect-video rounded-xl overflow-hidden shrink-0 relative bg-background-tertiary">
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {item.progress === 100 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-status-success" />
              </div>
            )}
            {item.progress !== undefined && item.progress < 100 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                <div className="h-full bg-accent-primary" style={{ width: `${item.progress}%` }} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Badge variant={categoryVariant[item.category]} size="sm" className="mb-1">
              {item.category === "doencas" ? "Doenças" : item.category === "transtornos" ? "Transtornos" : "Curiosidades"}
            </Badge>
            <p className="text-sm font-semibold text-content-primary line-clamp-2 leading-snug mb-1.5">
              {item.title}
            </p>
            <div className="flex items-center gap-3 text-xs text-content-disabled">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {item.duration ? formatDuration(item.duration) : "Live"}
              </span>
              <span>·</span>
              <span>{item.progress === 100 ? "Concluída" : `${item.progress}% assistido`}</span>
              <span>·</span>
              <span>{item.watchedAt ? formatDate(item.watchedAt) : "recentemente"}</span>
            </div>
          </div>

          <Link
            href={`/aulas/${item.slug}`}
            className="shrink-0 w-9 h-9 rounded-xl bg-accent-primary/15 border border-accent-primary/30 flex items-center justify-center text-accent-secondary hover:bg-accent-primary hover:text-white hover:shadow-glow transition-all duration-200"
          >
            <Play size={13} />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

// ── Achievements Tab ───────────────────────────────────────

function AchievementsTab({ stats }: { stats: ProfileStats }) {
  const unlockedBadges = badgesData.filter((badge) => {
    if (badge.id === "iniciante") return true;
    if (badge.id === "primeira_aula") return stats.aulasConcluidas >= 1;
    if (badge.id === "quiz_master") return stats.quizzesRespondidos >= 1;
    return false;
  });

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-gradient-to-br from-accent-primary/10 to-transparent border border-accent-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-bold text-content-primary">{stats.xp} XP</p>
            <p className="text-xs text-content-secondary">Total acumulado</p>
          </div>
          <Link
            href="/conquistas"
            className="flex items-center gap-1.5 text-xs text-accent-secondary hover:text-accent-primary transition-colors font-medium"
          >
            Ver tudo <ChevronRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Aulas", value: stats.aulasConcluidas * XP_ACTIONS.WATCH_LESSON },
            { label: "Quizzes", value: stats.quizzesRespondidos * XP_ACTIONS.COMPLETE_QUIZ },
            { label: "Stories", value: stats.storiesVistos * XP_ACTIONS.VIEW_STORY },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col p-2.5 rounded-xl bg-background-secondary/60 border border-border-subtle">
              <p className="text-sm font-bold text-accent-secondary">+{value} XP</p>
              <p className="text-xs text-content-disabled">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-content-primary">
            Badges desbloqueados ({unlockedBadges.length})
          </h3>
          <Link
            href="/conquistas"
            className="text-xs text-accent-secondary hover:text-accent-primary transition-colors"
          >
            Ver todos
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {unlockedBadges.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-background-secondary border border-border-subtle hover:border-accent-primary/30 transition-colors"
            >
              <span className="text-3xl mb-2">{badge.icon}</span>
              <p className="text-xs font-bold text-content-primary leading-tight">{badge.label}</p>
              <p className="text-[10px] text-accent-secondary mt-0.5">+{badge.xpReward} XP</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Settings Tab ───────────────────────────────────────────

function SettingsTab({ userId }: { userId: string | null | undefined }) {
  const supabase = createSupabaseBrowserClient();
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [preferencesAvailable, setPreferencesAvailable] = useState(true);
  const [preferences, setPreferences] = useState({
    push_notifications: true,
    email_updates: true,
    study_reminders: true,
    marketing_emails: false,
  });
  const [showLoading, setShowLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      if (!userId) {
        setPreferencesReady(true);
        return;
      }

      const { data, error } = await supabase
        .from("user_preferences")
        .select("user_id,push_notifications,email_updates,study_reminders,marketing_emails,created_at,updated_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setPreferencesAvailable(false);
        setPreferencesReady(true);
        return;
      }

      if (data) {
        const row = data as PreferencesRow;
        setPreferences({
          push_notifications: row.push_notifications,
          email_updates: row.email_updates,
          study_reminders: row.study_reminders,
          marketing_emails: row.marketing_emails,
        });
      }

      setPreferencesReady(true);
    };

    void loadPreferences();

    return () => {
      active = false;
    };
  }, [supabase, userId]);

  const handleSave = async () => {
    if (!userId) return;
    setShowLoading(true);
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    setShowLoading(false);

    if (error) {
      setPreferencesAvailable(false);
      toast({
        variant: "error",
        title: "Não foi possível salvar",
        message: "Rode a migration de preferências no Supabase e tente novamente.",
      });
      return;
    }

    setPreferencesAvailable(true);
    toast({ variant: "success", title: "Configurações salvas!" });
  };

  const setPreference = (key: keyof typeof preferences) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    const confirmed = window.confirm(
      "Tem certeza que deseja deletar sua conta? Esta ação remove seu acesso, progresso, salvos e dados vinculados."
    );
    if (!confirmed) return;

    setDeleting(true);
    const { error } = await supabase.rpc("delete_own_account");
    setDeleting(false);

    if (error) {
      toast({
        variant: "error",
        title: "Não foi possível deletar a conta",
        message: "Confirme se a função delete_own_account foi criada no Supabase.",
      });
      return;
    }

    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
    return (
      <button
        onClick={onChange}
        className={cn(
          "relative inline-flex h-6 w-10 items-center rounded-full border-2 transition-all duration-200",
          enabled
            ? "bg-accent-primary border-accent-primary"
            : "bg-background-tertiary border-border-subtle"
        )}
        role="switch"
        aria-checked={enabled}
      >
        <motion.span
          layout
          className="w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ x: enabled ? 16 : 2 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      </button>
    );
  }

  return (
    <div className="space-y-5">
      {!preferencesReady && (
        <div className="rounded-2xl border border-border-subtle bg-background-secondary px-5 py-4 text-sm text-content-secondary">
          Carregando configurações...
        </div>
      )}

      {!preferencesAvailable && (
        <div className="rounded-2xl border border-status-warning/30 bg-status-warningBg px-5 py-4 text-sm text-status-warning">
          Preferências ainda não estão disponíveis no banco. A migration em `supabase/user-preferences-and-account.sql` prepara essa parte.
        </div>
      )}

      <div className="rounded-2xl bg-background-secondary border border-border-subtle overflow-hidden">
        <div className="px-5 py-3 border-b border-border-subtle">
          <p className="text-xs font-bold text-content-primary uppercase tracking-wider">
            Notificações
          </p>
        </div>
        {[
          {
            label: "Notificações push",
            description: "Novos conteúdos e lembretes de estudo",
            enabled: preferences.push_notifications,
            onChange: () => setPreference("push_notifications"),
          },
          {
            label: "E-mails de atualização",
            description: "Novidades e conteúdos exclusivos por e-mail",
            enabled: preferences.email_updates,
            onChange: () => setPreference("email_updates"),
          },
          {
            label: "Lembretes de estudo",
            description: "Sugestões para continuar aulas e quizzes pendentes",
            enabled: preferences.study_reminders,
            onChange: () => setPreference("study_reminders"),
          },
          {
            label: "E-mails promocionais",
            description: "Comunicados comerciais e campanhas futuras",
            enabled: preferences.marketing_emails,
            onChange: () => setPreference("marketing_emails"),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between px-5 py-4 border-b border-border-subtle last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-content-primary">{item.label}</p>
              <p className="text-xs text-content-secondary mt-0.5">{item.description}</p>
            </div>
            <Toggle enabled={item.enabled} onChange={item.onChange} />
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-background-secondary border border-border-subtle overflow-hidden">
        <div className="px-5 py-3 border-b border-border-subtle">
          <p className="text-xs font-bold text-content-primary uppercase tracking-wider">
            Conta
          </p>
        </div>
        {[
          { label: "Alterar senha", icon: Settings, href: "/nova-senha" },
          { label: "Minha assinatura", icon: CreditCard, href: "/assinatura" },
          { label: "Minhas conquistas", icon: Trophy, href: "/conquistas" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between px-5 py-4 border-b border-border-subtle last:border-0 hover:bg-background-tertiary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Icon size={15} className="text-content-disabled group-hover:text-accent-secondary transition-colors" />
                <span className="text-sm font-medium text-content-secondary group-hover:text-content-primary transition-colors">
                  {item.label}
                </span>
              </div>
              <ChevronRight size={14} className="text-content-disabled group-hover:text-accent-secondary transition-colors" />
            </Link>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={showLoading}
        className={cn(
          "w-full h-11 rounded-xl font-semibold text-sm text-white",
          "bg-accent-primary shadow-glow hover:bg-accent-primaryHover",
          "transition-all duration-200 disabled:opacity-60",
          "flex items-center justify-center gap-2"
        )}
      >
        {showLoading && <Loader2 size={14} className="animate-spin" />}
        {showLoading ? "Salvando..." : "Salvar configurações"}
      </button>

      <div className="rounded-2xl bg-background-secondary border border-status-error/20 overflow-hidden">
        <div className="px-5 py-3 border-b border-border-subtle">
          <p className="text-xs font-bold text-status-error uppercase tracking-wider">
            Zona de perigo
          </p>
        </div>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-status-errorBg transition-colors group disabled:opacity-60"
        >
          {deleting ? (
            <Loader2 size={15} className="animate-spin text-status-error" />
          ) : (
            <Trash2 size={15} className="text-status-error" />
          )}
          <span className="text-sm font-medium text-status-error">
            {deleting ? "Deletando conta..." : "Deletar conta"}
          </span>
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function PerfilPage() {
  const supabase = createSupabaseBrowserClient();
  const [activeTab, setActiveTab] = useState<ProfileTab>("salvos");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [stats, setStats] = useState<ProfileStats>({
    xp: 0,
    aulasConcluidas: 0,
    quizzesRespondidos: 0,
    storiesVistos: 0,
    streakDays: 0,
    memberSince: new Date().toISOString(),
  });
  const [savedItems, setSavedItems] = useState<ProfileContentItem[]>([]);
  const [historyItems, setHistoryItems] = useState<ProfileContentItem[]>([]);
  const [profileIdentity, setProfileIdentity] = useState<ProfileIdentity>({
    name: "Aluno",
    email: "",
    avatarUrl: null,
  });
  const { user } = useAuth();
  const { isSubscriber } = useSubscription();

  useEffect(() => {
    let active = true;

    const loadProfileData = async () => {
      if (!user) {
        setLoadingData(false);
        return;
      }

      setLoadingData(true);
      const [
        profileResponse,
        savedResponse,
        progressResponse,
        attemptsResponse,
        viewsResponse,
        downloadsResponse,
        contentsResponse,
      ] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id,email,full_name,avatar_url,role,created_at,updated_at")
            .eq("id", user.id)
            .maybeSingle(),
          supabase.from("saved_content").select("user_id,content_id,saved_at").eq("user_id", user.id),
          supabase
            .from("lesson_progress")
            .select("user_id,content_id,progress_seconds,completed_at,updated_at")
            .eq("user_id", user.id),
          supabase
            .from("quiz_attempts")
            .select("id,quiz_id,user_id,score,answers,elapsed_seconds,created_at")
            .eq("user_id", user.id),
          supabase.from("story_views").select("story_id,user_id,seen_at").eq("user_id", user.id),
          supabase.from("user_ebook_downloads").select("user_id,content_id,downloaded_at").eq("user_id", user.id),
          supabase
            .from("content_items")
            .select("id,slug,title,description,type,category,status,access,thumbnail_path,thumbnail_url,video_path,video_url,duration_seconds,published_at,created_by,created_at,updated_at,body"),
        ]);

      if (!active) return;
      if (
        profileResponse.error ||
        savedResponse.error ||
        progressResponse.error ||
        attemptsResponse.error ||
        viewsResponse.error ||
        downloadsResponse.error ||
        contentsResponse.error
      ) {
        setLoadingData(false);
        return;
      }

      const contents = (contentsResponse.data ?? []) as ContentRow[];
      const contentById = new Map(contents.map((content) => [content.id, content]));
      const progressRows = (progressResponse.data ?? []) as ProgressRow[];
      const progressByContent = new Map(progressRows.map((row) => [row.content_id, row]));

      const nextSaved = await Promise.all(
        ((savedResponse.data ?? []) as SavedRow[])
          .slice()
          .sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime())
          .map(async (saved) => {
            const content = contentById.get(saved.content_id);
            if (!content) return null;
            const progress = progressByContent.get(content.id);
            return {
              id: content.id,
              slug: content.slug,
              title: content.title,
              type: content.type === "ebook" ? "ebook" : "aula",
              category: content.category,
              thumbnailUrl: await resolveContentThumbnail(content),
              savedAt: saved.saved_at,
              progress: progress
                ? getLessonProgressPercent(progress.progress_seconds, content.duration_seconds)
                : undefined,
            } satisfies ProfileContentItem;
          })
      );

      const nextHistory = await Promise.all(
        progressRows
          .slice()
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .map(async (progress) => {
            const content = contentById.get(progress.content_id);
            if (!content) return null;
            return {
              id: content.id,
              slug: content.slug,
              title: content.title,
              type: "aula",
              category: content.category,
              thumbnailUrl: await resolveContentThumbnail(content),
              watchedAt: progress.updated_at,
              duration: content.duration_seconds,
              progress:
                content.duration_seconds > 0
                  ? Math.min(100, Math.round((progress.progress_seconds / content.duration_seconds) * 100))
                  : progress.completed_at
                  ? 100
                  : progress.progress_seconds > 0
                  ? 1
                  : 0,
            } satisfies ProfileContentItem;
          })
      );

      const attempts = (attemptsResponse.data ?? []) as QuizAttemptRow[];
      const storyViews = (viewsResponse.data ?? []) as StoryViewRow[];
      const ebookDownloads = (downloadsResponse.data ?? []) as EbookDownloadRow[];
      const profile = profileResponse.data as ProfileRow | null;
      const completedLessons = progressRows.filter((row) => Boolean(row.completed_at)).length;
      const perfectAttempts = attempts.filter((attempt) => attempt.score >= 100).length;
      const xp =
        completedLessons * XP_ACTIONS.WATCH_LESSON +
        attempts.length * XP_ACTIONS.COMPLETE_QUIZ +
        perfectAttempts * XP_ACTIONS.PERFECT_QUIZ +
        storyViews.length * XP_ACTIONS.VIEW_STORY +
        ebookDownloads.length * XP_ACTIONS.DOWNLOAD_EBOOK;

      setStats({
        xp,
        aulasConcluidas: completedLessons,
        quizzesRespondidos: attempts.length,
        storiesVistos: storyViews.length,
        streakDays: 0,
        memberSince: user.joinedAt,
      });
      setProfileIdentity({
        name: profile?.full_name || user.name,
        email: profile?.email || user.email,
        avatarUrl: profile?.avatar_url || user.avatar || null,
      });
      setSavedItems(nextSaved.filter(Boolean) as ProfileContentItem[]);
      setHistoryItems(nextHistory.filter(Boolean) as ProfileContentItem[]);
      setLoadingData(false);
    };

    void loadProfileData();

    return () => {
      active = false;
    };
  }, [supabase, user]);

  const level = getUserLevel(stats.xp);
  const levelProgress = getLevelProgress(stats.xp);
  const xpToNext = getXpToNextLevel(stats.xp);

  const tabContent: Record<ProfileTab, React.ReactNode> = {
    salvos: <SavedTab items={savedItems} loading={loadingData} />,
    historico: <HistoryTab items={historyItems} loading={loadingData} />,
    conquistas: <AchievementsTab stats={stats} />,
    configuracoes: <SettingsTab userId={user?.id} />,
  };

  return (
    <>
      <div className="px-4 lg:px-6 py-6 max-w-[1400px] mx-auto pb-24 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

          {/* ── Left: profile card ────────────────────── */}
          <div className="space-y-4">
            <FadeIn>
              <div className="relative rounded-2xl bg-background-secondary border border-border-subtle overflow-hidden">
                <div className="h-20 bg-gradient-to-br from-accent-primary/30 via-accent-primary/10 to-transparent" />

                <div className="px-5 pb-5">
                  <div className="flex items-end justify-between -mt-8 mb-4">
                    <div className="relative">
                      <Avatar
                        src={profileIdentity.avatarUrl ?? user?.avatar}
                        name={profileIdentity.name || user?.name || "Aluno"}
                        size="lg"
                        className="w-20 h-20 ring-4 ring-background-secondary"
                      />
                      <button
                        onClick={() => setEditModalOpen(true)}
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent-primary border-2 border-background-secondary flex items-center justify-center shadow-glow hover:bg-accent-primaryHover transition-colors"
                        aria-label="Editar foto"
                      >
                        <Camera size={12} className="text-white" />
                      </button>
                    </div>

                    <button
                      onClick={() => setEditModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-medium text-content-secondary hover:text-content-primary hover:border-accent-primary/40 transition-all"
                    >
                      <Edit2 size={12} />
                      Editar
                    </button>
                  </div>

                  <h1 className="text-xl font-bold text-content-primary">
                    {profileIdentity.name || user?.name || "Aluno"}
                  </h1>
                  <p className="text-sm text-content-secondary mb-3">
                    {profileIdentity.email || user?.email || "email nao informado"}
                  </p>

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {isSubscriber ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-successBg border border-[rgba(34,197,94,0.3)]">
                        <CheckCircle2 size={11} className="text-status-success" />
                        <span className="text-xs font-semibold text-status-success">
                          Assinante ativo
                        </span>
                      </div>
                    ) : (
                      <Link href="/assinatura">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-primary/15 border border-accent-primary/30 hover:bg-accent-primary/25 transition-colors">
                          <span className="text-xs font-semibold text-accent-secondary">
                            Plano gratuito
                          </span>
                          <ChevronRight size={11} className="text-accent-secondary" />
                        </div>
                      </Link>
                    )}

                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                      style={{
                        backgroundColor: `${level.color}18`,
                        borderColor: `${level.color}40`,
                      }}
                    >
                      <span className="text-sm">{level.icon}</span>
                      <span className="text-xs font-bold" style={{ color: level.color }}>
                        {level.name}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-content-secondary font-medium">
                        {stats.xp} XP
                      </span>
                      {xpToNext > 0 && (
                        <span className="text-content-disabled">
                          +{xpToNext} XP pro próximo nível
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2 rounded-full bg-background-tertiary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${levelProgress}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-content-disabled mt-3">
                    Membro desde {formatDate(stats.memberSince)}
                  </p>
                </div>
              </div>
            </FadeIn>

            {/* Quick stats */}
            <FadeIn delay={0.1}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "🎬", value: stats.aulasConcluidas, label: "Aulas", color: "#7C3AED" },
                  { icon: "🎯", value: stats.quizzesRespondidos, label: "Quizzes", color: "#3B82F6" },
                  { icon: "📱", value: stats.storiesVistos, label: "Stories", color: "#F59E0B" },
                  { icon: "🔥", value: `${stats.streakDays}d`, label: "Sequência", color: "#EF4444" },
                ].map(({ icon, value, label, color }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-background-secondary border border-border-subtle text-center"
                  >
                    <span className="text-xl mb-1">{icon}</span>
                    <p className="text-lg font-bold leading-tight" style={{ color }}>
                      {value}
                    </p>
                    <p className="text-xs text-content-disabled">{label}</p>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Quick links (desktop only) */}
            <FadeIn delay={0.15}>
              <div className="hidden lg:flex flex-col rounded-2xl bg-background-secondary border border-border-subtle overflow-hidden">
                {[
                  { icon: Trophy, label: "Conquistas e badges", href: "/conquistas" },
                  { icon: CreditCard, label: "Minha assinatura", href: "/assinatura" },
                  { icon: BookOpen, label: "Explorar aulas", href: "/aulas" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle last:border-0 hover:bg-background-tertiary transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={15} className="text-content-disabled group-hover:text-accent-secondary transition-colors" />
                        <span className="text-sm font-medium text-content-secondary group-hover:text-content-primary transition-colors">
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight size={13} className="text-content-disabled group-hover:text-accent-secondary transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </FadeIn>
          </div>

          {/* ── Right: tabs content ───────────────────── */}
          <div>
            <FadeIn delay={0.05}>
              <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all duration-200",
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

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  {tabContent[activeTab]}
                </motion.div>
              </AnimatePresence>
            </FadeIn>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        initialName={profileIdentity.name || user?.name || "Aluno"}
        initialEmail={profileIdentity.email || user?.email || ""}
        initialAvatarUrl={profileIdentity.avatarUrl ?? user?.avatar ?? null}
        onUpdated={setProfileIdentity}
      />
    </>
  );
}
