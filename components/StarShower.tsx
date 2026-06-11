"use client";

export default function StarShower({ active }: { active: boolean }) {
  if (!active) return null;
  const stars = Array.from({ length: 28 });
  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      <style>{`@keyframes starfall{0%{transform:translateY(-10vh) rotate(0deg) scale(1);opacity:1}100%{transform:translateY(110vh) rotate(360deg) scale(0.6);opacity:0}}`}</style>
      {stars.map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: "-5%",
            fontSize: `${12 + Math.random() * 22}px`,
            color: i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#f472b6" : "#a78bfa",
            animation: `starfall ${0.6 + Math.random() * 0.6}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.25}s`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}
