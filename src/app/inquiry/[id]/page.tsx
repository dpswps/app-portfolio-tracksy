"use client";

import { useParams } from "next/navigation";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";

export default function InquiryDetailPage() {
  const params = useParams<{ id: string }>();
  const inquiries = useAppStore((s) => s.inquiries);
  const i = inquiries.find((x) => String(x.id) === String(params.id)) || inquiries[0];

  return (
    <>
      <AppHeader title="나의 문의내역" fallback="/inquiry/list" />
      <section className="inquiry-detail">
        <div className="info-row">
          <span className="k">문의유형</span>
          <span className="v">{i.type}</span>
        </div>
        <div className="info-row">
          <span className="k">제목</span>
          <span className="v">{i.title}</span>
        </div>
        <div className="info-row">
          <span className="k">문의일시</span>
          <span className="v">{i.date || "2026.01.01 14:30"}</span>
        </div>
        <div className="block">
          <div className="block-title">문의 내용</div>
          <div className="body-box">{i.body}</div>
        </div>
        {i.reply && (
          <div className="block">
            <div className="block-title">답변 내용</div>
            <div
              className="reply-box"
              dangerouslySetInnerHTML={{ __html: i.reply.replace(/\n/g, "<br/>") }}
            />
          </div>
        )}
      </section>
    </>
  );
}
