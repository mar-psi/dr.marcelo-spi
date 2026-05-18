"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ExternalLink, FileText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui";
import type { Material } from "@/data/aulas";

interface PDFViewerProps {
  material: Material;
  isOpen: boolean;
  onClose: () => void;
}

export function PDFViewer({ material, isOpen, onClose }: PDFViewerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Viewer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 flex flex-col w-full max-w-4xl mx-auto h-full max-h-[95vh] my-auto bg-background-secondary border border-border-subtle rounded-2xl overflow-hidden shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle shrink-0 bg-background-tertiary">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center">
                  <FileText size={15} className="text-accent-secondary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-content-primary leading-tight">
                    {material.title}
                  </p>
                  <p className="text-xs text-content-secondary">
                    {material.pages} páginas · PDF
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={material.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-accent-secondary hover:text-accent-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-background-secondary"
                >
                  <ExternalLink size={13} />
                  Abrir
                </a>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-background-secondary transition-colors"
                  aria-label="Fechar visualizador"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* PDF embed area */}
            <div className="flex-1 overflow-hidden bg-[#1a1a1a]">
              <iframe
                src={`${material.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-0"
                title={material.title}
              />
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-3 border-t border-border-subtle flex items-center justify-between bg-background-tertiary">
              <p className="text-xs text-content-disabled">
                Material disponível gratuitamente com sua conta
              </p>
              <a href={material.fileUrl} download>
                <Button variant="primary" size="sm" leftIcon={<Download size={13} />}>
                  Baixar PDF
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Card de material ────────────────────────────────────────── */
interface MaterialCardProps {
  material: Material;
}

export function MaterialCard({ material }: MaterialCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <>
      <motion.div
        className="group flex items-center gap-3 p-3 rounded-xl bg-background-tertiary border border-border-subtle hover:border-accent-primary/40 transition-all duration-200 cursor-pointer hover:shadow-glow"
        whileHover={{ x: 2 }}
        onClick={() => setViewerOpen(true)}
      >
        {/* Cover */}
        <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0">
          <img
            src={material.coverUrl}
            alt={material.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-content-primary line-clamp-2 leading-snug group-hover:text-accent-secondary transition-colors">
            {material.title}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-content-secondary">
            <BookOpen size={11} />
            <span>{material.pages} páginas</span>
            <span className="uppercase text-content-disabled font-mono text-[10px]">
              {material.type}
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center group-hover:bg-accent-primary/20 transition-colors">
            <ExternalLink size={13} className="text-accent-secondary" />
          </div>
        </div>
      </motion.div>

      <PDFViewer
        material={material}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}
