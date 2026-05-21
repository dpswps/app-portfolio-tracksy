"use client";

import { useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";

/**
 * 스튜디오 스티커 풀 — Tracksy 마스코트 캐릭터 12종.
 * `key` 는 캔버스에 저장될 식별자(이미지 경로). `label` 은 토스트/접근성용.
 * placedStickers의 emoji 필드에 경로를 그대로 담아둔다. 렌더 시 PlacedStickers
 * 가 "/" 로 시작하는 값은 <img> 로, 그 외는 텍스트로 그린다.
 */
const STICKERS: { key: string; label: string }[] = [
  { key: "/stickers/happy.png", label: "행복" },
  { key: "/stickers/laughing.png", label: "웃음" },
  { key: "/stickers/excited.png", label: "신남" },
  { key: "/stickers/kissing.png", label: "키스" },
  { key: "/stickers/cool.png", label: "쿨" },
  { key: "/stickers/nervous.png", label: "긴장" },
  { key: "/stickers/sleepy.png", label: "졸림" },
  { key: "/stickers/shocked.png", label: "놀람" },
  { key: "/stickers/dizzy.png", label: "어지러움" },
  { key: "/stickers/crying.png", label: "눈물" },
  { key: "/stickers/angry.png", label: "화남" },
  { key: "/stickers/furious.png", label: "분노" },
];

function StickerGrid() {
  const addSticker = useAppStore((s) => s.addSticker);
  const showToast = useAppStore((s) => s.showToast);
  const expanded = useAppStore((s) => s.studioStickersExpanded);
  const setExpanded = useAppStore((s) => s.setStudioStickersExpanded);

  /* ──────────────────────────────────────────────────────────
   * Drag handle — 스티커 그리드 상단에 위치.
   *
   * 동작:
   *   - 단순 클릭/탭 → 펼침/접힘 토글
   *   - 위로 드래그(dy < -8) + 접힘 상태 → 펼침
   *   - 아래로 드래그(dy >  8) + 펼침 상태 → 접힘
   *   - 키보드: ↑ 펼침 / ↓ 접힘 / Enter·Space 토글
   *
   * 보관함의 Calendar 의 drag handle 패턴과 동일 구현. 드래그가 발동되면
   * 그 직후의 click 이벤트는 한 번 무시 → 중복 토글 방지.
   * ────────────────────────────────────────────────────────── */
  const dragStartY = useRef<number | null>(null);
  const dragStartExpanded = useRef<boolean>(false);
  const triggered = useRef<boolean>(false);
  const dragWasTriggered = useRef<boolean>(false);
  const DRAG_THRESHOLD = 8;

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartY.current = e.clientY;
    dragStartExpanded.current = expanded;
    triggered.current = false;
    dragWasTriggered.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };
  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || triggered.current) return;
    const dy = e.clientY - dragStartY.current;
    if (!dragStartExpanded.current && dy < -DRAG_THRESHOLD) {
      triggered.current = true;
      dragWasTriggered.current = true;
      setExpanded(true);
    } else if (dragStartExpanded.current && dy > DRAG_THRESHOLD) {
      triggered.current = true;
      dragWasTriggered.current = true;
      setExpanded(false);
    }
  };
  const onHandlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current !== null) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    }
    dragStartY.current = null;
    triggered.current = false;
  };
  const onHandleClick = () => {
    if (dragWasTriggered.current) {
      dragWasTriggered.current = false;
      return;
    }
    setExpanded(!expanded);
  };
  const onHandleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setExpanded(true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setExpanded(false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setExpanded(!expanded);
    }
  };

  return (
    <div className={`sp-stickers-wrap${expanded ? " expanded" : ""}`}>
      {/* 오버레이 — 패널 위(캔버스 영역) 에 떠 있는 absolute 컨테이너.
          내부 구성: [핸들(위) + 그리드(아래)]. 핸들은 항상 보이고, 그리드만
          max-height/opacity 로 접힘 토글된다.
          접힘 시: 오버레이 = 핸들만 → 패널 바로 위에 작은 chevron 만 노출.
          펼침 시: 오버레이 = 핸들 + 그리드 → 위쪽으로 확장(캔버스 영역 침범).
          결과 배치: canvas → 핸들(▼) → 그리드 → 패널 본체 → 탭바. */}
      <div className="sp-stickers">
        <div
          className="sp-stickers-handle"
          role="button"
          tabIndex={0}
          aria-label={expanded ? "스티커 접기" : "스티커 펼치기"}
          aria-expanded={expanded}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerEnd}
          onPointerCancel={onHandlePointerEnd}
          onClick={onHandleClick}
          onKeyDown={onHandleKeyDown}
        >
          <svg
            className="sps-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* 펼침 → ▼ (눌러서/내려서 접기 안내)
                접힘 → ▲ (눌러서/올려서 펼치기 안내) */}
            {expanded ? (
              <polyline points="6 9 12 15 18 9" />
            ) : (
              <polyline points="6 15 12 9 18 15" />
            )}
          </svg>
        </div>
        <div className="sp-stickers-grid">
          {STICKERS.map((s) => (
            <button
              key={s.key}
              className="sp-sticker sp-sticker-img"
              onClick={() => {
                addSticker(s.key);
                showToast(`${s.label} 스티커 추가됨`);
                // 사용자가 스티커를 캔버스에 추가한 직후 메뉴 자동 접기.
                setExpanded(false);
              }}
              aria-label={s.label}
              title={s.label}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.key} alt={s.label} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TextTab() {
  const texts = useAppStore((s) => s.studioTexts);
  const activeId = useAppStore((s) => s.studioActiveTextId);
  const submenu = useAppStore((s) => s.studioTextSubmenu);
  const setSubmenu = useAppStore((s) => s.setStudioTextSubmenu);
  const addText = useAppStore((s) => s.addStudioText);
  const setActiveTextId = useAppStore((s) => s.setActiveStudioText);
  const showToast = useAppStore((s) => s.showToast);
  // 카드 빌트인 필드도 텍스트 편집 대상 — 카드 텍스트를 탭하면 activeCardField
  // 가 설정되고, 그 상태에서 글꼴/글자크기/색상 모두 그 필드에 적용된다.
  // 삭제는 별도 버튼이 아닌 drag-to-trash 로 처리 (EditableText 가 직접 담당).
  const activeCardField = useAppStore((s) => s.studioActiveCardField);

  const hasActive =
    texts.some((t) => t.id === activeId) || activeCardField != null;
  const toggle = (m: "font" | "size" | "color") => {
    // 활성 텍스트가 없을 때:
    //  - 캔버스에 텍스트가 하나라도 있으면 → 가장 최근 텍스트를 자동 선택해서
    //    바로 도구를 열어준다. (사용자가 텍스트 추가 후 매번 다시 탭해야 했던
    //    번거로움 제거.)
    //  - 텍스트가 하나도 없으면 → 토스트로 안내.
    if (!hasActive) {
      if (texts.length > 0) {
        setActiveTextId(texts[texts.length - 1].id);
        setSubmenu(m);
        return;
      }
      showToast("먼저 텍스트를 추가해주세요");
      return;
    }
    setSubmenu(submenu === m ? "none" : m);
  };

  return (
    <div className="sp-tools sp-text">
      <button className="sp-tool" onClick={() => addText()}>
        <span className="sp-ic">
          <b style={{ fontSize: 18 }}>＋</b>
        </span>
        <i>텍스트 추가</i>
      </button>
      <button
        className={`sp-tool${submenu === "font" ? " active" : ""}`}
        onClick={() => toggle("font")}
      >
        <span className="sp-ic">
          <b style={{ fontSize: 18, fontFamily: "serif" }}>Aa</b>
        </span>
        <i>글꼴</i>
      </button>
      <button
        className={`sp-tool${submenu === "size" ? " active" : ""}`}
        onClick={() => toggle("size")}
      >
        <span className="sp-ic">
          <b style={{ fontSize: 18 }}>Tr</b>
        </span>
        <i>글자크기</i>
      </button>
      <button
        className={`sp-tool${submenu === "color" ? " active" : ""}`}
        onClick={() => toggle("color")}
      >
        <span className="sp-ic">
          <span className="color-wheel" />
        </span>
        <i>색상</i>
      </button>
    </div>
  );
}

export default function StudioPanel({ tab }: { tab: "edit" | "text" | "sticker" | "design" }) {
  const showToast = useAppStore((s) => s.showToast);
  const rotateBackground = useAppStore((s) => s.rotateBackground);
  const toggleFlipH = useAppStore((s) => s.toggleFlipH);
  const toggleFlipV = useAppStore((s) => s.toggleFlipV);
  const setCropMode = useAppStore((s) => s.setStudioCropMode);
  const bg = useAppStore((s) => s.studioBackground);
  const cycleRatio = useAppStore((s) => s.cycleRatio);
  const ratio = useAppStore((s) => s.studioRatio);

  const ratioLabel = (r: string) => r.replace("/", ":");

  if (tab === "edit") {
    return (
      <>
        {/* sp-head "편집" 라벨은 사용자 요청으로 제거 — 하단 탭 표시(편집/텍스트/
            스티커/디자인) 만으로도 현재 모드가 충분히 식별되므로 중복 라벨 삭제. */}
        <div className="sp-tools">
          <button
            className="sp-tool"
            onClick={() => {
              if (!bg) {
                showToast("먼저 배경 사진을 등록해주세요");
                return;
              }
              setCropMode(true);
            }}
          >
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                <path d="M2 6h14a2 2 0 0 1 2 2v14" />
              </svg>
            </span>
            <i>잘라내기</i>
          </button>
          <button
            className="sp-tool"
            onClick={() => {
              rotateBackground();
              showToast("회전");
            }}
          >
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
              </svg>
            </span>
            <i>회전</i>
          </button>
          <button
            className="sp-tool"
            onClick={() => {
              toggleFlipH();
              showToast("좌우 반전");
            }}
          >
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3v18" />
                <path d="M3 8l4-3 4 3v8l-4 3-4-3z" />
                <path d="M21 8l-4-3-4 3v8l4 3 4-3z" strokeDasharray="3 2" />
              </svg>
            </span>
            <i>좌우 반전</i>
          </button>
          <button
            className="sp-tool"
            onClick={() => {
              toggleFlipV();
              showToast("상하 반전");
            }}
          >
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 12h18" />
                <path d="M8 3l-3 4 3 4h8l3-4-3-4z" />
                <path d="M8 21l-3-4 3-4h8l3 4-3 4z" strokeDasharray="3 2" />
              </svg>
            </span>
            <i>상하 반전</i>
          </button>
          <button
            className="sp-tool"
            onClick={() => {
              cycleRatio();
              setTimeout(() => {
                const nextRatio = useAppStore.getState().studioRatio;
                showToast(`비율 ${ratioLabel(nextRatio)}`);
              }, 0);
            }}
          >
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 10h18" />
                <path d="M8 5v14" />
              </svg>
            </span>
            <i>비율 수정{ratio !== "9/16" ? ` (${ratioLabel(ratio)})` : ""}</i>
          </button>
        </div>
      </>
    );
  }

  if (tab === "text") {
    return <TextTab />;
  }

  if (tab === "sticker") {
    return <StickerGrid />;
  }

  if (tab === "design") {
    return <DesignTab />;
  }

  return null;
}

function DesignTab() {
  const submenu = useAppStore((s) => s.studioDesignSubmenu);
  const setSubmenu = useAppStore((s) => s.setStudioDesignSubmenu);
  const toggle = (m: "theme" | "style") => {
    setSubmenu(submenu === m ? "none" : m);
  };
  // 테마/스타일 두 하위 메뉴의 슬라이드 행은 모두 DesignSubmenu 가 캔버스 하단
  // absolute 영역(.design-theme-row) 에 그려준다 — 여기서는 토글 버튼만 노출.
  return (
    <div className="sp-tools sp-design">
      <button
        className={`sp-tool${submenu === "theme" ? " active" : ""}`}
        onClick={() => toggle("theme")}
      >
        <span className="sp-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M3 17l5-5 4 4 4-4 5 5" />
          </svg>
        </span>
        <i>테마</i>
      </button>
      <button
        className={`sp-tool${submenu === "style" ? " active" : ""}`}
        onClick={() => toggle("style")}
      >
        <span className="sp-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3l9 9-9 9-9-9z" />
          </svg>
        </span>
        <i>스타일</i>
      </button>
    </div>
  );
}
