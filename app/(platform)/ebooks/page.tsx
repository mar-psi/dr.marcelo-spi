"use client";

import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, FileText, X } from "lucide-react";
import { EbookCard } from "@/components/ebooks/EbookCard";
import { EbookModal } from "@/components/ebooks/EbookModal";
import { PaywallModal } from "@/components/subscription/PaywallModal";
import { SkeletonText } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { resolveContentThumbnail } from "@/lib/content";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { EMPTY_IMAGE, getSignedStorageUrl } from "@/lib/storage";
import type { Ebook } from "@/data/ebooks";
import type { Database } from "@/types/database";

type ContentRow = Database["public"]["Tables"]["content_items"]["Row"];
type TagRow = Database["public"]["Tables"]["content_tags"]["Row"];
type MaterialRow = Database["public"]["Tables"]["content_materials"]["Row"];

const categories = [
  { key: "todas", label: "Todas" },
  { key: "doencas", label: "Doenças" },
  { key: "transtornos", label: "Transtornos" },
  { key: "curiosidades", label: "Curiosidades" },
];

const accessFilters = [
  { key: "todos", label: "Todos" },
  { key: "free", label: "Grátis" },
  { key: "exclusive", label: "Exclusivos" },
];

export default function EbooksPage() {
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [activeCategory, setActiveCategory] = useState("todas");
  const [activeAccess, setActiveAccess] = useState("todos");
  const [selectedEbook, setSelectedEbook] = useState<Ebook | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallTitle, setPaywallTitle] = useState<string | undefined>();

  useEffect(() => {
    let active = true;

    const loadEbooks = async () => {
      setLoading(true);

      const [contentResponse, tagsResponse, materialsResponse] = await Promise.all([
        supabase
          .from("content_items")
          .select(
            "id,slug,title,description,type,category,status,access,thumbnail_path,thumbnail_url,video_path,video_url,duration_seconds,published_at,created_by,created_at,updated_at,body"
          )
          .eq("type", "ebook")
          .eq("status", "published")
          .order("published_at", { ascending: false }),
        supabase.from("content_tags").select("id,content_id,tag"),
        supabase
          .from("content_materials")
          .select("id,content_id,title,type,storage_path,external_url,pages,sort_order,created_at")
          .order("sort_order", { ascending: true }),
      ]);

      if (!active) return;
      if (contentResponse.error || tagsResponse.error || materialsResponse.error) {
        setEbooks([]);
        setLoading(false);
        return;
      }

      const tagsByContent = new Map<string, string[]>();
      (tagsResponse.data as TagRow[]).forEach((tag) => {
        const current = tagsByContent.get(tag.content_id) ?? [];
        current.push(tag.tag);
        tagsByContent.set(tag.content_id, current);
      });

      const materialByContent = new Map<string, MaterialRow>();
      (materialsResponse.data as MaterialRow[]).forEach((material) => {
        if (!materialByContent.has(material.content_id)) {
          materialByContent.set(material.content_id, material);
        }
      });

      const mapped = await Promise.all(
        ((contentResponse.data ?? []) as ContentRow[]).map(async (item) => {
          const material = materialByContent.get(item.id);
          const signedMaterialUrl = material?.storage_path
            ? await getSignedStorageUrl("content-materials", material.storage_path)
            : null;

          return {
            id: item.id,
            slug: item.slug,
            title: item.title,
            description: item.description,
            coverUrl: await resolveContentThumbnail(item),
            fileUrl: material?.external_url ?? signedMaterialUrl ?? "",
            pages: material?.pages ?? 0,
            category: item.category,
            isFree: item.access === "free",
            publishedAt: item.published_at ?? item.created_at,
            downloads: 0,
            tags: tagsByContent.get(item.id) ?? [],
            relatedAulaSlug: undefined,
          } satisfies Ebook;
        })
      );

      setEbooks(mapped);
      setLoading(false);
    };

    void loadEbooks();

    return () => {
      active = false;
    };
  }, [supabase]);

  const filtered = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    return ebooks.filter((ebook) => {
      const matchesSearch =
        !normalizedSearch ||
        ebook.title.toLowerCase().includes(normalizedSearch) ||
        ebook.description.toLowerCase().includes(normalizedSearch) ||
        ebook.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));

      const matchesCategory = activeCategory === "todas" || ebook.category === activeCategory;

      const matchesAccess =
        activeAccess === "todos" ||
        (activeAccess === "free" && ebook.isFree) ||
        (activeAccess === "exclusive" && !ebook.isFree);

      return matchesSearch && matchesCategory && matchesAccess;
    });
  }, [ebooks, deferredSearch, activeCategory, activeAccess]);

  const openModal = (ebook: Ebook) => {
    setSelectedEbook(ebook);
    setModalOpen(true);
  };

  const triggerPaywall = (title?: string) => {
    setPaywallTitle(title);
    setPaywallOpen(true);
  };

  const handleDownload = async () => {
    if (selectedEbook?.fileUrl) {
      if (user?.id) {
        await supabase.from("user_ebook_downloads").upsert(
          {
            user_id: user.id,
            content_id: selectedEbook.id,
            downloaded_at: new Date().toISOString(),
          },
          { onConflict: "user_id,content_id" }
        );
      }
      window.open(selectedEbook.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="px-4 lg:px-6 py-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
            <BookOpen size={20} className="text-accent-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-content-primary">E-books & PDFs</h1>
            <p className="text-sm text-content-secondary">
              {ebooks.length} materiais disponíveis · Guias e referências para aprofundar seu conhecimento
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4 mb-8"
      >
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-content-disabled pointer-events-none"
          />
          <input
            type="search"
            placeholder="Buscar e-books por título, tema ou tag..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className={cn(
              "w-full h-10 bg-background-tertiary border border-border-subtle rounded-xl pl-9 pr-9",
              "text-sm text-content-primary placeholder:text-content-disabled",
              "outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
              "transition-all duration-200"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-content-disabled hover:text-content-secondary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                  activeCategory === category.key
                    ? "bg-accent-primary text-white shadow-glow"
                    : "bg-background-tertiary border border-border-subtle text-content-secondary hover:border-accent-primary/30 hover:text-content-primary"
                )}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border-subtle hidden sm:block" />

          <div className="flex flex-wrap gap-1.5">
            {accessFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveAccess(filter.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                  activeAccess === filter.key
                    ? "bg-accent-primary text-white shadow-glow"
                    : "bg-background-tertiary border border-border-subtle text-content-secondary hover:border-accent-primary/30 hover:text-content-primary"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2.5">
              <SkeletonText className="aspect-[2/3] rounded-xl" />
              <SkeletonText className="h-9 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-content-disabled mb-4">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((ebook, index) => (
            <EbookCard
              key={ebook.id}
              ebook={ebook}
              index={index}
              onOpen={() => openModal(ebook)}
              onPaywall={() => triggerPaywall(ebook.title)}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-content-disabled" />
          </div>
          <h3 className="text-lg font-semibold text-content-primary mb-1">Nenhum e-book encontrado</h3>
          <p className="text-sm text-content-secondary max-w-sm mx-auto">
            Tente ajustar os filtros ou buscar com termos diferentes.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("todas");
              setActiveAccess("todos");
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-accent-primary text-white text-xs font-semibold hover:bg-accent-primaryHover transition-colors shadow-glow"
          >
            Limpar filtros
          </button>
        </motion.div>
      )}

      <EbookModal
        ebook={selectedEbook}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onPaywall={() => triggerPaywall(selectedEbook?.title)}
        onDownload={handleDownload}
      />

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        contentTitle={paywallTitle}
        contentType="ebook"
      />
    </div>
  );
}
