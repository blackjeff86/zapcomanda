import { NextResponse } from "next/server";

export async function GET() {
  const botUrl = process.env.EVOLUTION_API_URL;
  if (!botUrl) {
    return NextResponse.json({ status: "disconnected", qr: null });
  }
  try {
    const res = await fetch(`${botUrl}/qrcode`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error("bot error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: "disconnected", qr: null });
  }
}
