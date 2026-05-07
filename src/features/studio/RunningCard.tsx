"use client";

import Mascot from "@/components/ui/Mascot";
import { useAppStore } from "@/stores/useAppStore";

export default function RunningCard({ small = false }: { small?: boolean }) {
  const bg = useAppStore((s) => s.studioBackground);
  const rotate = useAppStore((s) => s.studioRotate);
  const flipH = useAppStore((s) => s.studioFlipH);
  const flipV = useAppStore((s) => s.studioFlipV);
  const crop = useAppStore((s) => s.studioCrop);
  const ratio = useAppStore((s) => s.studioRatio);

  const transforms: string[] = [];
  if (rotate) transforms.push(`rotate(${rotate}deg)`);
  if (flipH) transforms.push("scaleX(-1)");
  if (flipV) transforms.push("scaleY(-1)");
  if (crop && crop !== 1) transforms.push(`scale(${crop})`);
  const transform = transforms.length > 0 ? transforms.join(" ") : undefined;

  const photoStyle = bg
    ? {
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transform,
        transformOrigin: "center",
        transition: "transform 0.18s ease",
      }
    : transform
    ? { transform, transformOrigin: "center", transition: "transform 0.18s ease" }
    : undefined;

  // ratio is consumed by card-stage in studio/page.tsx; reference it here so
  // the component re-renders when ratio changes (no-op on small preview).
  void ratio;

  return (
    <div className={`running-card${small ? " small" : ""}`}>
      <div className="rc-photo" style={photoStyle} />
      <div className="rc-grad" />
      {!bg && <div className="rc-runner" />}

      <div className="rc-top">
        <div className="rc-top-left">
          <div className="rc-avatar">
            <Mascot />
          </div>
          <div className="rc-name">닉네임</div>
        </div>
        <div className="rc-top-right">
          <span>오늘도 저님</span>
        </div>
      </div>
      <div className="rc-date">2026.04.06 (월)</div>

      <div className="rc-week">
        이번주 러닝 기록 <span>🏃</span>
      </div>
      <div className="rc-distance">
        5.21<small>km</small>
      </div>

      <div className="rc-stats">
        <div className="rc-stat">
          <span className="rc-ic">⏱</span>
          <b>00:32:45</b>
          <i>운동 시간</i>
        </div>
        <div className="rc-stat">
          <span className="rc-ic">⚡</span>
          <b>6&apos;12&quot;</b>
          <i>평균 페이스</i>
        </div>
        <div className="rc-stat">
          <span className="rc-ic">🔥</span>
          <b>368</b>
          <i>kcal</i>
        </div>
      </div>

      <div className="rc-bubble-wrap">
        <div className="rc-bubble">
          처음 발걸음이<br />
          큰 변화를 만들어요! <span>💜</span>
        </div>
        <div className="rc-mascot">
          <Mascot />
        </div>
      </div>
    </div>
  );
}
