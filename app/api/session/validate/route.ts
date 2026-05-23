import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * POST /api/session/validate
 * Dipakai oleh extension browser untuk memvalidasi session token.
 * Body: { session_token: string }
 * Response: { valid: boolean, user_id?: string, plan?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_token } = body as { session_token?: string };

    if (!session_token || typeof session_token !== "string") {
      return NextResponse.json({ valid: false, error: "missing_token" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Cek session valid via RPC function
    const { data, error } = await supabase.rpc("check_session_valid", {
      p_session_token: session_token,
    });

    if (error) {
      console.error("check_session_valid error:", error.message);
      return NextResponse.json({ valid: false, error: "db_error" }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ valid: false, error: "session_not_found" }, { status: 200 });
    }

    const row = data[0] as { is_valid: boolean; user_id: string };

    if (!row.is_valid) {
      return NextResponse.json({ valid: false, error: "session_invalidated" }, { status: 200 });
    }

    // Ambil plan user untuk extension
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, role")
      .eq("id", row.user_id)
      .single();

    // Update heartbeat
    await supabase.rpc("update_session_heartbeat", {
      p_session_token: session_token,
    });

    return NextResponse.json({
      valid: true,
      user_id: row.user_id,
      plan: profile?.plan ?? "free",
      role: profile?.role ?? "user",
    });
  } catch (err) {
    console.error("session/validate error:", err);
    return NextResponse.json({ valid: false, error: "internal_error" }, { status: 500 });
  }
}
