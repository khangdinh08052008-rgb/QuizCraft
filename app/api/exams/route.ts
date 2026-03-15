import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { parseQuestionsWithAI } from "@/lib/ai-parser";

// Extract text from PDF buffer (server-side)
async function extractPdfText(buffer: Buffer): Promise<string> {
  // Dynamically import pdf-parse (CommonJS module)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return data.text;
}

// Extract text from DOCX buffer
async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check role
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "owner")
      return NextResponse.json({ error: "Chỉ chủ đề mới được upload" }, { status: 403 });

    // Parse form data
    const form = await req.formData();
    const file = form.get("file") as File;
    const title = form.get("title") as string | null;
    const expDays = parseInt(form.get("expDays") as string || "7", 10);

    if (!file) return NextResponse.json({ error: "Thiếu file" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const name = file.name.toLowerCase();

    // Extract raw text
    let rawText = "";
    if (name.endsWith(".pdf")) {
      rawText = await extractPdfText(buffer);
    } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
      rawText = await extractDocxText(buffer);
    } else if (name.endsWith(".txt")) {
      rawText = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Chỉ hỗ trợ PDF, DOCX, TXT" }, { status: 400 });
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: "Không đọc được nội dung file" }, { status: 422 });
    }

    // AI parsing
    const { title: aiTitle, questions } = await parseQuestionsWithAI(rawText);

    if (!questions.length) {
      return NextResponse.json({ error: "Không tìm thấy câu hỏi trắc nghiệm" }, { status: 422 });
    }

    // Compute exp_date
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + expDays);

    // Save to DB
    const { data: exam, error } = await supabase.from("exams").insert({
      owner_id: user.id,
      title: title || aiTitle,
      questions,
      upload_date: new Date().toISOString().split("T")[0],
      exp_date: expDate.toISOString().split("T")[0],
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ exam });
  } catch (err: unknown) {
    console.error("parse-exam error:", err);
    const msg = err instanceof Error ? err.message : "Lỗi server";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
