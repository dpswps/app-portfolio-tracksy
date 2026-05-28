"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  toggleAdminAction,
  deleteUserAction,
} from "./actions";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  auth_email: string | null;
  is_admin: boolean;
  has_onboarded: boolean;
  auth_created_at: string | null;
  last_sign_in_at: string | null;
  banned_until: string | null;
};

function formatDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function UsersTable({ users }: { users: User[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const onToggleAdmin = (u: User) => {
    if (!confirm(`${u.email || u.name || u.id} 의 관리자 권한을 ${u.is_admin ? "해제" : "부여"}하시겠어요?`)) return;
    setBusyId(u.id);
    startTransition(async () => {
      const res = await toggleAdminAction(u.id, !u.is_admin);
      setBusyId(null);
      if (!res.ok) alert(`실패: ${res.error}`);
      else router.refresh();
    });
  };

  const onDelete = (u: User) => {
    if (!confirm(`${u.email || u.id} 사용자를 영구 삭제하시겠어요?\n관련 데이터(러닝 기록·갤러리 등)도 모두 사라집니다.`)) return;
    setBusyId(u.id);
    startTransition(async () => {
      const res = await deleteUserAction(u.id);
      setBusyId(null);
      if (!res.ok) alert(`실패: ${res.error}`);
      else router.refresh();
    });
  };

  if (users.length === 0) {
    return (
      <div style={{ background: "#fff", padding: 40, borderRadius: 12, textAlign: "center", color: "#999" }}>
        조건에 맞는 사용자가 없습니다.
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#fafafa", borderBottom: "1px solid #eee" }}>
            <Th>이름</Th>
            <Th>이메일</Th>
            <Th>가입일</Th>
            <Th>최근 로그인</Th>
            <Th>관리자</Th>
            <Th>액션</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
              <Td>{u.name || "—"}</Td>
              <Td>{u.email || u.auth_email || "—"}</Td>
              <Td>{formatDate(u.auth_created_at)}</Td>
              <Td>{formatDate(u.last_sign_in_at)}</Td>
              <Td>
                {u.is_admin ? (
                  <span style={{ background: "#7C5CFF", color: "#fff", padding: "3px 8px", borderRadius: 4, fontSize: 11 }}>
                    Admin
                  </span>
                ) : (
                  <span style={{ color: "#999", fontSize: 11 }}>—</span>
                )}
              </Td>
              <Td>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => onToggleAdmin(u)}
                    disabled={pending && busyId === u.id}
                    style={{
                      padding: "4px 10px",
                      fontSize: 11,
                      borderRadius: 6,
                      border: "1px solid #ddd",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {u.is_admin ? "권한 해제" : "관리자 지정"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(u)}
                    disabled={pending && busyId === u.id}
                    style={{
                      padding: "4px 10px",
                      fontSize: 11,
                      borderRadius: 6,
                      border: 0,
                      background: "#fee2e2",
                      color: "#b91c1c",
                      cursor: "pointer",
                    }}
                  >
                    삭제
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>{children}</td>;
}
