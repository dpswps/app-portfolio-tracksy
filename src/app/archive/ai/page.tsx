"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import AIHeader from "@/features/ai-journal/AIHeader";
import Mascot from "@/components/ui/Mascot";

const MOOD_LABEL: Record<string, string> = {
  good: "좋아",
  ok: "그냥그래",
  bad: "힘들었어",
};

const FALLBACK_SUMMARY = "오늘은 안정적인 페이스로<br/>기분 좋게 달린 날 🏃💜";

type ChatMsg = { from: "bot" | "user"; text: string };

/** Ask the API for the coach's next message (multi-turn). */
async function fetchReply(messages: ChatMsg[]): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "reply", messages }),
    });
    if (!res.ok) return "그랬구나! 더 얘기해줄래?";
    const data = await res.json();
    return typeof data?.reply === "string" && data.reply.trim()
      ? data.reply
      : "그랬구나! 더 얘기해줄래?";
  } catch {
    return "그랬구나! 더 얘기해줄래?";
  }
}

/** Ask the API for the final one-line summary. */
async function fetchSummary(messages: ChatMsg[]): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "summary", messages }),
    });
    if (!res.ok) return FALLBACK_SUMMARY;
    const data = await res.json();
    return typeof data?.summary === "string" && data.summary.trim()
      ? data.summary
      : FALLBACK_SUMMARY;
  } catch {
    return FALLBACK_SUMMARY;
  }
}

export default function AIJournalPage() {
  const step = useAppStore((s) => s.aiStep);

  if (step === "intro") return <Intro />;
  if (step === "chat") return <Chat />;
  if (step === "loading") return <Loading />;
  if (step === "result") return <Result />;
  if (step === "skip") return <Skip />;
  return <Intro />;
}

function BgChatPreview() {
  return (
    <div className="aij-bg">
      <div className="aij-bg-msg-row">
        <div className="aij-bg-mascot">
          <Mascot />
        </div>
        <div className="aij-bg-bubble">오늘 5km 뛰었네! 꽤 괜찮은데 ✨</div>
      </div>
    </div>
  );
}

function BlurredChat() {
  const messages = useAppStore((s) => s.aiMessages);
  return (
    <div className="aij-blur-chat">
      {messages.map((m, i) =>
        m.from === "bot" ? (
          <div key={i} className="aij-row left">
            <div className="aij-mascot-sm">
              <Mascot />
            </div>
            <div className="aij-bubble">{m.text}</div>
          </div>
        ) : (
          <div key={i} className="aij-row right">
            <div className="aij-bubble user">{m.text}</div>
          </div>
        ),
      )}
    </div>
  );
}

function Intro() {
  const setStep = useAppStore((s) => s.setAIStep);

  return (
    <section className="aij-screen">
      <AIHeader />
      <BgChatPreview />
      <div className="aij-overlay" />
      <div className="aij-sheet">
        <h3 className="aij-sheet-title">AI 오늘의 러닝일지</h3>
        <p className="aij-sheet-sub">간단한 대화로 오늘의 러닝을 한 줄로 정리해드려요.</p>
        <ul className="aij-points">
          <li>
            <span className="aij-pic">💬</span>
            <span>오늘의 기록을 더 간단하게 정리해보세요.</span>
          </li>
          <li>
            <span className="aij-pic">❓</span>
            <span>몇 가지 질문에 답하면 충분해요.</span>
          </li>
        </ul>
        <button className="primary-btn aij-primary" onClick={() => setStep("chat")}>
          대화 시작 하기
        </button>
        <button className="aij-secondary" onClick={() => setStep("skip")}>
          건너뛰기
        </button>
      </div>
    </section>
  );
}

