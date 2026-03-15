"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import type { Exam, Profile } from "@/types";

export default function DashboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [title, setTitle] = useState("");
  const [expDays, setExpDays] = useState(7);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p?.role !== "owner") { router.push("/"); return; }
      setProfile(p);
      const { data: e } = await supabase.from("exams").select("*")
        .eq("owner_id", user.id).order("created_at", { ascending: false });
      setExams(e || []);
    })();
  }, []);

  async function handleFile(file: File) {
    setUploading(true);
    setUploadStatus("⏳ Đang đọc file...");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("expDays", expDays.toString());
      if (title.trim()) form.append("title", title.trim());

      setUploadStatus("🤖 AI đang phân tích câu hỏi...");
      const res = await fetch("/api/exams", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setUploadStatus(`✅ Tìm thấy ${data.exam.questions.length} câu hỏi!`);
      setExams(prev => [data.exam, ...prev]);
      setTitle("");
      setTimeout(() => setUploadStatus(""), 3000);
    } catch (e: unknown) {
      setUploadStatus(`❌ ${e instanceof Error ? e.message : "Lỗi không xác định"}`);
    } finally {
      setUploading(false);
    }
  }

  async function deleteExam(id: string) {
    if (!confirm("Xóa bài thi này?")) return;
    await supabase.from("exams").delete().eq("id", id);
    setExams(e => e.filter(x => x.id !== id));
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "36px 20px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 6 }}>📋 Dashboard</h1>
        <p style={{ color: "var(--muted)", marginBottom: 32 }}>Quản lý và tạo bài kiểm tra</p>

        {/* Upload section */}
        <div className="card" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>✨ Tạo bài thi mới</h2>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ flex: "2 1 200px" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6, letterSpacing: ".06em" }}>
                TÊN BÀI THI (tùy chọn)
              </label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Để trống — AI sẽ tự đặt tên..." />
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6, letterSpacing: ".06em" }}>
                HẠN LÀM BÀI
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {[3, 7, 14, 30].map(d => (
                  <button key={d} onClick={() => setExpDays(d)} style={{
                    flex: 1, padding: "12px 4px", borderRadius: 10, fontSize: 13,
                    border: `2px solid ${expDays === d ? "var(--accent)" : "var(--border)"}`,
                    background: expDays === d ? "var(--accent)" : "transparent",
                    color: expDays === d ? "#fff" : "var(--text)",
                    fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-head)",
                    transition: "all .2s",
                  }}>{d}d</button>
                ))}
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => !uploading && fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 16, padding: "40px 24px", textAlign: "center",
              cursor: uploading ? "wait" : "pointer",
              background: dragging ? "var(--accent-soft)" : "var(--bg)",
              transition: "all .25s",
            }}
          >
            <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt"
              style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {uploading ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 10, animation: "spin 1s linear infinite" }}>⚙️</div>
                <p style={{ fontWeight: 700, color: "var(--accent)" }}>{uploadStatus}</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📁</div>
                <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                  Kéo thả hoặc click để chọn file
                </p>
                <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>PDF, DOCX, DOC, TXT — AI tự tìm câu hỏi</p>
                {uploadStatus && (
                  <p style={{ marginTop: 12, fontWeight: 700, color: uploadStatus.startsWith("❌") ? "#ef4444" : "#22c55e" }}>
                    {uploadStatus}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Exam list */}
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
          📚 Bài thi của bạn ({exams.length})
        </h2>
        {exams.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            Chưa có bài thi nào. Hãy upload file đầu tiên!
          </div>
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
                        background: expired ? "var(--border)" : "var(--accent-soft)",
                        color: expired ? "var(--muted)" : "var(--accent)",
                        border: "none", padding: "8px 16px", borderRadius: 10,
                        fontSize: 13, fontWeight: 700, cursor: expired ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-head)",
                      }}>Xem trước</button>
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
