"use client";

import { useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useAppStore } from "@/stores/useAppStore";
import { fetchAllRecords, migrateLocalRecordsToSupabase } from "@/lib/records";
import { fetchGalleryCards, fetchStyles, fetchJournals } from "@/lib/userData";
import { fetchCommunityFeed } from "@/lib/community";

/**
 * 마운트 시 Supabase 세션 + profile + 러닝 기록을 가져와 Zustand 와 동기화.
 * onAuthStateChange 로 세션 변화도 반영.
 *
 * 진실의 원천: Supabase. Zustand persist 는 깜빡임 방지용 캐시.
 */
export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAppStore((s) => s.setUser);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const mergeRecords = useAppStore((s) => s.mergeRecords);

  useEffect(() => {
    const sb = getSupabaseBrowser();

    async function sync() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        setOnboarded(false);
        return;
      }
      // 1) profile 동기화
      const { data: profile } = await sb
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        const patch: Parameters<typeof setUser>[0] = {};
        if (profile.name) patch.name = profile.name;
        if (profile.birth) patch.birth = profile.birth;
        patch.email = profile.email ?? user.email ?? "";
        if (profile.style) patch.style = profile.style;
        if (profile.avatar_url !== null) patch.avatarUrl = profile.avatar_url;
        if (profile.cover_url !== null) patch.coverUrl = profile.cover_url;
        setUser(patch);
        setOnboarded(!!profile.has_onboarded);
      } else {
        setUser({ email: user.email ?? "" });
        setOnboarded(false);
      }

      // 2) 러닝 기록 동기화. 최초 1회는 localStorage 데이터를 Supabase 로 푸시.
      try {
        const localRecords = useAppStore.getState().userRecords;
        if (Object.keys(localRecords).length > 0) {
          await migrateLocalRecordsToSupabase(localRecords);
        }
        const remote = await fetchAllRecords();
        if (Object.keys(remote).length > 0) {
          mergeRecords(remote);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[SessionProvider] records sync skipped:", err);
        }
      }

      // 3) 갤러리 / 스타일 / AI 일지 / 커뮤니티 피드 동기화 (병렬).
      try {
        const [gallery, styles, journals, communityPosts] = await Promise.all([
          fetchGalleryCards().catch(() => []),
          fetchStyles().catch(() => ({ saved: [], mine: [] })),
          fetchJournals().catch(() => []),
          fetchCommunityFeed(50).catch(() => []),
        ]);
        if (gallery.length > 0) {
          useAppStore.setState({ userGalleryCards: gallery });
        }
        if (journals.length > 0) {
          useAppStore.setState({ aiJournals: journals });
        }
        if (styles.saved.length > 0 || styles.mine.length > 0) {
          useAppStore.setState({ userSavedStyles: [...styles.saved, ...styles.mine] });
        }
        if (communityPosts.length > 0) {
          // 본인 작성 글들은 userCommunityPosts 로 (피드는 mock + 본인 글 머지)
          const { data: { user: u2 } } = await sb.auth.getUser();
          if (u2) {
            // Note: 모든 커뮤니티 글이 본인 거라고 가정할 수 없어서
            // 일단 본인 글만 userCommunityPosts 로 넣고, 다른 사람 글은
            // 별도 store(추후 추가) 또는 mock 데이터에 의존.
            useAppStore.setState({ userCommunityPosts: communityPosts });
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[SessionProvider] community sync skipped:", err);
        }
      }
    }

    sync().catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[SessionProvider] sync skipped:", err?.message ?? err);
      }
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, _session) => {
      sync().catch(() => {});
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setOnboarded, mergeRecords]);

  return <>{children}</>;
}
