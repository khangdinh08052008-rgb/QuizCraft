import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { exam_id, answers, correct_count, total_count, score, elapsed_seconds } = body;

    // Upsert: cho phép làm lại (ghi đè kết quả cũ)
    const { data, error } = await supabase.from("results").upsert({
      exam_id,
      user_id: user.id,
      answers,
      correct_count,
      total_count,
      score,
      elapsed_seconds,
      finished_at: new Date().toISOString(),
    }, { onConflict: "exam_id,user_id" }).select().single();

    if (error) throw error;
    return NextResponse.json({ result: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