function Chat() {
  const messages = useAppStore((s) => s.aiMessages);
  const pushMsg = useAppStore((s) => s.pushAIMessage);
  const setStep = useAppStore((s) => s.setAIStep);
  const setSummary = useAppStore((s) => s.setAISummary);
  const showToast = useAppStore((s) => s.showToast);

  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  // Scroll the chat area to bottom whenever messages or typing indicator change
  useEffect(() => {
    const a = areaRef.current;
    if (a) a.scrollTop = a.scrollHeight;
  }, [messages, isReplying]);

  // Send a user turn, then ask Gemini for the next coach reply
  const sendUserMessage = async (text: string) => {
    if (isReplying || !text.trim()) return;
    const userMsg: ChatMsg = { from: "user", text };
    const next = [...messages, userMsg];
    pushMsg(userMsg);
    setInput("");
    setIsReplying(true);

    const reply = await fetchReply(next);
    pushMsg({ from: "bot", text: reply });
    setIsReplying(false);
  };

  const onMood = (mood: "good" | "ok" | "bad") => {
    void sendUserMessage(MOOD_LABEL[mood]);
  };

  const onSend = () => {
    const text = input.trim();
    if (!text) {
      showToast("한 줄 적어보세요");
      return;
    }
    void sendUserMessage(text);
  };

  // Whether the user has spoken at least once — only then can we summarize
  const hasUserTurn = messages.some((m) => m.from === "user");

  const onFinish = async () => {
    if (!hasUserTurn) {
      showToast("먼저 대화를 한두 마디 해주세요");
      return;
    }
    if (isReplying) return;
    setStep("loading");
    const summary = await fetchSummary(messages);
    if (useAppStore.getState().aiStep === "loading") {
      setSummary(summary);
      useAppStore.getState().setAIStep("result");
    }
  };

  return (
    <section className="aij-screen aij-chat-screen">
      <AIHeader />
      <div className="aij-chat-area" ref={areaRef}>
        {messages.map((m, i) =>
          m.from === "bot" ? (
            <div key={i} className="aij-row left">
              <div className="aij-mascot-sm">
                <Mascot />
              </div>
              <div className="aij-bubble">{m.text}</div>
            </div>
          ) : (
            <div key={i} className="aij-row right">
              <div className="aij-bubble user">{m.text}</div>
            </div>
          ),
        )}
        {isReplying && (
          <div className="aij-row left">
            <div className="aij-mascot-sm">
              <Mascot />
            </div>
            <div className="aij-bubble typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <div className="aij-input-section">
        <div className="aij-quick-row">
          <button className="aij-quick" onClick={() => onMood("good")} disabled={isReplying}>
            <span className="aij-emo">😊</span>
            <span>좋아</span>
          </button>
          <button className="aij-quick" onClick={() => onMood("ok")} disabled={isReplying}>
            <span className="aij-emo">😐</span>
            <span>그냥그래</span>
          </button>
          <button className="aij-quick" onClick={() => onMood("bad")} disabled={isReplying}>
            <span className="aij-emo">😣</span>
            <span>힘들었어</span>
          </button>
        </div>
        <div className="aij-input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={isReplying ? "코치가 답을 작성 중이에요..." : "직접 입력하기"}
            disabled={isReplying}
          />
          <button
            className="aij-send"
            onClick={onSend}
            aria-label="전송"
            disabled={isReplying}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <button
          className="aij-finish-btn"
          onClick={onFinish}
          disabled={!hasUserTurn || isReplying}
        >
          ✨ 대화 마치고 한 줄 요약 만들기
        </button>
      </div>
    </section>
  );
}

function Loading() {
  return (
    <section className="aij-screen aij-overlay-screen">
      <AIHeader />
      <BlurredChat />
      <div className="aij-overlay" />
      <div className="aij-loading-modal">
        <div className="aij-loading-circle">
          <div className="aij-loading-mascot">
            <Mascot />
            <span className="aij-q">?</span>
          </div>
        </div>
        <p className="aij-loading-text">오늘의 러닝을 요약중이에요</p>
        <div className="aij-loading-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}

function Result() {
  const router = useRouter();
  const summary = useAppStore((s) => s.aiSummary) || FALLBACK_SUMMARY;
  const resetAI = useAppStore((s) => s.resetAI);
  const addAIJournal = useAppStore((s) => s.addAIJournal);
  const showToast = useAppStore((s) => s.showToast);

  const onSave = () => {
    addAIJournal(summary);
    showToast("러닝 일지가 저장되었어요");
    resetAI();
    setTimeout(() => {
      router.push("/archive/journals");
    }, 500);
  };

  const onRetry = () => {
    useAppStore.getState().resetAI();
    useAppStore.getState().setAIStep("chat");
  };

  return (
    <section className="aij-screen aij-overlay-screen">
      <AIHeader />
      <BlurredChat />
      <div className="aij-overlay" />
      <div className="aij-result-wrap">
        <div className="aij-result-card">
          <div className="aij-result-stars">✨ 오늘의 러닝 한 줄 요약 ✨</div>
          <div className="aij-result-quote">
            <span className="aij-q-mark open">&quot;</span>
            <p dangerouslySetInnerHTML={{ __html: summary }} />
            <span className="aij-q-mark close">&quot;</span>
          </div>
          <div className="aij-result-mascot-row">
            <div className="aij-result-mascot">
              <Mascot />
            </div>
            <div className="aij-cheer-bubble">오늘도 수고했어! 😊</div>
          </div>
        </div>
        <div className="aij-result-actions">
          <button className="aij-result-save" onClick={onSave}>
            러닝 일지 저장하기
          </button>
          <button className="aij-result-retry" onClick={onRetry}>
            다시하기
          </button>
        </div>
      </div>
    </section>
  );
}

function Skip() {
  const router = useRouter();
  const setStep = useAppStore((s) => s.setAIStep);
  const resetAI = useAppStore((s) => s.resetAI);

  const goStudio = () => {
    resetAI();
    router.replace("/studio");
  };

  return (
    <section className="aij-screen aij-overlay-screen">
      <AIHeader />
      <BlurredChat />
      <div className="aij-overlay" />
      <div className="aij-sheet">
        <h3 className="aij-sheet-title">기록 없이 넘어갈까요?</h3>
        <p className="aij-sheet-sub">
          간단한 대화를 통해 오늘을 기록할 수 있어요!
          <br />
          기록하지 않으면 스튜디오로 바로 들어가져요.
        </p>
        <button className="primary-btn aij-primary" onClick={goStudio}>
          스튜디오 바로가기
        </button>
        <button className="aij-secondary purple" onClick={() => setStep("chat")}>
          대화 시작하기
        </button>
      </div>
    </section>
  );
}
