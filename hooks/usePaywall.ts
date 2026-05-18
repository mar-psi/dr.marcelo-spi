"use client";

import { useState, useCallback } from "react";

interface UsePaywallReturn {
  isOpen: boolean;
  contentTitle: string | undefined;
  contentType: "aula" | "ebook" | "quiz" | "story";
  open: (title?: string, type?: "aula" | "ebook" | "quiz" | "story") => void;
  close: () => void;
}

export function usePaywall(): UsePaywallReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [contentTitle, setContentTitle] = useState<string | undefined>();
  const [contentType, setContentType] = useState<"aula" | "ebook" | "quiz" | "story">("aula");

  const open = useCallback(
    (
      title?: string,
      type: "aula" | "ebook" | "quiz" | "story" = "aula"
    ) => {
      setContentTitle(title);
      setContentType(type);
      setIsOpen(true);
    },
    []
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setContentTitle(undefined);
  }, []);

  return { isOpen, contentTitle, contentType, open, close };
}
