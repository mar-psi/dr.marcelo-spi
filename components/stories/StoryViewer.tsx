"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { StoryItem } from "@/data/stories";
import { STORY_AUTHOR, formatStoryTime } from "@/data/stories";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StoryViewerProps {
  stories: StoryItem[];
  initialIndex: number;
  onClose: () => void;
  onSeen: (id: string) => void;
}

const EMOJIS = ["❤️", "🧠", "👏", "💡", "🔥"];

export function StoryViewer({
  stories,
  initialIndex,
  onClose,
  onSeen,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showEmojiFeedback, setShowEmojiFeedback] = useState(false);
  const [muted, setMuted] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const startX = useRef<number>(0);

  const current = stories[currentIndex];
  const DURATION_MS = (current?.duration ?? 15) * 1000;
  const TICK_MS = 50;

  // Progress timer
  const startTimer = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (TICK_MS / DURATION_MS) * 100;
        if (next >= 100) {
          if (progressRef.current) clearInterval(progressRef.current);
          return 100;
        }
        return next;
      });
    }, TICK_MS);
  }, [DURATION_MS]);

  const stopTimer = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  useEffect(() => {
    setProgress(0);
    if (!paused) startTimer();
    onSeen(current?.id);
    return () => stopTimer();
  }, [currentIndex, paused]);

  useEffect(() => {
    if (paused) stopTimer();
    else startTimer();
  }, [paused]);

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((p) => p + 1);
      setProgress(0);
    } else {
      setAllDone(true);
    }
  }, [currentIndex, stories.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((p) => p - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Auto-advance when progress hits 100
  useEffect(() => {
    if (progress >= 100) {
      handleNext();
    }
  }, [handleNext, progress]);

  // Touch/hold pause
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    holdTimer.current = setTimeout(() => setPaused(true), 150);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (holdTimer.current) clearTimeout(holdTimer.current);

    if (paused) {
      setPaused(false);
      return;
    }

    const deltaX = e.changedTouches[0].clientX - startX.current;

    // Swipe down to close
    const deltaY = e.changedTouches[0].clientY - (e.target as HTMLElement).getBoundingClientRect().top;
    if (Math.abs(deltaX) < 20) {
      // Vertical tap — check left/right halves
      const screenW = window.innerWidth;
      const tapX = e.changedTouches[0].clientX;
      if (tapX < screenW / 2) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (deltaX > 60) {
      handlePrev();
    } else if (deltaX < -60) {
      handleNext();
    }
  };

  const handleEmojiReact = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowEmojiFeedback(true);
    setTimeout(() => setShowEmojiFeedback(false), 1500);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyText("");
  };

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Desktop: previous story arrow */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Story anterior"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Desktop: next story arrow */}
      {currentIndex < stories.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Próximo story"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Story card */}
      <AnimatePresence mode="wait">
        {!allDone ? (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-[400px] h-[85vh] max-h-[780px] rounded-2xl overflow-hidden bg-black shadow-[0_24px_80px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Background media */}
            <div className="absolute inset-0">
              <img
                src={current.thumbnailUrl}
                alt={current.title}
                className={cn("w-full h-full object-cover", current.videoUrl && "hidden")}
              />
              {current.videoUrl && (
                <video
                  src={current.videoUrl}
                  poster={current.thumbnailIsVideo ? undefined : current.thumbnailUrl}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted={muted}
                  playsInline
                  controls={false}
                  onPlay={() => setPaused(false)}
                  onPause={() => setPaused(true)}
                />
              )}
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85" />
            </div>

            {/* ── Progress bars ─────────────────────────── */}
            <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
              {stories.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-white rounded-full"
                    style={{
                      width:
                        i < currentIndex
                          ? "100%"
                          : i === currentIndex
                          ? `${progress}%`
                          : "0%",
                    }}
                    transition={i === currentIndex ? { duration: 0 } : {}}
                  />
                </div>
              ))}
            </div>

            {/* ── Header ────────────────────────────────── */}
            <div className="absolute top-8 left-3 right-3 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/40 shrink-0">
                  <img
                    src={STORY_AUTHOR.avatar}
                    alt={STORY_AUTHOR.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">
                    {STORY_AUTHOR.name}
                  </p>
                  <p className="text-[11px] text-white/60">
                    {formatStoryTime(current.publishedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMuted(!muted)}
                  className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                  aria-label={muted ? "Ativar som" : "Silenciar"}
                >
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                  aria-label="Fechar stories"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Content area ──────────────────────────── */}
            <div className="absolute inset-0 flex flex-col justify-end pb-24 px-4">
              {/* Category badge */}
              <div className="mb-2">
                <span className={cn(
                  "text-[10px] font-semibold px-2.5 py-1 rounded-full border",
                  current.category === "doencas"
                    ? "bg-[rgba(124,58,237,0.3)] border-[rgba(124,58,237,0.5)] text-accent-secondary"
                    : current.category === "transtornos"
                    ? "bg-[rgba(59,130,246,0.3)] border-[rgba(59,130,246,0.5)] text-blue-300"
                    : "bg-[rgba(34,197,94,0.3)] border-[rgba(34,197,94,0.5)] text-green-300"
                )}>
                  {current.category === "doencas"
                    ? "Doenças"
                    : current.category === "transtornos"
                    ? "Transtornos"
                    : "Curiosidades"}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-white leading-snug mb-1">
                {current.title}
              </h2>
              <p className="text-sm text-white/70 mb-3">{current.theme}</p>

              {/* Reactions counter */}
              {current.reactions && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {Object.entries(current.reactions).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiReact(emoji)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200",
                        selectedEmoji === emoji
                          ? "bg-white/20 border border-white/40 scale-110"
                          : "bg-black/30 border border-white/10 hover:bg-white/15"
                      )}
                    >
                      <span>{emoji}</span>
                      <span className="text-white/80">{count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer: reply ─────────────────────────── */}
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <form
                onSubmit={handleReplySubmit}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setPaused(true)}
                  onBlur={() => setPaused(false)}
                  placeholder="Responder ao Dr. Marcelo…"
                  className="flex-1 h-10 bg-white/10 border border-white/20 rounded-full px-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/50 focus:bg-white/15 transition-all backdrop-blur-sm"
                />
                <button
                  type="submit"
                  className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center text-white shrink-0 hover:bg-accent-primaryHover transition-colors"
                  aria-label="Enviar resposta"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>

            {/* ── Tap zones (mobile) ────────────────────── */}
            <div className="absolute inset-0 z-[5] flex pointer-events-none">
              <div className="w-1/2 h-full pointer-events-auto" />
              <div className="w-1/2 h-full pointer-events-auto" />
            </div>

            {/* Pause indicator */}
            <AnimatePresence>
              {paused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                >
                  <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="flex gap-1">
                      <div className="w-1 h-5 bg-white rounded-full" />
                      <div className="w-1 h-5 bg-white rounded-full" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Emoji reaction floating feedback */}
            <AnimatePresence>
              {showEmojiFeedback && selectedEmoji && (
                <motion.div
                  key={selectedEmoji}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1.4, y: -20 }}
                  exit={{ opacity: 0, scale: 0.5, y: -60 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 text-4xl pointer-events-none"
                >
                  {selectedEmoji}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ── All done screen ──────────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-[400px] h-[85vh] max-h-[780px] rounded-2xl overflow-hidden bg-background-secondary border border-border-subtle flex flex-col items-center justify-center px-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-5xl mb-4"
            >
              🧠
            </motion.div>
            <h3 className="text-xl font-bold text-content-primary mb-2">
              Você viu tudo por hoje!
            </h3>
            <p className="text-sm text-content-secondary mb-6">
              Novos stories do Dr. Marcelo amanhã. Enquanto isso, que tal aprofundar
              o conhecimento com uma aula?
            </p>
            <Link
              href="/aulas"
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-accent-primary text-white font-semibold text-sm shadow-glow hover:bg-accent-primaryHover transition-all"
              onClick={onClose}
            >
              Ver aulas relacionadas
            </Link>
            <button
              onClick={onClose}
              className="mt-3 text-xs text-content-disabled hover:text-content-secondary transition-colors"
            >
              Fechar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
