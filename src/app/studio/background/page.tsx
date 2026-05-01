"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import RunningCard from "@/features/studio/RunningCard";
import { useAppStore } from "@/stores/useAppStore";

const SWATCHES = [
  "linear-gradient(135deg,#FFD89B,#19547B)",
  "linear-gradient(135deg,#FFAFBD,#FFC3A0)",
  "linear-gradient(135deg,#1F4037,#99F2C8)",
  "linear-gradient(135deg,#E0E0E0,#B0B0B0)",
  "linear-gradient(135deg,#FCE38A,#F38181)",
  "linear-gradient(135deg,#7B6499,#2E2A3D)",
];

export default function StudioBgPage() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const subtab = useAppStore((s) => s.bgPickerTab);
  const setSubtab = useAppStore((s) => s.setBgPickerTab);
  const [picked, setPicked] = useState(0);

  const apply = () => {
    showToast("배경이 적용되었어요");
    setTimeout(() => {
      if (window.history.length > 1) router.back();
      else router.push("/studio");
    }, 500);
  };

  return (
    <section className="studio-bg-screen">
      <div className="bg-preview">
        <RunningCard small />
      </div>
      <div className="bg-divider" />
      <div className="bg-tabs">
        <button className={`bg-tab${subtab === "mine" ? " active" : ""}`} onClick={() => setSubtab("mine")}>
          내 사진
        </button>
        <button className={`bg-tab${subtab === "ai" ? " active" : ""}`} onClick={() => setSubtab("ai")}>
          AI추천
        </button>
      </div>
      <div className="bg-grid">
        {SWATCHES.map((s, i) => (
          <button
            key={i}
            className="bg-tile"
            style={{ background: s }}
            onClick={() => setPicked(i)}
          >
            {picked === i && <span className="bg-check">✓</span>}
          </button>
        ))}
      </div>
      <button className="primary-btn bg-apply" onClick={apply}>
        배경 적용하기
      </button>
    </section>
  );
}
