"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { replyInquiryAction, markStatusAction } from "./actions";

type Item = {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  body: string;
  reply: string | null;
  status: string;
  created_at: string;
  authorName: string | null;
  authorEmail: string | null;
};

export default function InquiriesList({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <div style={{ background: "#fff", padding: 40, borderRadius: 12, textAlign: "center", color: "#999" }}>문의가 없습니다.</div>;
  }
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((i) => (
        <InquiryCard key={i.id} item={i} />
      ))}
    </div>
  );
}

function InquiryCard({ item }: { item: Item }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(item.reply ?? "");
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    if (!reply.trim()) {
      alert("답변 내용을 입력해주세요");
      return;
    }
    startTransition(async () => {
      const res = await replyInquiryAction(item.id, reply);
      if (!res.ok) alert(`실패: ${res.error}`);
      else router.refresh();
    });
  };

  const onMark = (status: "wait" | "done") => {
    startTransition(async () => {
      const res = await markStatusAction(item.id, status);
      if (!res.ok) alert(`실패: ${res.error}`);
      else router.refresh();
    });
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span
              style={{
                fontSize: 11,
                background: item.status === "done" ? "#dcfce7" : "#fef3c7",
                color: item.status === "done" ? "#166534" : "#92400e",
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              {item.status === "done" ? "처리완료" : "미답변"}
            </span>
            <span style={{ fontSize: 11, color: "#666" }}>{item.type}</span>
            <span style={{ fontSize: 11, color: "#999" }}>{new Date(item.created_at).toLocaleString("ko-KR")}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
          <div style={{ fontSize: 12, color: "#777", marginBottom: 10 }}>
            {item.authorName || "(이름없음)"} · {item.authorEmail || "비로그인"}
          </div>
          <div style={{ fontSize: 13, color: "#333", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{item.body}</div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}
        >
          {open ? "닫기" : "답변"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #eee" }}>
          <label style={{ fontSize: 12, color: "#555", display: "block", marginBottom: 6 }}>답변 내용</label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={5}
            disabled={pending}
            placeholder="답변을 작성하세요"
            style={{
              width: "100%",
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 10,
              fontSize: 13,
              resize: "vertical",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
            {item.status === "done" ? (
              <button type="button" onClick={() => onMark("wait")} disabled={pending} style={btnSecondary}>미답변으로</button>
            ) : (
              <button type="button" onClick={() => onMark("done")} disabled={pending} style={btnSecondary}>답변없이 완료처리</button>
            )}
            <button type="button" onClick={onSave} disabled={pending} style={btnPrimary}>
              {pending ? "저장 중…" : "답변 저장 + 완료처리"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  background: "#1a1a2e",
  color: "#fff",
  border: 0,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  background: "#fff",
  color: "#444",
  border: "1px solid #ddd",
  fontSize: 13,
  cursor: "pointer",
};
