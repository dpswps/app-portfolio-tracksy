"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/supabase/auth";

export default function AdminLogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      await signOut();
    } catch {}
    router.replace("/admin/login");
  };
  return (
    <button
      type="button"
      onClick={handleLogout}
      style={{
        display: "block",
        width: "100%",
        padding: "10px 12px",
        marginTop: 4,
        color: "#fca5a5",
        background: "none",
        border: 0,
        textAlign: "left",
        fontSize: 13,
        cursor: "pointer",
        borderRadius: 8,
      }}
    >
      로그아웃
    </button>
  );
}
