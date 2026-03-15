"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Toast } from "@/components/Toast";
import type { Exam, AnswerState } from "@/types";

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [toast, setToast] = useState<{ msg: string; type: "correct"|"wrong"|"retry" } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.from("exams").select("*").eq("id", id).single()
      .then(({ data }) => {
        if (!data) { router.push("/"); return; }
        const expired = new Date(data.exp_date) < new Date();
        if (expired) { router.push("/"); return; }
        setExam(data);
        timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      });
    return () => clearInterval(timerRef.current);
  }, [id]);

  const showToast = useCallback((msg: string, type: "correct"|"wrong"|"retry") => {
    setToast(null);
    requestAnimationFrame(() => setToast({ msg, type }));
  }, []);

  function choose(idx: number) {
    if (!exam) return;
    const q = exam.questions[current];
    if (answers[current]?.correct) return;
    const correct = idx === q.correctIndex;
    const attempts = (answers[current]?.attempts || 0) + 1;
    setAnswers(a => ({ ...a, [current]: { chosen: idx, correct, attempts } }));
    if (correct) {
      showToast(attempts > 1 ? "Cố gắng, cẩn thận hơn nhé 👍" : "Xuất sắc, giữ vững phong độ nhé! 🌟",
        attempts > 1 ? "retry" : "correct");
    } else {
      showToast("Không đúng, vui lòng thử lại 🔄", "wrong");
    }
  }

  async function finish() {
    if (!exam) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    const correct_count = Object.values(answers).filter(a => a.correct).length;
    const total_count = exam.questions.length;
    const score = parseFloat(((correct_count / total_count) * 10).toFixed(2));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: exam.id, answers, correct_count, total_count, score, elapsed_seconds: elapsed }),
      });
    }
    router.push(`/quiz/${id}/result?correct=${correct_count}&total=${total_count}&score=${score}&elapsed=${elapsed}`);
  }

  if (!exam) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 36, animation: "spin 1s linear infinite" }}>⚙️</div>
    </div>
  );

  const q = exam.questions[current];
  const ans = answers[current];
  const isShort = q.short || q.options.every(o => o.replace(/^[A-D][.)]\s*/, "").length < 45);
  const progress = ((current + 1) / exam.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* Header strip */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, color: "var(--text)" }}>{exam.title}</p>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              {answeredCount}/{exam.questions.length} đã trả lời · ⏱ {formatTime(elapsed)}
            </p>
          </div>
          <button onClick={finish} disabled={submitting} className="btn-primary" style={{ fontSize: 14, padding: "10px 20px" }}>
            {submitting ? "⏳" : "Nộp bài"}
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: "var(--border)", borderRadius: 99, marginBottom: 22, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent)", borderRadius: 99, transition: "width .4s ease" }} />
        </div>

        {/* Question dots */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28, justifyContent: "center" }}>
          {exam.questions.map((_, i) => {
            const a = answers[i];
            return (
              <button key={i} onClick={() => setCurrent(i)} style={{
                width: 30, height: 30, borderRadius: 8,
                border: i === current ? "2px solid var(--accent)" : "2px solid transparent",
                background: a?.correct ? "#22c55e" : a ? "#ef4444" : "var(--border)",
                color: a ? "#fff" : "var(--muted)",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: "var(--font-head)", transition: "all .18s",
                transform: i === current ? "scale(1.15)" : "scale(1)",
              }}>{i + 1}</button>
            );
          })}
        </div>

        {/* Question card */}
        <div className="card fade-up" key={current} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.65, color: "var(--text)", marginBottom: 28 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, background: "var(--accent)", color: "#fff",
              borderRadius: 10, fontSize: 14, fontWeight: 900, marginRight: 12,
              flexShrink: 0, verticalAlign: "middle",
            }}>{current + 1}</span>
            {q.text}
          </p>

          <div style={{
            display: isShort ? "grid" : "flex",
            gridTemplateColumns: isShort ? "1fr 1fr" : undefined,
            flexDirection: isShort ? undefined : "column",
            gap: 12,
          }}>
            {q.options.map((opt, i) => {
              const label = opt.replace(/^[A-D][.)]\s*/, "");
              const isCorrect = i === q.correctIndex;
              const isChosen = ans?.chosen === i;
              const revealed = ans?.correct;
              let bg = "var(--bg)";
              let border = "var(--border)";
              let textColor = "var(--text)";
              if (revealed && isCorrect)  { bg = "#dcfce7"; border = "#22c55e"; textColor = "#15803d"; }
              else if (isChosen && !ans?.correct) { bg = "#fee2e2"; border = "#ef4444"; textColor = "#b91c1c"; }
              else if (!ans && !revealed) { /* default */ }

              return (
                <button key={i} onClick={() => choose(i)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: bg, border: `2px solid ${border}`, borderRadius: 14,
                  padding: isShort ? "14px 14px" : "14px 18px",
                  color: textColor, fontFamily: "var(--font-body)",
                  fontSize: 15, fontWeight: isChosen || (revealed && isCorrect) ? 700 : 400,
                  cursor: ans?.correct ? "default" : "pointer",
                  textAlign: "left", transition: "all .2s", lineHeight: 1.5,
                  transform: "scale(1)",
                }}
                  onMouseEnter={e => { if (!ans?.correct) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.01)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
                >
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: border === "var(--border)" ? "var(--border)" : border,
                    color: border === "var(--border)" ? "var(--muted)" : "#fff",
                    fontSize: 12, fontWeight: 900, fontFamily: "var(--font-head)",
                  }}>
                    {["A", "B", "C", "D"][i]}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0} className="btn-ghost"
            style={{ flex: 1, opacity: current === 0 ? .4 : 1, cursor: current === 0 ? "not-allowed" : "pointer" }}>
            ← Trước
          </button>
          <button
            onClick={() => current < exam.questions.length - 1 ? setCurrent(c => c + 1) : finish()}
            className="btn-primary" style={{ flex: 2 }}>
            {current === exam.questions.length - 1 ? "Nộp bài 🎉" : "Tiếp →"}
          </button>
        </div>
      </main>

      {toast && <Toast key={Date.now()} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}
