import Mascot from "@/components/ui/Mascot";

export default function RunningCard({ small = false }: { small?: boolean }) {
  return (
    <div className={`running-card${small ? " small" : ""}`}>
      <div className="rc-photo" />
      <div className="rc-grad" />
      <div className="rc-runner" />

      <div className="rc-top">
        <div className="rc-top-left">
          <div className="rc-avatar">
            <Mascot />
          </div>
          <div className="rc-name">닉네임</div>
        </div>
        <div className="rc-top-right">
          <span>오늘도 저님</span>
        </div>
      </div>
      <div className="rc-date">2026.04.06 (월)</div>

      <div className="rc-week">
        이번주 러닝 기록 <span>🏃</span>
      </div>
      <div className="rc-distance">
        5.21<small>km</small>
      </div>

      <div className="rc-stats">
        <div className="rc-stat">
          <span className="rc-ic">⏱</span>
          <b>00:32:45</b>
          <i>운동 시간</i>
        </div>
        <div className="rc-stat">
          <span className="rc-ic">⚡</span>
          <b>6&apos;12&quot;</b>
          <i>평균 페이스</i>
        </div>
        <div className="rc-stat">
          <span className="rc-ic">🔥</span>
          <b>368</b>
          <i>kcal</i>
        </div>
      </div>

      <div className="rc-bubble-wrap">
        <div className="rc-bubble">
          처음 발걸음이<br />
          큰 변화를 만들어요! <span>💜</span>
        </div>
        <div className="rc-mascot">
          <Mascot />
        </div>
      </div>
    </div>
  );
}
