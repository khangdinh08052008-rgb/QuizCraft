"use client";
import { useEffect } from "react";

type ToastType = "correct" | "wrong" | "retry" | "info" | "error";

interface ToastProps {
  msg: string;
  type: ToastType;
  onDone: () => void;
}

const COLORS: Record<ToastType, string> = {
  correct: "#22c55e",
  wrong:   "#ef4444",
  retry:   "#f59e0b",
  info:    "#6366f1",
  error:   "#dc2626",
};

export function Toast({ msg, type, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed",
      bottom: 36,
      left: "50%",
      transform: "translateX(-50%)",
      background: COLORS[type],
      color: "#fff",
      padding: "14px 28px",
      borderRadius: 16,
      fontFamily: "var(--font-head)",
      fontSize: 15,
      fontWeight: 700,
      boxShadow: `0 8px 32px ${COLORS[type]}55`,
      zIndex: 9999,
      animation: "toastIn .35s cubic-bezier(.34,1.56,.64,1) both",
      maxWidth: 360,
      textAlign: "center",
      letterSpacing: ".01em",
      pointerEvents: "none",
    }}>
      {msg}
    </div>
  );
}
