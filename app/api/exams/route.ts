import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, questions, expDays } = body;

    if (!questions?.length)
      return NextResponse.json({ error: "Chưa có câu hỏi" }, { status: 400 });

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + (expDays || 7));

    const { data: exam, error } = await supabase.from("exams").insert({
      owner_id: user.id,
      title: title || "Bài kiểm tra",
      questions,
      upload_date: new Date().toISOString().split("T")[0],
      exp_date: expDate.toISOString().split("T")[0],
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ exam });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}