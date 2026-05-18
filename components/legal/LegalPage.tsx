"use client";

import React from "react";
import Link from "next/link";
import { Brain, ArrowLeft, FileText } from "lucide-react";

interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
}

interface LegalPageProps {
  badge: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
  crossLink: {
    href: string;
    title: string;
    description: string;
    label: string;
  };
}

function renderLine(line: string, i: number) {
  const trimmed = line.trim();
  if (!trimmed) return <br key={i} />;

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={j} className="text-content-primary font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={j}>{part}</React.Fragment>;
    });
  };

  if (trimmed.startsWith("- ")) {
    return (
      <div key={i} className="flex gap-2 ml-4 mt-1">
        <span className="text-accent-primary shrink-0">•</span>
        <span>{renderInline(trimmed.slice(2))}</span>
      </div>
    );
  }

  return (
    <p key={i} className="mt-2">
      {renderInline(trimmed)}
    </p>
  );
}

export function LegalPage({
  badge,
  icon,
  title,
  subtitle,
  lastUpdated,
  sections,
  crossLink,
}: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-primary/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/cadastro"
            className="flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Voltar ao cadastro</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <Brain size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-content-primary">
              Dr. Marcelo
              <span className="text-accent-secondary">Psiquiatra</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-accent-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-primary/10 border border-accent-primary/20 mb-6">
            {icon}
            <span className="text-xs font-semibold text-accent-secondary uppercase tracking-wider">
              {badge}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-content-primary mb-4">
            {title}
          </h1>
          <p className="text-base text-content-secondary max-w-xl mx-auto leading-relaxed">
            {subtitle}
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <FileText size={14} className="text-content-disabled" />
            <span className="text-xs text-content-disabled">
              Última atualização: {lastUpdated}
            </span>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <nav className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="p-5 rounded-2xl bg-background-secondary border border-border-subtle">
          <h2 className="text-sm font-bold text-content-primary mb-4 uppercase tracking-wider">
            Índice
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-content-secondary hover:text-accent-secondary transition-colors leading-relaxed"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-10">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-xl font-bold text-content-primary mb-4">
              {section.title}
            </h2>
            <div className="text-sm text-content-secondary leading-relaxed">
              {section.paragraphs.map((para, pi) => (
                <div key={pi} className={pi > 0 ? "mt-4" : ""}>
                  {para.split("\n").map((line, li) => renderLine(line, li))}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Cross-link */}
        <div className="pt-8 border-t border-border-subtle">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-background-secondary border border-border-subtle">
            <div>
              <h3 className="text-sm font-bold text-content-primary mb-1">
                {crossLink.title}
              </h3>
              <p className="text-xs text-content-secondary">
                {crossLink.description}
              </p>
            </div>
            <Link
              href={crossLink.href}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-semibold hover:bg-accent-primaryHover transition-colors"
            >
              {crossLink.label}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
