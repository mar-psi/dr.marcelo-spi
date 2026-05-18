"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Lock,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  isYouTubeUrl,
} from "@/lib/youtube";

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  slug: string;
  isFree: boolean;
  savedProgress?: number;
  onProgressUpdate?: (progress: number, currentTime: number, duration: number) => void;
  onComplete?: () => void;
}

type YouTubePlayerState = -1 | 0 | 1 | 2 | 3 | 5;

type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => YouTubePlayerState;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId?: string;
          host?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: () => void;
            onStateChange?: (event: { data: YouTubePlayerState }) => void;
          };
        }
      ) => YouTubePlayer;
      PlayerState: {
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const PREVIEW_SECONDS = 120;
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function isReadyYouTubePlayer(player: YouTubePlayer | null): player is YouTubePlayer {
  return Boolean(
    player &&
      typeof player.playVideo === "function" &&
      typeof player.pauseVideo === "function" &&
      typeof player.seekTo === "function" &&
      typeof player.getCurrentTime === "function" &&
      typeof player.getDuration === "function"
  );
}

export function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  slug,
  isFree,
  savedProgress = 0,
  onProgressUpdate,
  onComplete,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeHostRef = useRef<HTMLDivElement>(null);
  const nativeVideoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const completedRef = useRef(false);
  const restoredProgressRef = useRef(false);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const onCompleteRef = useRef(onComplete);
  const volumeRef = useRef(85);
  const speedRef = useRef(1);

  const { isSubscriber } = useSubscription();
  const canWatch = isFree || isSubscriber;
  const youtubeId = isYouTubeUrl(videoUrl) ? extractYouTubeVideoId(videoUrl) : null;
  const isYouTube = Boolean(youtubeId);
  const youtubeElementId = youtubeId
    ? `youtube-player-${slug.replace(/[^a-zA-Z0-9_-]/g, "-")}`
    : undefined;

  const [ready, setReady] = useState(!isYouTube);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(85);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [previewBlocked, setPreviewBlocked] = useState(false);
  const [showContinueToast, setShowContinueToast] = useState(savedProgress > 5);

  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
    onCompleteRef.current = onComplete;
  }, [onComplete, onProgressUpdate]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const getYouTubeIframe = useCallback(() => {
    return iframeHostRef.current?.querySelector<HTMLIFrameElement>("iframe") ?? null;
  }, []);

  const hardenYouTubeIframe = useCallback(() => {
    const iframe = getYouTubeIframe();
    if (!iframe) return;
    iframe.style.pointerEvents = "none";
    iframe.setAttribute("tabindex", "-1");
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    );
  }, [getYouTubeIframe]);

  const postYouTubeCommand = useCallback(
    (func: string, args: unknown[] = []) => {
      const iframe = getYouTubeIframe();
      iframe?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "https://www.youtube-nocookie.com"
      );
    },
    [getYouTubeIframe]
  );

  const persistProgress = useCallback(
    (time: number, total: number) => {
      if (!canWatch || total <= 0) return;
      const pct = Math.min(100, Math.round((time / total) * 100));
      localStorage.setItem(`progress_${slug}`, String(time));
      onProgressUpdateRef.current?.(pct, time, total);
      if (pct >= 90 && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    },
    [canWatch, slug]
  );

  useEffect(() => {
    if (!isYouTube || !youtubeId || !iframeHostRef.current) return;

    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    fallbackTimer = setTimeout(() => {
      if (cancelled || !getYouTubeIframe()) return;
      hardenYouTubeIframe();
      setReady(true);
    }, 1500);

    void loadYouTubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;

      if (!youtubeElementId) return;

      playerRef.current = new window.YT.Player(youtubeElementId, {
        events: {
          onReady: () => {
            if (cancelled || !playerRef.current) return;
            hardenYouTubeIframe();
            if (isReadyYouTubePlayer(playerRef.current)) {
              playerRef.current.setVolume(volumeRef.current);
              playerRef.current.setPlaybackRate(speedRef.current);
              const total = playerRef.current.getDuration();
              setDuration(Number.isFinite(total) ? total : 0);
            }
            setReady(true);
          },
          onStateChange: (event) => {
            setPlaying(event.data === 1);
            if (event.data === 0) {
              setPlaying(false);
              if (!completedRef.current) {
                completedRef.current = true;
                onCompleteRef.current?.();
              }
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [
    getYouTubeIframe,
    hardenYouTubeIframe,
    isYouTube,
    youtubeElementId,
    youtubeId,
  ]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (isYouTube && isReadyYouTubePlayer(playerRef.current)) {
        const time = playerRef.current.getCurrentTime() || 0;
        const total = playerRef.current.getDuration() || duration;
        setCurrentTime(time);
        if (total > 0) setDuration(total);

        if (!canWatch && time >= PREVIEW_SECONDS) {
          playerRef.current.pauseVideo();
          setPreviewBlocked(true);
          setPlaying(false);
        }

        if (playing) persistProgress(time, total);
      }

      if (!isYouTube && nativeVideoRef.current) {
        const video = nativeVideoRef.current;
        setCurrentTime(video.currentTime || 0);
        setDuration(video.duration || 0);
        if (playing) persistProgress(video.currentTime, video.duration);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [canWatch, duration, isYouTube, persistProgress, playing]);

  useEffect(() => {
    const prevent = (event: Event) => event.preventDefault();
    const container = containerRef.current;
    container?.addEventListener("contextmenu", prevent);
    return () => container?.removeEventListener("contextmenu", prevent);
  }, []);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const togglePlay = () => {
    if ((!ready && !isYouTube) || previewBlocked) return;

    if (isYouTube) {
      if (playing) {
        if (isReadyYouTubePlayer(playerRef.current)) playerRef.current.pauseVideo();
        else postYouTubeCommand("pauseVideo");
        setPlaying(false);
      } else {
        if (isReadyYouTubePlayer(playerRef.current)) playerRef.current.playVideo();
        else postYouTubeCommand("playVideo");
        setPlaying(true);
      }
      return;
    }

    const video = nativeVideoRef.current;
    if (!video) return;
    if (playing) video.pause();
    else void video.play();
    setPlaying(!playing);
  };

  const seekTo = (seconds: number) => {
    if (!canWatch && seconds > PREVIEW_SECONDS) return;
    const bounded = Math.max(0, Math.min(seconds, duration || seconds));
    if (isYouTube && isReadyYouTubePlayer(playerRef.current)) playerRef.current.seekTo(bounded, true);
    else if (isYouTube) postYouTubeCommand("seekTo", [bounded, true]);
    else if (nativeVideoRef.current) nativeVideoRef.current.currentTime = bounded;
    setCurrentTime(bounded);
  };

  const skip = (delta: number) => seekTo(currentTime + delta);

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    seekTo(ratio * duration);
  };

  const handleVolume = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setVolume(value);
    setMuted(value === 0);
    if (isYouTube && isReadyYouTubePlayer(playerRef.current)) playerRef.current.setVolume(value);
    else if (isYouTube) postYouTubeCommand("setVolume", [value]);
    else if (nativeVideoRef.current) nativeVideoRef.current.volume = value / 100;
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (isYouTube) {
      if (isReadyYouTubePlayer(playerRef.current)) {
        if (nextMuted) playerRef.current.mute();
        else playerRef.current.unMute();
      } else {
        postYouTubeCommand(nextMuted ? "mute" : "unMute");
      }
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.muted = nextMuted;
    }
  };

  const setPlaybackSpeed = (value: number) => {
    setSpeed(value);
    setShowSpeed(false);
    if (isYouTube && isReadyYouTubePlayer(playerRef.current)) playerRef.current.setPlaybackRate(value);
    else if (isYouTube) postYouTubeCommand("setPlaybackRate", [value]);
    else if (nativeVideoRef.current) nativeVideoRef.current.playbackRate = value;
  };

  const toggleFullscreen = () => {
    const element = containerRef.current;
    if (!element) return;
    if (!document.fullscreenElement) {
      void element.requestFullscreen();
      setFullscreen(true);
    } else {
      void document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const restoreProgress = () => {
    const saved = Number(localStorage.getItem(`progress_${slug}`) ?? savedProgress);
    if (Number.isFinite(saved) && saved > 0) seekTo(saved);
    setShowContinueToast(false);
  };

  useEffect(() => {
    if (!ready || restoredProgressRef.current || savedProgress <= 5) return;
    restoredProgressRef.current = true;
    seekTo(savedProgress);
    setShowContinueToast(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, savedProgress]);

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const previewProgress = !canWatch
    ? Math.min(100, (currentTime / PREVIEW_SECONDS) * 100)
    : progress;

  return (
    <div
      ref={containerRef}
      data-testid="video-player"
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {isYouTube && youtubeId ? (
        <>
          <div ref={iframeHostRef} className="youtube-player-shell absolute inset-0 h-full w-full">
            <iframe
              id={youtubeElementId}
              src={getYouTubeEmbedUrl(youtubeId)}
              title={title}
              className="h-full w-full pointer-events-none"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              tabIndex={-1}
            />
          </div>
          {!ready && (
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </>
      ) : (
        <video
          ref={nativeVideoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          className="h-full w-full object-contain"
          onLoadedMetadata={(event) => {
            setDuration(event.currentTarget.duration);
            setReady(true);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            onComplete?.();
          }}
          onClick={togglePlay}
          playsInline
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
        />
      )}

      <div
        className="absolute inset-0 z-10"
        onClick={togglePlay}
        aria-label={playing ? "Pausar video" : "Reproduzir video"}
      />

      {!ready && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        </div>
      )}

      <AnimatePresence>
        {showContinueToast && canWatch && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border-subtle bg-background-secondary/95 px-4 py-3 shadow-card"
          >
            <p className="text-sm text-content-primary">Continuar de onde parou?</p>
            <button
              onClick={restoreProgress}
              className="text-xs font-semibold text-accent-secondary hover:text-accent-primary"
            >
              Sim
            </button>
            <button
              onClick={() => setShowContinueToast(false)}
              className="text-xs text-content-disabled hover:text-content-secondary"
            >
              Nao
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewBlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 px-6 text-center backdrop-blur-sm"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-primary bg-accent-primary/20">
              <Lock size={28} className="text-accent-secondary" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-content-primary">Preview encerrado</h3>
            <p className="mb-6 max-w-xs text-sm text-content-secondary">
              Voce assistiu os primeiros 2 minutos gratuitos. Assine para continuar.
            </p>
            <Button variant="primary" size="lg" asChild>
              <Link href="/assinatura">Assinar por R$15/mes</Link>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && !previewBlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between bg-gradient-to-b from-black/80 to-transparent p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-xs text-white/60">
                  {isYouTube ? "Video seguro via YouTube" : "Video da plataforma"}
                </p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center gap-5">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  skip(-10);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/70"
                aria-label="Voltar 10 segundos"
              >
                <RotateCcw size={18} />
              </button>
              <button
                data-testid="video-main-play-toggle"
                onClick={(event) => {
                  event.stopPropagation();
                  togglePlay();
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary text-white shadow-glow transition-transform hover:scale-105"
                aria-label={playing ? "Pausar" : "Reproduzir"}
              >
                {playing ? <Pause size={26} fill="white" /> : <Play size={26} fill="white" className="ml-1" />}
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  skip(10);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/70"
                aria-label="Avancar 10 segundos"
              >
                <RotateCw size={18} />
              </button>
            </div>

            <div className="bg-gradient-to-t from-black/90 to-transparent p-4">
              <div
                className="mb-3 h-2 cursor-pointer rounded-full bg-white/20"
                onClick={(event) => {
                  event.stopPropagation();
                  handleProgressClick(event);
                }}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width]",
                    canWatch ? "bg-accent-primary" : "bg-status-warning"
                  )}
                  style={{ width: `${canWatch ? progress : previewProgress}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  data-testid="video-play-toggle"
                  onClick={(event) => {
                    event.stopPropagation();
                    togglePlay();
                  }}
                  className="text-white hover:text-accent-secondary"
                  aria-label={playing ? "Pausar pela barra de controles" : "Reproduzir pela barra de controles"}
                >
                  {playing ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                </button>

                <span className="min-w-[92px] text-xs tabular-nums text-white/80">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleMute();
                  }}
                  className="text-white hover:text-accent-secondary"
                  aria-label={muted ? "Ativar som" : "Silenciar"}
                >
                  {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={muted ? 0 : volume}
                  onClick={(event) => event.stopPropagation()}
                  onChange={handleVolume}
                  className="h-1 w-20 accent-accent-primary"
                  aria-label="Volume"
                />

                <div className="relative ml-auto">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setShowSpeed((current) => !current);
                    }}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    {speed}x
                  </button>
                  {showSpeed && (
                    <div className="absolute bottom-8 right-0 overflow-hidden rounded-lg border border-white/10 bg-black/90">
                      {SPEEDS.map((item) => (
                        <button
                          key={item}
                          onClick={(event) => {
                            event.stopPropagation();
                            setPlaybackSpeed(item);
                          }}
                          className={cn(
                            "block w-full px-4 py-2 text-left text-xs text-white hover:bg-white/10",
                            speed === item && "text-accent-secondary"
                          )}
                        >
                          {item}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleFullscreen();
                  }}
                  className="text-white hover:text-accent-secondary"
                  aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
                >
                  {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
