"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlayCircle, BookOpen, HelpCircle, ArrowRight, X } from "lucide-react";
import { searchAll, type SearchResult } from "@/lib/search";
import { cn } from "@/lib/utils";

const typeConfig = {
  aula: { icon: PlayCircle, label: "Aula", color: "text-accent-primary bg-accent-primary/10" },
  ebook: { icon: BookOpen, label: "E-book", color: "text-status-success bg-status-success/10" },
  quiz: { icon: HelpCircle, label: "Quiz", color: "text-status-warning bg-status-warning/10" },
};

function SearchContent() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("q") ?? "";
  const query = rawQuery.trim();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      searchAll(query)
        .then((items) => {
          if (!active) return;
          setResults(items);
        })
        .catch(() => {
          if (!active) return;
          setResults([]);
        })
        .finally(() => {
          if (!active) return;
          setLoading(false);
        });
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const grouped = results.reduce((acc, item) => {
    acc[item.type] = acc[item.type] || [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary mb-2">
          {query ? `Resultados para "${query}"` : "Buscar conteúdo"}
        </h1>
        <p className="text-sm text-content-secondary">
          {query
            ? `${results.length} resultado${results.length !== 1 ? "s" : ""} encontrado${results.length !== 1 ? "s" : ""}`
            : "Digite pelo menos 2 caracteres para buscar aulas, e-books e quizzes."}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && query.length >= 2 && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-content-disabled" />
          </div>
          <h3 className="text-lg font-semibold text-content-primary mb-1">
            Nenhum resultado encontrado
          </h3>
          <p className="text-sm text-content-secondary max-w-sm mx-auto">
            Tente buscar com termos diferentes. Você pode procurar por doenças, sintomas, tratamentos ou temas.
          </p>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {!loading && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {(Object.keys(grouped) as Array<keyof typeof typeConfig>).map((type) => {
              const items = grouped[type];
              if (!items?.length) return null;
              const config = typeConfig[type];
              const Icon = config.icon;

              return (
                <section key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn("px-2 py-1 rounded-md text-xs font-semibold", config.color)}>
                      <Icon size={13} className="inline mr-1 -mt-0.5" />
                      {config.label}
                    </span>
                    <span className="text-xs text-content-disabled">{items.length}</span>
                  </div>

                  <div className="grid gap-3">
                    {items.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Link
                          href={item.url}
                          className="flex items-start gap-4 p-3 rounded-xl bg-background-secondary border border-border-subtle hover:border-accent-primary/30 hover:bg-background-tertiary transition-all duration-200 group"
                        >
                          {/* Thumbnail */}
                          <div className="relative w-24 h-16 sm:w-32 sm:h-[72px] rounded-lg overflow-hidden shrink-0 bg-background-tertiary">
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 py-0.5">
                            <h3 className="text-sm font-semibold text-content-primary group-hover:text-accent-secondary transition-colors line-clamp-1">
                              {item.title}
                            </h3>
                            <p className="text-xs text-content-secondary mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                            <p className="text-[11px] text-content-disabled mt-1.5">
                              {item.meta}
                            </p>
                          </div>

                          <ArrowRight
                            size={16}
                            className="text-content-disabled group-hover:text-accent-primary shrink-0 mt-4 transition-colors"
                          />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </section>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick suggestions (when no query) */}
      {!query && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <p className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
            Buscas populares
          </p>
          <div className="flex flex-wrap gap-2">
            {["Depressão", "Ansiedade", "TDAH", "Sono", "TCC", "Esquizofrenia"].map((term) => (
              <Link
                key={term}
                href={`/busca?q=${encodeURIComponent(term)}`}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-background-secondary border border-border-subtle text-content-secondary hover:border-accent-primary/40 hover:text-accent-secondary transition-all duration-200"
              >
                {term}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function BuscaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
