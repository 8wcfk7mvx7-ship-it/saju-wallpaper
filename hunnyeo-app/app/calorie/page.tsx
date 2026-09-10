"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CALORIE_GROUPS, FOOD_COMPARE, burnedKcal } from "@/lib/hunnyeoCalorie";
import { loadJSON, saveJSON } from "@/lib/hunnyeoStorage";
import { tapFeedback } from "@/lib/hunnyeoHaptics";
import { pageStyle, RETRO_CSS } from "@/lib/hunnyeoTheme";
import PixelIcon from "@/components/PixelIcon";
import PixelFall from "@/components/PixelFall";

// 체중과 시간을 바꾸면 값이 바로 다시 계산된다. 계산은 전부 기기에서 하고 서버를 쓰지 않는다.

const WEIGHT_KEY = "hunnyeo_weight_v1";
const MINUTES = [10, 30, 60] as const;

export default function CaloriePage() {
  const router = useRouter();
  const [weight, setWeight] = useState(55);
  const [minutes, setMinutes] = useState<number>(60);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 localStorage에서 1회 하이드레이션
    setWeight(loadJSON<number>(WEIGHT_KEY, 55));
  }, []);

  function changeWeight(v: number) {
    setWeight(v);
    saveJSON(WEIGHT_KEY, v);
  }

  const hours = minutes / 60;

  // 표에서 가장 큰 값을 기준으로 막대 길이를 잡는다.
  const maxKcal = useMemo(() => {
    const all = CALORIE_GROUPS.flatMap(g => g.items.map(i => i.met));
    return burnedKcal(Math.max(...all), weight, hours);
  }, [weight, hours]);

  return (
    <main className="min-h-screen pb-20" style={pageStyle}>
      <style>{RETRO_CSS}</style>
      <PixelFall />

      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="hn-btn px-3 py-1.5 text-[11px]">
          ◀ 메뉴판
        </button>
        <span className="hn-sticker text-[10px]">칼로리표</span>
      </div>

      <header className="max-w-2xl mx-auto px-4 pt-4 text-center">
        <div className="mb-1"><PixelIcon name="flame" size={46} className="hn-wiggle" /></div>
        <h1 className="text-3xl font-black mb-1 hn-title">행동별 칼로리표</h1>
        <p className="hn-cute text-[12px] mb-3" style={{ color: "#f97316" }}>
          이것만 해도 이만큼 빠져요
        </p>
      </header>

      {/* 조건 고르기 */}
      <section className="max-w-2xl mx-auto px-4">
        <div className="hn-box p-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <label htmlFor="hn-weight" className="text-[12px] font-black" style={{ color: "#b06a94" }}>
              내 몸무게
            </label>
            <span className="hn-cute text-[18px]" style={{ color: "#c9186d" }}>{weight}kg</span>
          </div>
          <input
            id="hn-weight"
            type="range"
            min={35}
            max={110}
            step={1}
            value={weight}
            onChange={e => changeWeight(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: "#ff3d9a" }}
          />

          <p className="text-[12px] font-black mt-3 mb-1.5" style={{ color: "#b06a94" }}>얼마나 하면</p>
          <div className="flex gap-2">
            {MINUTES.map(m => (
              <button
                key={m}
                onClick={() => { tapFeedback(); setMinutes(m); }}
                className={`hn-btn flex-1 py-2 text-[12px] ${minutes === m ? "hn-btn-on" : ""}`}
                aria-pressed={minutes === m}
              >
                {m}분
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 표 */}
      <div className="max-w-2xl mx-auto px-4 mt-4 space-y-4">
        {CALORIE_GROUPS.map(group => (
          <section key={group.key} className="hn-box p-4" style={{ borderColor: group.accent, boxShadow: `4px 4px 0 ${group.accent}55` }}>
            <h2 className="hn-cute text-[15px] mb-3" style={{ color: group.accent }}>
              {group.label}
            </h2>
            <ul className="space-y-2.5">
              {group.items.map(item => {
                const kcal = burnedKcal(item.met, weight, hours);
                const ratio = Math.max(0.04, kcal / maxKcal);
                return (
                  <li key={item.name}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13.5px] font-bold" style={{ color: "#5c4653" }}>
                        {item.name}
                      </span>
                      <span className="hn-cute text-[15px] shrink-0" style={{ color: "#c9186d" }}>
                        {kcal}<span className="text-[11px]">kcal</span>
                      </span>
                    </div>
                    <div
                      className="mt-1 h-2.5 rounded-full overflow-hidden"
                      style={{ background: "#f4e6ee" }}
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${ratio * 100}%`, background: group.accent }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* 먹은 것과 견주기 */}
      <section className="max-w-2xl mx-auto px-4 mt-4">
        <div className="hn-box p-4" style={{ borderColor: "#fbbf24", boxShadow: "4px 4px 0 #fde68a" }}>
          <h2 className="hn-cute text-[15px] mb-1" style={{ color: "#c98a00" }}>
            먹은 것과 견주면
          </h2>
          <p className="text-[11.5px] font-bold mb-3" style={{ color: "#a8869a" }}>
            얼마나 움직여야 되돌릴 수 있는지 견주어 보세요.
          </p>
          <ul className="space-y-1.5">
            {FOOD_COMPARE.map(f => (
              <li
                key={f.name}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-[13px] font-bold"
                style={{ background: "#fffbe8", border: "2px dotted #f5b400", color: "#7a6a3a" }}
              >
                <span>{f.name}</span>
                <span style={{ color: "#c98a00" }}>{f.kcal}kcal</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 계산 근거 */}
      <section className="max-w-2xl mx-auto px-4 mt-4">
        <div
          className="rounded-2xl p-3.5"
          style={{ background: "#fff8e6", border: "2.5px dashed #f0a500" }}
        >
          <p className="hn-cute text-[13px] mb-2 flex items-center gap-1.5" style={{ color: "#b06a00" }}>
            <PixelIcon name="warning" size={14} /> 이 숫자는 어떻게 나왔냐면
          </p>
          <ul className="space-y-1.5 text-[11.5px] font-bold leading-relaxed" style={{ color: "#7a5a1e" }}>
            <li>· 소모 열량 = MET(활동 강도) × 몸무게(kg) × 시간</li>
            <li>· MET 값은 활동별 강도를 정리한 국제 자료를 따랐어요.</li>
            <li>· 나이·근육량·숙련도에 따라 실제로는 15%쯤 차이가 날 수 있어요.</li>
            <li>· 껌 씹기는 시간당 11kcal, 웃기는 소모가 20%까지 오른다는 연구를 따랐어요.</li>
          </ul>
        </div>
      </section>

      <p className="text-center text-[10px] mt-6 px-6 font-bold" style={{ color: "#c093ac" }}>
        그 시절 민간요법을 모은 추억 콘텐츠예요
      </p>
    </main>
  );
}
