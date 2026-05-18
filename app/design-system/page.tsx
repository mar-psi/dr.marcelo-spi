"use client";

import React, { useState } from "react";
import {
  Brain,
  Play,
  Lock,
  Star,
  CheckCircle2,
  Loader2,
  Search,
  Eye,
  EyeOff,
  Bell,
} from "lucide-react";
import {
  Button,
  Badge,
  ContentCard,
  Input,
  Select,
  Avatar,
  ProgressBar,
  Modal,
  ToastProvider,
  useToast,
  SkeletonCard,
  SkeletonText,
  SkeletonAvatar,
  StoryRing,
} from "@/components/ui";

/* ─── Section wrapper ────────────────────────────────────────── */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <div className="mb-6 pb-4 border-b border-border-subtle">
        <h2 className="text-2xl font-bold text-content-primary mb-1">{title}</h2>
        {description && (
          <p className="text-sm text-content-secondary">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function ColorSwatch({
  color,
  label,
  hex,
}: {
  color: string;
  label: string;
  hex: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="w-full h-16 rounded-lg border border-border-subtle"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-xs font-medium text-content-primary">{label}</p>
        <p className="text-xs text-content-secondary font-mono">{hex}</p>
      </div>
    </div>
  );
}

/* ─── Toast demo trigger ─────────────────────────────────────── */
function ToastDemos() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          toast({ variant: "success", title: "Aula concluída!", message: "+20 XP ganhos" })
        }
      >
        Toast Sucesso
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          toast({ variant: "error", title: "Erro ao salvar", message: "Tente novamente" })
        }
      >
        Toast Erro
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          toast({ variant: "warning", title: "Assinatura expirando", message: "Renove em 3 dias" })
        }
      >
        Toast Aviso
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          toast({ variant: "info", title: "Novo conteúdo disponível", message: "2 aulas novas" })
        }
      >
        Toast Info
      </Button>
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Star size={14} />}
        onClick={() =>
          toast({
            variant: "achievement",
            title: "🏆 Conquista desbloqueada!",
            message: "Quiz Master — +25 XP",
            duration: 5000,
          })
        }
      >
        Toast Conquista
      </Button>
    </div>
  );
}

/* ─── Modal demo ─────────────────────────────────────────────── */
function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Abrir Modal
      </Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Exemplo de Modal"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={() => setOpen(false)}>
              Confirmar
            </Button>
          </div>
        }
      >
        <p className="text-sm text-content-secondary leading-relaxed">
          Este é o corpo do modal. Ele suporta qualquer conteúdo, tem backdrop com blur,
          fecha ao pressionar Escape ou clicar fora. Header e footer são opcionais.
        </p>
      </Modal>
    </>
  );
}

