"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Profile } from "@/types";

export function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dark, setDark] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  async function logout() {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 200,
      background: "var(--card)",
      borderBottom: "1px solid var(--border)",
      height: 60,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px",
      backdropFilter: "blur(16px)",
    }}>
      {/* Logo */}
      <button onClick={() => router.push("/")} style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 22,
        color: "var(--accent)", letterSpacing: "-.02em",
      }}>
        ⚡ QuizCraft
      </button>

      {/* Right controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {profile && (
          <>
            <span style={{
              fontSize: 13, color: "var(--muted)", fontWeight: 600,
              background: "var(--accent-soft)", padding: "4px 12px",
              borderRadius: 99,
            }}>
              {profile.role === "owner" ? "👑" : "🎓"} {profile.username}
            </span>
            {profile.role === "owner" && (
              <button onClick={() => router.push("/dashboard")} style={{
                background: "var(--accent)", color: "#fff", border: "none",
                padding: "7px 16px", borderRadius: 10, fontSize: 13,
                fontWeight: 700, fontFamily: "var(--font-head)", cursor: "pointer",
              }}>
                Dashboard
              </button>
            )}
          </>
        )}
        <button onClick={() => setDark(d => !d)} style={{
          background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 16,
        }}>
          {dark ? "☀️" : "🌙"}
        </button>
        {profile && (
          <button onClick={logout} style={{
            background: "transparent", color: "var(--muted)",
            border: "1px solid var(--border)", padding: "7px 14px",
            borderRadius: 10, fontSize: 13, fontWeight: 600,
            fontFamily: "var(--font-body)", cursor: "pointer",
          }}>
            Đăng xuất
          </button>
        )}
      </div>
    </nav>
  );
}
