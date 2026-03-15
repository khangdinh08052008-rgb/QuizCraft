"use client";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

function ResultContent() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();

  const correct = parseInt(search.get("correct") || "0");
  const total = parseInt(search.get("total") || "1");
  const score = parseFloat(search.get("score") || "0");
  const elapsed = parseInt(search.get("elapsed") || "0");
  const pct = Math.round((correct / total) * 100);

  const { label, emoji, color } = score >= 9
    ? { label: "Xuất sắc", emoji: "🏆", color: "#22c55e" }
    : score >= 8
    ? { label: "Giỏi", emoji: "🌟", color: "#6366f1" }
    : score >= 6.5
    ? { label: "Khá", emoji: "👍", color: "#f59e0b" }
    : score >= 5
    ? { label: "Trung bình", emoji: "📚", color: "#fb923c" }
    : { label: "Cần cố gắng hơn", emoji: "💪", color: "#ef4444" };

  const stats = [
    { icon: "✅", label: "Câu đúng", val: `${correct}/${total}` },
    { icon: "📊", label: "Tỉ lệ", val: `${pct}%` },
    { icon: "⏱", label: "Thời gian", val: formatTime(elapsed) },
    { icon: "⚡", label: "Tốc độ", val: total > 0 ? `${Math.round(elapsed / total)}s/câu` : "—" },
  ];

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 520, margin: "0 auto", padding: "48px 20px" }}>
        <div className="card fade-up" style={{ textAlign: "center" }}>

          {/* Emoji & title */}
          <div style={{ fontSize: 64, marginBottom: 8 }}>{emoji}</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>
            Kết quả bài thi
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 32 }}>
            Bạn đã hoàn thành {total} câu hỏi
          </p>

          {/* Score ring */}
          <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 24px" }}>
            <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="70" cy="70" r="58" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle cx="70" cy="70" r="58" fill="none" stroke={color} strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 58}`}
                strokeDashoffset={`${2 * Math.PI * 58 * (1 - pct / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 30, fontWeight: 900, color, fontFamily: "var(--font-head)" }}>
                {score.toFixed(1)}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>/ 10.0</span>
            </div>
          </div>

          <p style={{ fontSize: 20, fontWeight: 800, color, marginBottom: 28 }}>
            {label}
          </p>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
            {stats.map(({ icon, label, val }) => (
              <div key={label} style={{
                background: "var(--bg)", borderRadius: 14, padding: "16px",
                border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", fontFamily: "var(--font-head)" }}>{val}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => router.push("/")} className="btn-ghost" style={{ flex: 1 }}>
              ← Trang chủ
            </button>
            <button onClick={() => router.push(`/quiz/${params.id}`)} className="btn-primary" style={{ flex: 1 }}>
              Làm lại 🔄
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>⏳</div>}>
      <ResultContent />
    </Suspense>
  );
}
