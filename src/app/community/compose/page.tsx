"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { galleryCards } from "@/data/galleryCards";
import { styleCards } from "@/data/styleCards";

export default function CommunityComposePage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);
  const composeSelectedCardId = useAppStore((s) => s.composeSelectedCardId);
  const setComposeSelectedCardId = useAppStore((s) => s.setComposeSelectedCardId);
  const composeSelectedTemplateId = useAppStore(
    (s) => s.composeSelectedTemplateId,
  );
  const setComposeSelectedTemplateId = useAppStore(
    (s) => s.setComposeSelectedTemplateId,
  );
  const addCommunityPost = useAppStore((s) => s.addCommunityPost);
  const userGalleryCards = useAppStore((s) => s.userGalleryCards);
  const userSavedStyles = useAppStore((s) => s.userSavedStyles);
  const removedSavedStyleIds = useAppStore((s) => s.removedSavedStyleIds);

  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");

  // 카드 픽커에서 선택된 GalleryCard 를 보관함(userGalleryCards) + sample(galleryCards)
  // 양쪽에서 조회. id 는 문자열로 저장되므로 String() 비교.
  const selectedCard = composeSelectedCardId
    ? [...userGalleryCards, ...galleryCards].find(
        (c) => String(c.id) === String(composeSelectedCardId),
      ) ?? null
    : null;

  /**
   * 템플릿 픽커에서 선택된 StyleCard 조회.
   * 보관함 > 스타일 보관소 > 저장한 스타일 탭과 동일한 머지 규칙(사용자 우선 +
   * 삭제 처리된 id 제외). 카드보다 우선순위 없음 — 한 번에 하나만 선택 가능.
   */
  const selectedTemplate = (() => {
    if (!composeSelectedTemplateId) return null;
    const sampleCards = styleCards.saved || [];
    const seen = new Set<string>();
    const merged = [] as typeof userSavedStyles;
    for (const c of [...userSavedStyles, ...sampleCards]) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      merged.push(c);
    }
    return (
      merged.find(
        (c) =>
          String(c.id) === String(composeSelectedTemplateId) &&
          !removedSavedStyleIds.includes(c.id),
      ) ?? null
    );
  })();

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/community");
  };

  const goToPicker = () => router.push("/community/compose/cards");
  const goToTemplatePicker = () =>
    router.push("/community/compose/templates");

  const removeCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setComposeSelectedCardId(null);
  };
  const removeTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setComposeSelectedTemplateId(null);
  };

  /**
   * 해시태그 입력 정규화.
   *
   * 사용자가 다양한 방식으로 태그를 입력해도 일관된 포맷으로 저장한다:
   *   "한강러닝" → "#한강러닝"
   *   "한강러닝 모닝런" → "#한강러닝 #모닝런"
   *   "#한강러닝, #모닝런" → "#한강러닝 #모닝런"
   *   "한강러닝,모닝런" → "#한강러닝 #모닝런"
   *
   * 이렇게 정규화해두면 태그 게시판 매칭 로직(공백 split + 토큰 비교) 이 사용자
   * 게시글에서도 정확하게 동작한다. (이전엔 # 빠진 입력이 매칭에서 누락됐음.)
   */
  const normalizeTagsInput = (raw: string): string =>
    raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s.startsWith("#") ? s : `#${s}`))
      .join(" ");

  /**
   * 등록하기 — 사용자가 입력한 캡션 + 해시태그 + 선택한 카드의 bg(그라데이션/사진)
   * 로 오늘 날짜 게시글을 만들어 store 에 추가하고 커뮤니티 메인으로 이동.
   * 갤러리 카드는 별도 이미지 URL 이 없어서 bg(CSS string) 만 넘기면 FeedCard 가
   * 그대로 background 로 그려준다.
   */
  const onSubmit = () => {
    // 카드/템플릿 둘 다 미리보기로 받을 수 있지만, 등록 시 우선순위는
    // selectedCard > selectedTemplate. 둘 다 없고 텍스트도 없으면 안내.
    if (!caption.trim() && !tags.trim() && !selectedCard && !selectedTemplate) {
      showToast("내용을 입력하거나 카드/템플릿을 가져와주세요");
      return;
    }
    const visualBg = selectedCard?.bg ?? selectedTemplate?.bg;
    addCommunityPost({
      caption,
      // 저장 직전에 항상 정규화 — 검색 매칭 시 누락 방지.
      tags: normalizeTagsInput(tags),
      // bg 가 "url(...)" 형식이면 image 로, 아니면 (그라데이션 등) bg 로 넘김.
      // FeedCard 는 image 가 있으면 url(image) cover 로, 없으면 bg 를 그대로 사용.
      image: visualBg?.startsWith("url(")
        ? visualBg.match(/url\(["']?([^"')]+)["']?\)/)?.[1]
        : undefined,
      bg: visualBg,
    });
    setCaption("");
    setTags("");
    showToast("게시글이 등록되었어요");
    router.push("/community");
  };

  return (
    <div className="comm-compose-screen">
      <div className="app-header comm-post-header">
        <button className="back-btn" onClick={back}>
          ‹
        </button>
        <div className="comm-post-user">
          <div
            className="cpu-avatar"
            style={{ background: "linear-gradient(135deg,#A78BFA,#7C3AED)" }}
          />
          <span>{user.name || "김러너"}</span>
        </div>
        {/* 우측 상단 북마크 버튼 제거. 헤더 균형 유지를 위해 spacer 만 둠. */}
        <span style={{ marginLeft: "auto", width: 32, height: 32 }} aria-hidden="true" />
      </div>
      <section className="comm-compose">
        {selectedCard ? (
          /* 선택된 카드 미리보기 — 갤러리 카드와 동일한 콘텐츠를 세로형(portrait)
             컨테이너에 렌더링. 보관함의 카드 시각을 그대로 가져오면서, 글쓰기 화면에
             맞게 카드 비율만 세로형으로 변경. */
          <div
            className="compose-canvas has-card-preview"
            onClick={goToPicker}
            role="button"
            tabIndex={0}
          >
            <div className="cc-gcard" aria-label={`${selectedCard.title} 카드`}>
              <div className="cc-gcard-bg" style={{ background: selectedCard.bg }} />
              <div className="cc-gcard-overlay" />
              <div className="cc-gcard-content">
                <div className="cc-gcard-meta">{selectedCard.date}</div>
                <div className="cc-gcard-title">{selectedCard.title}</div>
                <div className="cc-gcard-dist">
                  {selectedCard.dist}
                  <small>킬로미터</small>
                </div>
                <div className="cc-gcard-stats">
                  <div><b>{selectedCard.pace}</b><i>평균 페이스</i></div>
                  <div><b>{selectedCard.time}</b><i>시간</i></div>
                  <div><b>{selectedCard.kcal}</b><i>칼로리</i></div>
                  <div><b>{selectedCard.elev}</b><i>누적 상승</i></div>
                  <div><b>{selectedCard.cadence}</b><i>케이던스</i></div>
                  <div><b>{selectedCard.bpm}</b><i>평균 심박</i></div>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="cc-card-remove"
              onClick={removeCard}
              aria-label="카드 제거"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ) : selectedTemplate ? (
          /* 선택된 템플릿(StyleCard) 미리보기 — 카드 미리보기와 동일한 .cc-gcard
             컴포지션 재사용. 보관함의 스타일 카드 시각을 그대로 가져오되, StyleCard
             는 stats 가 동적 배열이라 .slice(0, 6) 로 최대 6개까지 노출 (카드의
             고정 6필드와 시각적 길이 균형 유지). */
          <div
            className="compose-canvas has-card-preview"
            onClick={goToTemplatePicker}
            role="button"
            tabIndex={0}
          >
            <div
              className="cc-gcard"
              aria-label={`${selectedTemplate.title} 템플릿`}
            >
              <div
                className="cc-gcard-bg"
                style={{ background: selectedTemplate.bg }}
              />
              <div className="cc-gcard-overlay" />
              <div className="cc-gcard-content">
                <div className="cc-gcard-meta">{selectedTemplate.date}</div>
                <div className="cc-gcard-title">{selectedTemplate.title}</div>
                <div
                  className="cc-gcard-dist"
                  style={
                    selectedTemplate.distColor
                      ? { color: selectedTemplate.distColor }
                      : undefined
                  }
                >
                  {selectedTemplate.dist}
                  <small>킬로미터</small>
                </div>
                <div className="cc-gcard-stats">
                  {selectedTemplate.stats.slice(0, 6).map((s, i) => (
                    <div key={i}>
                      <b>{s.v}</b>
                      <i>{s.l}</i>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="cc-card-remove"
              onClick={removeTemplate}
              aria-label="템플릿 제거"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="compose-canvas">
            {/* 캐릭터 + 카드 아이콘 — public/tracksy-card.png (트랙시 마스코트가 카드 액자
                를 들고 있는 단일 일러스트). 이전 Mascot + 별도 카드 SVG 두 개를 합쳐
                하나의 이미지로 대체. */}
            <div className="cc-tracksy">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/tracksy-card.png" alt="" draggable={false} />
            </div>
            <div className="cc-bring">카드 가져오기</div>
            <button
              className="cc-plus"
              onClick={goToPicker}
              aria-label="카드 가져오기"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        )}
        <div className="compose-fields">
          <input
            type="text"
            className="compose-input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="캡션 추가..."
          />
          <input
            type="text"
            className="compose-input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="해시태그 추가..."
          />
        </div>
        <div className="compose-actions">
          <button
            className="compose-template-btn"
            onClick={goToTemplatePicker}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
              <path d="M6 3h12v18l-6-4-6 4z" />
            </svg>
            저장된 템플릿 가져오기
          </button>
          <button
            className="compose-submit-btn"
            onClick={onSubmit}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            등록하기
          </button>
        </div>
      </section>
    </div>
  );
}
