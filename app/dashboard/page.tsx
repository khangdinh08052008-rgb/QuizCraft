"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import type { Exam, Question } from "@/types";

const EMPTY_Q = (): Question => ({
  text: "", options: ["A. ", "B. ", "C. ", "D. "],
  correctIndex: 0, short: false,
});

export default function DashboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [title, setTitle] = useState("");
  const [expDays, setExpDays] = useState(7);
  const [questions, setQuestions] = useState<Question[]>([EMPTY_Q()]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p?.role !== "owner") { router.push("/"); return; }
      const { data: e } = await supabase.from("exams").select("*")
        .eq("owner_id", user.id).order("created_at", { ascending: false });
      setExams(e || []);
    })();
  }, []);

  function updateQ(i: number, field: keyof Question, val: unknown) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: val } : q));
  }

  function updateOption(qi: number, oi: number, val: string) {
    setQuestions(qs => qs.map((q, idx) => {
      if (idx !== qi) return q;
      const opts = [...q.options];
      opts[oi] = val;
      const short = opts.every(o => o.replace(/^[A-D][.)]\s*/, "").length < 45);
      return { ...q, options: opts, short };
    }));
  }

  function addQuestion() {
    setQuestions(qs => [...qs, EMPTY_Q()]);
  }

  function removeQuestion(i: number) {
    setQuestions(qs => qs.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!title.trim()) { setMsg("❌ Hãy nhập tên bài thi!"); return; }
    if (questions.some(q => !q.text.trim())) { setMsg("❌ Có câu hỏi chưa nhập nội dung!"); return; }
    setSaving(true); setMsg("");
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, questions, expDays }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg("❌ " + data.error); setSaving(false); return; }
    setMsg("✅ Tạo bài thi thành công!");
    setExams(e => [data.exam, ...e]);
    setTitle(""); setQuestions([EMPTY_Q()]);
    setSaving(false);
  }

  async function deleteExam(id: string) {
    if (!confirm("Xóa bài thi này?")) return;
    await supabase.from("exams").delete().eq("id", id);
    setExams(e => e.filter(x => x.id !== id));
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 80px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 4 }}>📋 Dashboard</h1>
        <p style={{ color: "var(--muted)", marginBottom: 32 }}>Tạo và quản lý bài kiểm tra</p>

        {/* Form tạo bài */}
        <div className="card" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>✨ Tạo bài thi mới</h2>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
            <div style={{ flex: "2 1 200px" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6, letterSpacing: ".06em" }}>TÊN BÀI THI</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Lịch sử 12 - Giữa kỳ II" />
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6, letterSpacing: ".06em" }}>HẠN LÀM BÀI</label>
              <div style={{ display: "flex", gap: 6 }}>
                {[3, 7, 14, 30].map(d => (
                  <button key={d} onClick={() => setExpDays(d)} style={{
                    flex: 1, padding: "12px 4px", borderRadius: 10, fontSize: 13,
                    border: `2px solid ${expDays === d ? "var(--accent)" : "var(--border)"}`,
                    background: expDays === d ? "var(--accent)" : "transparent",
                    color: expDays === d ? "#fff" : "var(--text)",
                    fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-head)",
                  }}>{d}d</button>
                ))}
              </div>
            </div>
          </div>

          {/* Danh sách câu hỏi */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {questions.map((q, qi) => (
              <div key={qi} style={{
                background: "var(--bg)", borderRadius: 16, padding: 20,
                border: "1px solid var(--border)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{
                    background: "var(--accent)", color: "#fff",
                    width: 28, height: 28, borderRadius: 8, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 900, fontFamily: "var(--font-head)",
                  }}>{qi + 1}</span>
                  {questions.length > 1 && (
                    <button onClick={() => removeQuestion(qi)} style={{
                      background: "#fee2e2", color: "#dc2626", border: "none",
                      padding: "6px 12px", borderRadius: 8, fontSize: 12,
                      fontWeight: 700, cursor: "pointer",
                    }}>Xóa</button>
                  )}
                </div>

                <textarea
                  value={q.text}
                  onChange={e => updateQ(qi, "text", e.target.value)}
                  placeholder={`Nội dung câu hỏi ${qi + 1}...`}
                  rows={2}
                  style={{ width: "100%", resize: "vertical", marginBottom: 14 }}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {q.options.map((opt, oi) => (
                    <div key={oi} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => updateQ(qi, "correctIndex", oi)} style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        border: `2px solid ${q.correctIndex === oi ? "#22c55e" : "var(--border)"}`,
                        background: q.correctIndex === oi ? "#22c55e" : "transparent",
                        color: q.correctIndex === oi ? "#fff" : "var(--muted)",
                        fontWeight: 900, fontSize: 13, cursor: "pointer",
                        fontFamily: "var(--font-head)",
                      }}>
                        {["A","B","C","D"][oi]}
                      </button>
                      <input
                        value={opt}
                        onChange={e => updateOption(qi, oi, e.target.value)}
                        placeholder={`${["A","B","C","D"][oi]}. Đáp án...`}
                        style={{ flex: 1 }}
                      />
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
                  💡 Nhấn chữ <strong>A / B / C / D</strong> để chọn đáp án đúng (xanh = đúng)
                </p>
              </div>
            ))}
          </div>

          <button onClick={addQuestion} style={{
            width: "100%", marginTop: 16, padding: "14px 0",
            borderRadius: 14, border: `2px dashed var(--border)`,
            background: "transparent", color: "var(--muted)",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font-head)", transition: "all .2s",
          }}>
            + Thêm câu hỏi
          </button>

          {msg && (
            <div style={{
              marginTop: 16, padding: "12px 16px", borderRadius: 12,
              background: msg.startsWith("✅") ? "#dcfce7" : "#fee2e2",
              color: msg.startsWith("✅") ? "#15803d" : "#dc2626",
              fontWeight: 700, fontSize: 14,
            }}>{msg}</div>
          )}

          <button onClick={save} disabled={saving} className="btn-primary"
            style={{ width: "100%", marginTop: 16, opacity: saving ? .7 : 1 }}>
            {saving ? "⏳ Đang lưu..." : "💾 Lưu bài thi"}
          </button>
        </div>

        {/* Danh sách bài thi */}
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
          📚 Bài thi của bạn ({exams.length})
        </h2>
        {exams.length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>
            Chưa có bài thi nào. Tạo bài thi đầu tiên nhé!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {exams.map(exam => {
              const expired = new Date(exam.exp_date) < new Date();
              return (
                <div key={exam.id} className="card" style={{ padding: "16px 22px", opacity: expired ? .6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{exam.title}</h3>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>📅 {exam.upload_date}</span>
                        <span style={{ fontSize: 12, color: expired ? "#ef4444" : "var(--muted)" }}>
                          ⏰ {expired ? "Hết hạn" : exam.exp_date}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>📝 {exam.questions.length} câu</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => router.push(`/quiz/${exam.id}`)} style={{
                        background: "var(--accent-soft)", color: "var(--accent)",
                        border: "none", padding: "8px 16px", borderRadius: 10,
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        fontFamily: "var(--font-head)",
                      }}>Xem</button>
                      <button onClick={() => deleteExam(exam.id)} style={{
                        background: "#fee2e2", color: "#dc2626",
                        border: "none", padding: "8px 12px", borderRadius: 10,
                        fontSize: 13, cursor: "pointer",
                      }}>🗑</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}