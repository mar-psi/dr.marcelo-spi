import { ImageResponse } from "next/og";

// ─── Route segment config ────────────────────────────────────────────────────
// Edge runtime = geração rapida; o Next cacheia a resposta automaticamente.
export const runtime = "edge";

// Metadados do icone (favicon)
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

/**
 * Favicon dinâmico do Dr. Marcelo Psiquiatra.
 *
 * Replica fielmente a marca do Sidebar:
 *  - Quadrado rounded com gradient accent-primary -> accent-secondary
 *  - Icone `lucide-brain` em branco no centro
 *
 * Gerado via next/og (Satori) no Edge. Next faz o cache do PNG
 * resultante; nao ha custo por request em producao.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
          borderRadius: 7, // equivalente a rounded-lg em 32px
        }}
      >
        {/* lucide-brain — traçado branco, stroke 2, otimizado para 32x32 */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
          <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
          <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
          <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
          <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
          <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
          <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
          <path d="M6 18a4 4 0 0 1-1.967-.516" />
          <path d="M19.967 17.484A4 4 0 0 1 18 18" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
