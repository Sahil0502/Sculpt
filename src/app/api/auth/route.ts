import { NextResponse } from "next/server";

import { createBrowserClient } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}

export async function POST(request: Request) {
  const body = await request.json() as { name?: string; email?: string; role?: string };
  const { name, email, role } = body;

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  // Try to persist to Supabase if configured
  try {
    const supabase = createBrowserClient();
    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("users")
        .upsert(
          {
            email: email.toLowerCase(),
            name: name ?? email,
            role: role === "both" ? "manager" : role,
          },
          { onConflict: "email" }
        );

      if (error) {
        // Table may not exist yet — that's fine for demo
        console.warn("Supabase upsert skipped:", error.message);
      }
    }
  } catch (err) {
    // Supabase not configured — silently proceed
    console.warn("Supabase not available, using localStorage only:", err);
  }

  return NextResponse.json({ ok: true, email, name, role });
}
