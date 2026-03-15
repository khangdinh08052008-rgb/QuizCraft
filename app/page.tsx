"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import type { Exam, Profile } from "@/types";

function ExamCard({ exam, profile, onStart }: { exam: Exam; profile: Profile | null; onStart: () => void }) {
  const today = new Date();
  const exp = new Date(exam.exp_date);
  const expired = exp < today;
  const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / 86400000);

  return (
    <div className="card fade-up" style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      gap: 16, opacity: expired ? .55 : 1,
      transition: "transform .2s, box-shadow .2s",
    }}
      onMouseEnter={e => !expired && ((e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)")}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.transform = "")}
    >
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
          {exam.title}
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>📅 {exam.upload_date}</span>
          <span style={{ fontSize: 13, color: expired ? "#ef4444" : daysLeft <= 2 ? "#f59e0b" : "var(--muted)" }}>
            ⏰ {expired ? "Đã hết hạn" : `Còn ${daysLeft} ngày`}
          </span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>📝 {exam.questions.length} câu</span>
        </div>
      </div>
      <button
        onClick={onStart}
        disabled={expired}
        className={expired ? "" : "btn-primary"}
        style={expired ? {
          background: "var(--border)", color: "var(--muted)", border: "none",
          padding: "10px 20px", borderRadius: 10, fontSize: 14,
          fontWeight: 700, cursor: "not-allowed", fontFamily: "var(--font-head)",
        } : { padding: "10px 20px", fontSize: 14, flexShrink: 0 }}
      >
        {expired ? "Hết hạn" : "Làm bài →"}
      </button>
    </div>
  );
}

export default function HomePage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: p }, { data: e }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("exams").select("*").order("created_at", { ascending: false }),
      ]);
      setProfile(p);
      setExams(e || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 32, animation: "spin 1s linear infinite" }}>⚙️</div>
    </div>
  );

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "var(--text)", lineHeight: 1.15 }}>
            Xin chào,{" "}
            <span style={{ color: "var(--accent)" }}>{profile?.username}</span> 👋
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 8, fontSize: 16 }}>
            {exams.length} bài thi đang có sẵn
          </p>
        </div>

        {/* Owner action */}
        {profile?.role === "owner" && (
          <div style={{
            background: "linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)",
            borderRadius: 20, padding: "24px 28px", marginBottom: 28,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            boxShadow: "0 8px 32px var(--accent-glow)",
          }}>
            <div>
              <p style={{ color: "rgba(255,255,255,.8)", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                👑 Bạn là chủ đề
              </p>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>
                Import file PDF/DOCX để tạo bài thi mới
              </p>
            </div>
            <button onClick={() => router.push("/dashboard")} style={{
              background: "#fff", color: "var(--accent)", border: "none",
              padding: "12px 22px", borderRadius: 12, fontFamily: "var(--font-head)",
              fontWeight: 800, fontSize: 14, cursor: "pointer", flexShrink: 0,
            }}>
              + Tạo bài thi
            </button>
          </div>
        )}

        {/* Exam list */}
        {exams.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
            <h2 style={{ color: "var(--text)", marginBottom: 8 }}>Chưa có bài thi nào</h2>
            <p style={{ color: "var(--muted)" }}>
              {profile?.role === "owner" ? "Hãy tạo bài thi đầu tiên!" : "Chờ giáo viên tạo bài thi"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {exams.map(exam => (
              <ExamCard
                key={exam.id}
                exam={exam}
                profile={profile}
                onStart={() => router.push(`/quiz/${exam.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
