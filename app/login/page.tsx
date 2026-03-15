"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"owner" | "student">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function submit() {
    setLoading(true); setError("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { username, role } },
        });
        if (error) throw error;
      }
      router.push("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24, background: "var(--bg)",
    }}>
      <div className="card fade-up" style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
          <h1 style={{ fontSize: 28, color: "var(--text)", margin: 0 }}>QuizCraft</h1>
          <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
            {mode === "login" ? "Đăng nhập để tiếp tục" : "Tạo tài khoản mới"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "var(--bg)", borderRadius: 12, padding: 4 }}>
          {(["login", "register"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              background: mode === m ? "var(--accent)" : "transparent",
              color: mode === m ? "#fff" : "var(--muted)",
              border: "none", fontFamily: "var(--font-head)",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
              transition: "all .2s",
            }}>
              {m === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "register" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6, letterSpacing: ".06em" }}>
                  TÊN HIỂN THỊ
                </label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Tên của bạn..." />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6, letterSpacing: ".06em" }}>
                  VAI TRÒ
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {([["student", "🎓 Học sinh"], ["owner", "👑 Giáo viên / Chủ đề"]] as const).map(([v, label]) => (
                    <button key={v} onClick={() => setRole(v)} style={{
                      flex: 1, padding: "12px 8px", borderRadius: 12,
                      border: `2px solid ${role === v ? "var(--accent)" : "var(--border)"}`,
                      background: role === v ? "var(--accent-soft)" : "transparent",
                      color: role === v ? "var(--accent)" : "var(--muted)",
                      fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 13,
                      cursor: "pointer", transition: "all .2s",
                    }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6, letterSpacing: ".06em" }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6, letterSpacing: ".06em" }}>MẬT KHẨU</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && submit()} />
          </div>

          {error && (
            <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button className="btn-primary" onClick={submit} disabled={loading} style={{ marginTop: 8, opacity: loading ? .7 : 1 }}>
            {loading ? "⏳ Đang xử lý..." : mode === "login" ? "Đăng nhập →" : "Tạo tài khoản →"}
          </button>
        </div>
      </div>
    </div>
  );
}
