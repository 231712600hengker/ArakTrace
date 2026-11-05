import { NextResponse } from "next/server";
import { getBatchView } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { code: string } }) {
  try {
    const code = decodeURIComponent(params.code).trim().slice(0, 50);
    if (!code || code.length < 5) {
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    }
    
    const b = await getBatchView(code);
    return b ? NextResponse.json(b) : NextResponse.json({ error: "batch_not_found" }, { status: 404 });
  } catch { 
    return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); 
  }
}
