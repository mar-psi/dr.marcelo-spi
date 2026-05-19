import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ?? process.env.MERCADO_PAGO_PUBLIC_KEY ?? "";

  if (!publicKey) {
    return NextResponse.json(
      { error: "Chave publica do Mercado Pago ausente." },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey });
}
