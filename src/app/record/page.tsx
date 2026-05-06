"use client";

import AppHeader from "@/components/ui/AppHeader";
import ImportSection from "@/features/archive/ImportSection";

export default function RecordPage() {
  return (
    <>
      <AppHeader title="기록 추가하기" fallback="/home" />
      <section className="record-screen">
        <div className="record-intro">
          <h2>러닝 기록 추가</h2>
          <p>오늘의 러닝을 어떻게 추가할까요?</p>
        </div>
        <ImportSection />
      </section>
    </>
  );
}
