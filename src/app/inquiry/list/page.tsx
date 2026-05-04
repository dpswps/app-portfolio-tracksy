"use client";

import Link from "next/link";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";

export default function InquiryListPage() {
  const inquiries = useAppStore((s) => s.inquiries);

  return (
    <>
      <AppHeader title="나의 문의내역" fallback="/settings" />
      <section className="inquiry-list">
        {inquiries.map((i) => {
          const tagClass = i.type === "서비스 이용" ? "purple" : i.type === "계정/로그인" ? "orange" : "gray";
          return (
            <Link
              key={i.id}
              href={`/inquiry/${i.id}`}
              className="inquiry-card"
              style={{ display: "block", textDecoration: "none", color: "inherit" }}
            >
              <div className="row1">
                <span className={`tag ${tagClass}`}>{i.type}</span>
                {i.status === "done" ? (
                  <span className="tag status-done">답변 완료</span>
                ) : (
                  <span className="tag status-wait">답변 대기</span>
                )}
              </div>
              <div className="title-line">{i.title}</div>
              <div className="desc">{i.body}</div>
            </Link>
          );
        })}
      </section>
    </>
  );
}