/* ─── Input demo ─────────────────────────────────────────────── */
function InputDemos() {
  const [showPwd, setShowPwd] = useState(false);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
      <Input label="Email" type="email" placeholder="seu@email.com" />
      <Input
        label="Senha"
        type={showPwd ? "text" : "password"}
        placeholder="••••••••"
        rightIcon={
          <button onClick={() => setShowPwd(!showPwd)}>
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />
      <Input
        label="Busca"
        placeholder="Buscar aulas..."
        leftIcon={<Search size={16} />}
      />
      <Input
        label="Campo com erro"
        placeholder="exemplo"
        error="Este campo é obrigatório"
        defaultValue="valor inválido"
      />
      <Input
        label="Campo com sucesso"
        placeholder="exemplo"
        success="Email disponível!"
        defaultValue="usuario@email.com"
      />
      <Select
        label="Categoria"
        placeholder="Selecione uma categoria"
        options={[
          { value: "doencas", label: "Doenças" },
          { value: "transtornos", label: "Transtornos e Tratamentos" },
          { value: "curiosidades", label: "Curiosidades" },
        ]}
      />
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function DesignSystemPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background-primary py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-purple flex items-center justify-center">
                <Brain size={22} className="text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gradient-purple">
                Dr. Marcelo Psiquiatra
              </h1>
            </div>
            <p className="text-content-secondary text-lg">
              Design System — Documentação Visual
            </p>
            <p className="text-content-disabled text-sm mt-1">
              Todos os tokens, componentes e padrões da plataforma
            </p>
          </div>

          {/* ── 1. Color Tokens ─────────────────────────────────── */}
          <Section
            title="1. Tokens de Cor"
            description="Paleta completa da plataforma, modo dark exclusivo"
          >
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-widest mb-4">
                  Backgrounds
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <ColorSwatch color="#0A0A0F" label="Background Primary" hex="#0A0A0F" />
                  <ColorSwatch color="#12121A" label="Background Secondary" hex="#12121A" />
                  <ColorSwatch color="#1E1E2E" label="Background Tertiary" hex="#1E1E2E" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-widest mb-4">
                  Accent / CTA
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <ColorSwatch color="#7C3AED" label="Accent Primary" hex="#7C3AED" />
                  <ColorSwatch color="#A78BFA" label="Accent Secondary" hex="#A78BFA" />
                  <ColorSwatch color="#6D28D9" label="Accent Hover" hex="#6D28D9" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-widest mb-4">
                  Texto
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <ColorSwatch color="#F8FAFC" label="Text Primary" hex="#F8FAFC" />
                  <ColorSwatch color="#94A3B8" label="Text Secondary" hex="#94A3B8" />
                  <ColorSwatch color="#475569" label="Text Disabled" hex="#475569" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-widest mb-4">
                  Status
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <ColorSwatch color="#22C55E" label="Sucesso" hex="#22C55E" />
                  <ColorSwatch color="#EF4444" label="Erro" hex="#EF4444" />
                  <ColorSwatch color="#F59E0B" label="Aviso" hex="#F59E0B" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-widest mb-4">
                  Categorias
                </h3>
                <div className="grid grid-cols-5 gap-4">
                  <ColorSwatch color="#7C3AED" label="Doenças" hex="#7C3AED" />
                  <ColorSwatch color="#3B82F6" label="Transtornos" hex="#3B82F6" />
                  <ColorSwatch color="#22C55E" label="Curiosidades" hex="#22C55E" />
                  <ColorSwatch color="#64748B" label="Gratuito" hex="#64748B" />
                  <ColorSwatch color="#F97316" label="Novo" hex="#F97316" />
                </div>
              </div>
            </div>
          </Section>

          {/* ── 2. Tipografia ───────────────────────────────────── */}
          <Section title="2. Tipografia" description="Fonte do sistema">
            <div className="space-y-4 bg-background-secondary p-8 rounded-xl border border-border-subtle">
              <div className="flex items-baseline gap-4">
                <span className="text-xs text-content-disabled w-16 shrink-0">4xl / 700</span>
                <p className="text-4xl font-bold text-content-primary">Saúde Mental</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-xs text-content-disabled w-16 shrink-0">3xl / 700</span>
                <p className="text-3xl font-bold text-content-primary">Psiquiatria</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-xs text-content-disabled w-16 shrink-0">2xl / 600</span>
                <p className="text-2xl font-semibold text-content-primary">Transtornos</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-xs text-content-disabled w-16 shrink-0">xl / 600</span>
                <p className="text-xl font-semibold text-content-primary">Depressão e Ansiedade</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-xs text-content-disabled w-16 shrink-0">lg / 500</span>
                <p className="text-lg font-medium text-content-primary">Bem-vindo à plataforma</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-xs text-content-disabled w-16 shrink-0">base / 400</span>
                <p className="text-base text-content-secondary">
                  Conteúdo educativo e acolhedor sobre saúde mental.
                </p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-xs text-content-disabled w-16 shrink-0">sm / 400</span>
                <p className="text-sm text-content-secondary">
                  Informações secundárias e metadados.
                </p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-xs text-content-disabled w-16 shrink-0">xs / 400</span>
                <p className="text-xs text-content-disabled">
                  Labels, badges e legenda.
                </p>
              </div>
            </div>
          </Section>

          {/* ── 3. Botões ───────────────────────────────────────── */}
          <Section title="3. Botões" description="4 variantes × 3 tamanhos + estados">
            <div className="space-y-8">
              {/* Variantes */}
              <div>
                <h3 className="text-xs font-semibold text-content-disabled uppercase tracking-widest mb-4">
                  Variantes — tamanho md
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Assistir agora</Button>
                  <Button variant="secondary">Mais informações</Button>
                  <Button variant="ghost">Salvar na lista</Button>
                  <Button variant="danger">Cancelar assinatura</Button>
                </div>
              </div>
              {/* Tamanhos */}
              <div>
                <h3 className="text-xs font-semibold text-content-disabled uppercase tracking-widest mb-4">
                  Tamanhos — variante primary
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="sm">Pequeno</Button>
                  <Button variant="primary" size="md">Médio</Button>
                  <Button variant="primary" size="lg">Grande</Button>
                </div>
              </div>
              {/* Estados */}
              <div>
                <h3 className="text-xs font-semibold text-content-disabled uppercase tracking-widest mb-4">
                  Estados
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" leftIcon={<Play size={16} />}>
                    Com ícone esquerdo
                  </Button>
                  <Button variant="primary" rightIcon={<Bell size={16} />}>
                    Com ícone direito
                  </Button>
                  <Button variant="primary" loading>
                    Carregando
                  </Button>
                  <Button variant="primary" disabled>
                    Desabilitado
                  </Button>
                  <Button variant="primary" fullWidth>
                    Largura total
                  </Button>
                </div>
              </div>
            </div>
          </Section>

          {/* ── 4. Badges ───────────────────────────────────────── */}
          <Section title="4. Badges / Tags" description="Cores por categoria e status">
            <div className="flex flex-wrap gap-3">
              <Badge variant="doencas">Doenças</Badge>
              <Badge variant="transtornos">Transtornos</Badge>
              <Badge variant="curiosidades">Curiosidades</Badge>
              <Badge variant="free">Grátis</Badge>
              <Badge variant="novo">Novo</Badge>
              <Badge variant="success">Concluído</Badge>
              <Badge variant="error">Erro</Badge>
              <Badge variant="warning">Expirando</Badge>
              <Badge variant="default">Rascunho</Badge>
              <Badge variant="doencas" size="md">Doenças md</Badge>
            </div>
          </Section>

          {/* ── 5. Cards ────────────────────────────────────────── */}
          <Section
            title="5. Cards de Conteúdo"
            description="Estilo Netflix — hover com overlay, play, cadeado e progresso"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <ContentCard
                slug="conteudo-exemplo-1"
                title="Conteúdo publicado"
                thumbnailUrl=""
                category="doencas"
                duration="18min"
                views={4200}
                isFree={true}
                isNew={true}
                contentType="Vídeo"
              />
              <ContentCard
                slug="conteudo-exemplo-2"
                title="Conteúdo exclusivo"
                thumbnailUrl=""
                category="transtornos"
                duration="24min"
                views={8100}
                isFree={false}
                contentType="Vídeo"
                onPaywallTrigger={() => alert("Paywall triggered")}
              />
              <ContentCard
                slug="conteudo-exemplo-3"
                title="Conteúdo com progresso"
                thumbnailUrl=""
                category="curiosidades"
                duration="12min"
                views={3700}
                isFree={true}
                contentType="Vídeo"
                progress={65}
              />
              <ContentCard
                slug="conteudo-exemplo-4"
                title="Conteúdo protegido"
                thumbnailUrl=""
                category="transtornos"
                duration="31min"
                views={12400}
                isFree={false}
                contentType="Vídeo"
                onPaywallTrigger={() => alert("Paywall triggered")}
              />
            </div>
          </Section>

          {/* ── 6. Inputs ───────────────────────────────────────── */}
          <Section title="6. Inputs e Selects" description="Dark com glow roxo no foco">
            <InputDemos />
          </Section>

          {/* ── 7. Avatares ─────────────────────────────────────── */}
          <Section title="7. Avatares" description="Tamanhos, fallback de iniciais, indicador online">
            <div className="flex flex-wrap items-end gap-8">
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-content-disabled uppercase tracking-widest">Tamanhos</p>
                <div className="flex items-end gap-3">
                  <Avatar name="Dr Marcelo" size="sm" />
                  <Avatar name="Dr Marcelo" size="md" />
                  <Avatar name="Dr Marcelo" size="lg" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-content-disabled uppercase tracking-widest">Com foto</p>
                <div className="flex items-end gap-3">
	                  <Avatar name="Dr Marcelo" size="lg" online />
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-content-disabled uppercase tracking-widest">Status online</p>
                <div className="flex items-end gap-3">
                  <Avatar name="Ana Paula" size="md" online />
                  <Avatar name="João Silva" size="md" />
                </div>
              </div>
            </div>
          </Section>

          {/* ── 8. Progress Bars ────────────────────────────────── */}
          <Section title="8. Barras de Progresso" description="Animação de preenchimento, 4 cores, 3 tamanhos">
            <div className="space-y-6 max-w-lg">
              <ProgressBar value={75} label="Aula em progresso" showPercentage color="primary" size="md" />
              <ProgressBar value={100} label="Aula concluída" showPercentage color="success" size="md" />
              <ProgressBar value={45} label="Quiz em andamento" showPercentage color="warning" size="md" />
              <ProgressBar value={20} label="Tentativas restantes" showPercentage color="error" size="md" />
              <ProgressBar value={60} label="Tamanho sm" color="primary" size="sm" />
              <ProgressBar value={60} label="Tamanho lg" color="primary" size="lg" />
            </div>
          </Section>

          {/* ── 9. Modal ────────────────────────────────────────── */}
          <Section title="9. Modal / Dialog" description="Dark com backdrop blur, header, body e footer">
            <ModalDemo />
          </Section>

          {/* ── 10. Toasts ──────────────────────────────────────── */}
          <Section
            title="10. Toast / Notificações"
            description="5 variantes com animação — aparece no canto inferior direito"
          >
            <ToastDemos />
          </Section>

          {/* ── 11. Skeleton Loaders ────────────────────────────── */}
          <Section title="11. Skeleton Loaders" description="Shimmer dark para loading states">
            <div className="space-y-6">
              <div>
                <p className="text-xs text-content-disabled mb-3">Cards (4 colunas)</p>
                <div className="grid grid-cols-4 gap-4">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              </div>
              <div>
                <p className="text-xs text-content-disabled mb-3">Textos</p>
                <div className="space-y-2 max-w-sm">
                  <SkeletonText className="h-6 w-1/2" />
                  <SkeletonText />
                  <SkeletonText className="w-3/4" />
                </div>
              </div>
              <div>
                <p className="text-xs text-content-disabled mb-3">Avatares</p>
                <div className="flex gap-4">
                  <SkeletonAvatar size="sm" />
                  <SkeletonAvatar size="md" />
                  <SkeletonAvatar size="lg" />
                </div>
              </div>
            </div>
          </Section>

          {/* ── 12. Story Rings ─────────────────────────────────── */}
          <Section
            title="12. Story Rings"
            description="Anel gradiente roxo/azul (novo), roxo sólido (visto), cinza (expirado)"
          >
            <div className="flex flex-wrap items-end gap-8">
              <StoryRing name="Dr. Marcelo" ringState="new" newCount={3} size="lg" />
              <StoryRing name="Dr. Marcelo" ringState="new" size="md" />
              <StoryRing name="Visto" ringState="seen" size="md" />
              <StoryRing name="Expirado" ringState="expired" size="md" />
              <StoryRing name="Novo sm" ringState="new" size="sm" newCount={1} />
            </div>
          </Section>

          {/* ── 13. Sombras ─────────────────────────────────────── */}
          <Section title="13. Sombras e Efeitos" description="card, cardHover e glow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-background-secondary border border-border-subtle" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
                <p className="text-sm font-medium text-content-primary mb-1">shadow-card</p>
                <p className="text-xs text-content-secondary font-mono">0 4px 24px rgba(0,0,0,0.4)</p>
              </div>
              <div className="p-6 rounded-xl bg-background-secondary border border-border-subtle" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                <p className="text-sm font-medium text-content-primary mb-1">shadow-cardHover</p>
                <p className="text-xs text-content-secondary font-mono">0 8px 32px rgba(0,0,0,0.6)</p>
              </div>
              <div className="p-6 rounded-xl bg-background-secondary border border-[rgba(124,58,237,0.4)]" style={{ boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}>
                <p className="text-sm font-medium text-content-primary mb-1">shadow-glow</p>
                <p className="text-xs text-content-secondary font-mono">0 0 20px rgba(124,58,237,0.3)</p>
              </div>
            </div>
          </Section>

          {/* ── 14. Espaçamento ─────────────────────────────────── */}
          <Section title="14. Espaçamento" description="Escala de 4px">
            <div className="flex items-end gap-4 flex-wrap">
              {[
                { label: "xs", size: 4 },
                { label: "sm", size: 8 },
                { label: "md", size: 16 },
                { label: "lg", size: 24 },
                { label: "xl", size: 32 },
                { label: "2xl", size: 48 },
                { label: "3xl", size: 64 },
              ].map(({ label, size }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div
                    className="bg-accent-primary/40 border border-accent-primary rounded"
                    style={{ width: size, height: size }}
                  />
                  <span className="text-xs text-content-disabled">{label}</span>
                  <span className="text-xs text-content-disabled font-mono">{size}px</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 15. Border Radius ───────────────────────────────── */}
          <Section title="15. Border Radius" description="sm(4) → md(8) → lg(12) → xl(16) → full">
            <div className="flex items-center gap-6 flex-wrap">
              {[
                { label: "sm", radius: "4px" },
                { label: "md", radius: "8px" },
                { label: "lg", radius: "12px" },
                { label: "xl", radius: "16px" },
                { label: "full", radius: "9999px" },
              ].map(({ label, radius }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-16 bg-background-tertiary border border-accent-primary/50"
                    style={{ borderRadius: radius }}
                  />
                  <span className="text-xs text-content-disabled">{label}</span>
                  <span className="text-xs text-content-disabled font-mono">{radius}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-border-subtle text-center">
            <p className="text-content-disabled text-sm">
              Dr. Marcelo Psiquiatra Design System — Versão 1.0
            </p>
            <p className="text-content-disabled text-xs mt-1">
              Todos os componentes seguem os tokens definidos em{" "}
              <code className="text-accent-secondary font-mono">tailwind.config.ts</code>
            </p>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
