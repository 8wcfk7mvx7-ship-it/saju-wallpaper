"use client";
import { useEffect, useRef } from "react";

export interface SelectionMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  /** 이미 적용된 서식이면 체크 표시를 곁들여 보여준다(다시 누르면 해제). */
  active?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: SelectionMenuItem[];
  onClose: () => void;
}

export default function SelectionMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  const left = typeof window !== "undefined" ? Math.min(x, window.innerWidth - 220) : x;
  const top = typeof window !== "undefined" ? Math.min(y, window.innerHeight - items.length * 36 - 16) : y;

  return (
    <div
      ref={ref}
      className="fixed z-[200] rounded-xl overflow-hidden py-1 min-w-[200px]"
      style={{
        left: Math.max(8, left),
        top: Math.max(8, top),
        background: "#fffdf7",
        border: "1px solid rgba(0,0,0,0.1)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose(); }}
          className="w-full text-left px-3.5 py-1.5 text-sm font-semibold hover:bg-black/5 transition-colors flex items-center gap-1.5"
          style={{ color: item.danger ? "#b91c1c" : "#2a2417" }}
        >
          {item.active && <span style={{ color: "#4f46e5" }}>✓</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}
