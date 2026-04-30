// TRACKSY Prototype — single-file router
const screen = document.getElementById('screen');
const device = document.getElementById('device');
const bottomNav = document.getElementById('bottomNav');

const state = {
  user: { name: '김러너', birth: '2000.01.01', email: 'tracksy1@gmail.com', style: '산책/러닝' },
  studioTab: 'edit',
  inquiries: [
    { id: 1, type: '서비스 이용', title: '기록이 저장되지 않아요.', date: '2026.01.01 14:30', body: '가민에서 기록 떠서 왔는데, 저장이 안되어 있어서 문의합니다.', reply: '안녕하세요. 트랙시 고객 센터 입니다.\n\n기록이 저장되지 않는 현상은 앱의 캐시 데이터가 영향을 주는 경우로 아래 방법에 따라 확인 부탁드립니다.', status: 'wait' },
    { id: 2, type: '계정/로그인', title: '기록이 저장되지 않아요.', body: '가민에서 기록 떠서 왔는데, 저장이 안되어 있어서 문의합니다.', status: 'wait' },
    { id: 3, type: '기타', title: '기록이 저장되지 않아요.', body: '가민에서 기록 떠서 왔는데, 저장이 안되어 있어서 문의합니다.', status: 'wait' },
    { id: 4, type: '서비스 이용', title: '기록이 저장되지 않아요.', body: '가민에서 기록 떠서 왔는데, 저장이 안되어 있어서 문의합니다.', status: 'done' },
  ]
};

const partners = [
  { id: 'ntc', name: 'Nike Training Club', cls: 'logo-ntc', initial: 'NTC',
    desc: 'Nike Training Club는 TRACKSY의 활동 데이터를 다른 건강/피트니스 앱과 동기화 하여 더 나은 인사이트를 제공합니다.' },
  { id: 'garmin', name: 'Garmin Connect', cls: 'logo-garmin', initial: 'G',
    desc: 'Garmin Connect의 러닝 데이터를 TRACKSY로 가져와 한 곳에서 관리하세요.' },
  { id: 'coros', name: 'Coros', cls: 'logo-coros', initial: 'C',
    desc: 'Coros 워치의 운동 기록을 TRACKSY와 동기화합니다.' },
  { id: 'adidas', name: 'Adidas Running', cls: 'logo-adidas', initial: 'AR',
    desc: 'Adidas Running의 기록을 TRACKSY 카드로 멋지게 꾸며보세요.' },
  { id: 'hc', name: 'Health Connect', cls: 'logo-hc', initial: 'HC',
    desc: 'Health Connect를 통해 다양한 건강 앱과 데이터를 연동합니다.' },
  { id: 'google', name: 'Google 피트니스', cls: 'logo-google', initial: 'G',
    desc: 'Google 피트니스의 활동 기록을 TRACKSY로 가져옵니다.' },
  { id: 'apple', name: 'Apple 건강', cls: 'logo-apple', initial: '🍎',
    desc: 'Apple 건강 앱의 운동 기록을 TRACKSY와 연동합니다.' },
];

// ----- Community posts data -----
const communityPosts = [
  { id: 1, type: 'photo', dist: '5km/1km', time: '2m 50s', likes: 154, brand: 'STRAVA',
    bg: 'linear-gradient(180deg,#A8D8EA 0%,#7AB8C9 50%,#5C8FA8 100%)', tall: true },
  { id: 2, type: 'photo', dist: '6.06', user: '박채원', likes: 563,
    bg: 'linear-gradient(180deg,#87CEEB 0%,#A8D08D 60%,#7BA876 100%)', tall: false,
    avatarBg: 'linear-gradient(135deg,#FBBF24,#F59E0B)' },
  { id: 3, type: 'stats', user: '이용곡', dist: '11.00', likes: 138,
    bg: 'linear-gradient(180deg,#FECACA 0%,#FCA5A5 100%)', tall: false,
    pace: '0\'34"', time: '1\'22"', cal: '586', extra: '21m...' },
  { id: 4, type: 'photo', user: '이용민', time: '3m 0s', likes: 92,
    bg: 'linear-gradient(180deg,#DDD6FE 0%,#A78BFA 100%)', tall: true },
  { id: 5, type: 'photo', dist: '4.20', likes: 211,
    bg: 'linear-gradient(180deg,#FED7AA 0%,#FB923C 100%)', tall: false },
  { id: 6, type: 'photo', dist: '7.15', user: '러너준', likes: 87,
    bg: 'linear-gradient(180deg,#A7F3D0 0%,#34D399 100%)', tall: true },
];

function feedCard(p) {
  if (p.type === 'stats') {
    return `
      <div class="feed-card stats" data-go="communityPost:${p.id}">
        <div class="fc-bg" style="background:${p.bg}"></div>
        <button class="fc-bm" data-stop>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4z"/></svg>
        </button>
        ${p.user ? `<div class="fc-username">${p.user}</div>` : ''}
        <div class="fc-big">${p.dist}</div>
        <div class="fc-stats">
          <div><b>${p.pace}</b><i>페이스</i></div>
          <div><b>${p.time}</b><i>시간</i></div>
          <div><b>${p.cal}</b><i>kcal</i></div>
          <div><b>${p.extra}</b><i>거리</i></div>
        </div>
        <div class="fc-likes">❤ ${p.likes}</div>
      </div>
    `;
  }
  return `
    <div class="feed-card ${p.tall ? 'tall' : ''}" data-go="communityPost:${p.id}">
      <div class="fc-bg" style="background:${p.bg}"></div>
      <button class="fc-bm" data-stop>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4z"/></svg>
      </button>
      ${p.brand ? `<div class="fc-brand">${p.brand}</div>` : ''}
      ${p.dist ? `<div class="fc-dist">${p.dist}</div>` : ''}
      ${p.time ? `<div class="fc-time">${p.time}</div>` : ''}
      ${p.user ? `<div class="fc-user">${p.user}</div>` : ''}
      <div class="fc-likes">❤ ${p.likes}</div>
    </div>
  `;
}

// ----- Running card (reused across studio screens) -----
function runningCard(small = false) {
  return `
    <div class="running-card ${small ? 'small' : ''}">
      <div class="rc-photo"></div>
      <div class="rc-grad"></div>
      <div class="rc-runner"></div>

      <div class="rc-top">
        <div class="rc-top-left">
          <div class="rc-avatar">
            <img src="assets/mascot.png" alt="" onerror="this.onerror=null;this.src='assets/mascot.svg'"/>
          </div>
          <div class="rc-name">닉네임</div>
        </div>
        <div class="rc-top-right">
          <span>오늘도 저님</span>
        </div>
      </div>
      <div class="rc-date">2026.04.06 (월)</div>

      <div class="rc-week">이번주 러닝 기록 <span>🏃</span></div>
      <div class="rc-distance">5.21<small>km</small></div>

      <div class="rc-stats">
        <div class="rc-stat">
          <span class="rc-ic">⏱</span><b>00:32:45</b><i>운동 시간</i>
        </div>
        <div class="rc-stat">
          <span class="rc-ic">⚡</span><b>6'12"</b><i>평균 페이스</i>
        </div>
        <div class="rc-stat">
          <span class="rc-ic">🔥</span><b>368</b><i>kcal</i>
        </div>
      </div>

      <div class="rc-bubble-wrap">
        <div class="rc-bubble">
          처음 발걸음이<br/>큰 변화를 만들어요! <span>💜</span>
        </div>
        <div class="rc-mascot">
          <img src="assets/mascot.png" alt="" onerror="this.onerror=null;this.src='assets/mascot.svg'"/>
        </div>
      </div>
    </div>
  `;
}

// ----- Studio panel (per-tab content) -----
function renderStudioPanel(tab) {
  if (tab === 'edit') {
    return `
      <div class="sp-head">
        <span>편집</span>
        <button class="sp-close" data-action="studio-tab:close" aria-label="닫기">×</button>
      </div>
      <div class="sp-tools">
        <button class="sp-tool" data-action="toast:잘라내기"><span class="sp-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M2 6h14a2 2 0 0 1 2 2v14"/></svg>
        </span><i>잘라내기</i></button>
        <button class="sp-tool" data-action="toast:회전"><span class="sp-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>
        </span><i>회전</i></button>
        <button class="sp-tool" data-action="toast:좌우 반전"><span class="sp-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18"/><path d="M3 8l4-3 4 3v8l-4 3-4-3z"/><path d="M21 8l-4-3-4 3v8l4 3 4-3z" stroke-dasharray="3 2"/></svg>
        </span><i>좌우 반전</i></button>
        <button class="sp-tool" data-action="toast:상하 반전"><span class="sp-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12h18"/><path d="M8 3l-3 4 3 4h8l3-4-3-4z"/><path d="M8 21l-3-4 3-4h8l3 4-3 4z" stroke-dasharray="3 2"/></svg>
        </span><i>상하 반전</i></button>
        <button class="sp-tool" data-action="toast:색상 수정"><span class="sp-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18 4 4 0 0 0 0-8 4 4 0 0 1 0-8z" fill="currentColor" opacity="0.3"/></svg>
        </span><i>색을 수정</i></button>
      </div>
    `;
  }
  if (tab === 'text') {
    return `
      <div class="sp-tools sp-text">
        <button class="sp-tool" data-action="toast:글꼴">
          <span class="sp-ic"><b style="font-size:18px;font-family:serif;">Aa</b></span>
          <i>글꼴</i>
        </button>
        <button class="sp-tool" data-action="toast:글자크기">
          <span class="sp-ic"><b style="font-size:18px;">Tr</b></span>
          <i>글자크기</i>
        </button>
        <button class="sp-tool" data-action="toast:색상">
          <span class="sp-ic"><span class="color-wheel"></span></span>
          <i>색상</i>
        </button>
      </div>
    `;
  }
  if (tab === 'sticker') {
    const stickers = ['🏃','💜','✨','🔥','🎯','⚡','🏆','❤️','🌟','😊','🎉','💪'];
    return `
      <div class="sp-stickers">
        ${stickers.map(s => `<button class="sp-sticker" data-action="toast:${s} 추가됨">${s}</button>`).join('')}
      </div>
    `;
  }
  if (tab === 'design') {
    return `
      <div class="sp-tools sp-design">
        <button class="sp-tool" data-action="toast:테마컬러">
          <span class="sp-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M3 17l5-5 4 4 4-4 5 5"/></svg>
          </span>
          <i>테마컬러</i>
        </button>
        <button class="sp-tool" data-action="toast:스타일">
          <span class="sp-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l9 9-9 9-9-9z"/></svg>
          </span>
          <i>스타일</i>
        </button>
        <button class="sp-tool" data-go="studioBg">
          <span class="sp-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 14l4-3 4 3 4-4 6 5"/></svg>
          </span>
          <i>배경</i>
        </button>
      </div>
    `;
  }
  return '';
}

// ----- Toast -----
function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 1800);
}

// ----- Router -----
const navStack = [];
function go(route, opts = {}) {
  if (!opts.replace) navStack.push(route);
  render(route);
}
function back() {
  navStack.pop();
  const prev = navStack[navStack.length - 1] || 'splash';
  render(prev);
}

function render(route) {
  device.classList.remove('hide-nav');
  bottomNav.style.display = '';
  const showNav = !['splash','login','signup','studio','studioExport','studioBg'].some(s => route.split(':')[0] === s);
  if (!showNav) {
    bottomNav.style.display = 'none';
    if (route === 'splash') device.classList.add('hide-nav');
  }
  // Set active nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navMap = { home: 'home', studio: 'studio', record: 'record', community: 'community', archive: 'archive' };
  const homeRoutes = ['profile','profileEdit','settings','partners','inquiry','inquiryDetail','inquiryList','feedback'];
  const communityRoutes = ['communityPost','communityCompose'];
  const baseRoute = route.split(':')[0];
  const navKey = homeRoutes.includes(baseRoute) ? 'home'
    : communityRoutes.includes(baseRoute) ? 'community'
    : navMap[route] || navMap[baseRoute] || null;
  if (navKey) {
    const el = document.querySelector(`.nav-item[data-nav="${navKey}"]`);
    if (el) el.classList.add('active');
  }
  screen.scrollTop = 0;
  const [name, arg] = route.split(':');
  const fn = views[name];
  if (fn) screen.innerHTML = fn(arg);
  else screen.innerHTML = views.placeholder(name);
  bindHandlers();
  if (name === 'home') {
    requestAnimationFrame(() => {
      const main = screen.querySelector('.hero-main');
      const track = screen.querySelector('.hero-track');
      if (main && track) {
        const targetLeft = main.offsetLeft - (track.clientWidth - main.clientWidth) / 2;
        track.scrollTo({ left: targetLeft, behavior: 'instant' in track ? 'instant' : 'auto' });
      }
    });
  }
}

// ----- Views -----
const views = {
  splash: () => `
    <section class="splash">
      <div class="mascot-wrap">
        <img src="assets/mascot.png" alt="TRACKSY" class="mascot-img" onerror="this.onerror=null;this.src='assets/mascot.svg'"/>
      </div>
      <h1>TRACKSY</h1>
      <p>오늘의 러닝을, 나만의 이야기로</p>
    </section>
    <div style="position:absolute; bottom:60px; left:0; right:0; text-align:center;">
      <button class="action" data-go="login" style="background:rgba(255,255,255,0.2); color:#fff; border:1px solid rgba(255,255,255,0.4); padding:12px 32px; border-radius:999px; font-size:13px; font-weight:500; backdrop-filter:blur(8px);">시작하기 →</button>
    </div>
  `,

  login: () => `
    <section class="login-screen">
      <div class="heading">
        <h2>로그인</h2>
        <p class="sub">로그인 방법을 선택하세요</p>
      </div>
      <div class="social-buttons">
        <button class="social-btn google" data-go="signup">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google 로 계속하기
        </button>
        <button class="social-btn kakao" data-go="signup">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#391B1B"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.86 5.31 4.66 6.71l-1.04 3.81c-.09.34.28.62.58.43L10.7 19.3c.43.04.86.07 1.3.07 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/></svg>
          카카오톡으로 계속하기
        </button>
        <button class="social-btn naver" data-go="signup">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M14.4 12.7L9.4 5h-4v14h4.2v-7.7l5 7.7h4V5h-4.2v7.7z"/></svg>
          네이버 로 계속하기
        </button>
        <button class="social-btn apple" data-go="signup">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          Apple 로 계속하기
        </button>
      </div>
      <div class="guest-link"><span data-go="home" style="cursor:pointer">로그인 없이 둘러보기</span></div>
    </section>
  `,

  signup: () => `
    <div class="app-header">
      <button class="back-btn" data-action="back">‹</button>
    </div>
    <section class="signup-screen">
      <h2>정보 입력</h2>
      <p class="sub">트랙시에 등록할 내 정보를 입력하세요</p>

      <div class="field">
        <label>이름</label>
        <input type="text" id="signupName" placeholder="이름을 입력하세요" />
      </div>

      <div class="field">
        <label>생년월일</label>
        <div class="date-row">
          <input type="text" id="signupYear" placeholder="년*" maxlength="4"/>
          <input type="text" id="signupMonth" placeholder="월*" maxlength="2"/>
          <input type="text" id="signupDay" placeholder="일*" maxlength="2"/>
        </div>
      </div>

      <div class="field">
        <label>선호하는 러닝 스타일</label>
        <div class="radio-row">
          <label><input type="radio" name="style" value="산책/러닝" checked /> 산책/러닝</label>
          <label><input type="radio" name="style" value="10k 미만 러닝" /> 10k 미만 러닝</label>
          <label><input type="radio" name="style" value="마라톤" /> 마라톤</label>
        </div>
      </div>

      <button class="primary-btn" data-action="signup-submit">계정 만들기</button>
    </section>
  `,

  home: () => {
    const week = [
      { dow: '일', date: 13, on: false },
      { dow: '월', date: 14, on: true  },
      { dow: '화', date: 15, on: true  },
      { dow: '수', date: 16, on: false },
      { dow: '목', date: 17, on: true  },
      { dow: '금', date: 18, on: false },
      { dow: '토', date: 19, on: false },
    ];
    return `
    <section class="home-screen">
      <div class="home-greeting">
        <div class="greet-avatar">
          <img src="assets/mascot.png" alt="" onerror="this.onerror=null;this.src='assets/mascot.svg'"/>
        </div>
        <div class="greet-text">
          <div class="greet-name">${state.user.name || '닉네임'} <span>님</span></div>
          <div class="greet-sub">오늘도 멋진 러너의 하루를 만들어봐요!</div>
        </div>
        <button class="greet-settings" data-go="settings" aria-label="설정">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
          </svg>
        </button>
      </div>

      <div class="hero-carousel">
        <div class="hero-track">

          <div class="hero-slide hero-photo">
            <div class="hp-bg"></div>
            <div class="hp-overlay"></div>
            <div class="hp-content">
              <div class="hp-distance">21<small>km</small></div>
              <div class="hp-time">12:45</div>
            </div>
          </div>

          <div class="hero-slide hero-main" data-go="record">
            <div class="hm-content">
              <h2>러닝 기록하기</h2>
              <p>오늘의 러닝을 등록해볼까요?</p>
              <div class="hm-plus">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
            </div>
            <div class="hm-mascot">
              <img src="assets/mascot.png" alt="" onerror="this.onerror=null;this.src='assets/mascot.svg'"/>
            </div>
            <div class="hm-wave"></div>
          </div>

          <div class="hero-slide hero-stats">
            <div class="hs-meta">
              <div class="hs-date">2026.04.06 <span>(월)</span></div>
              <div class="hs-weather">오전 7:30 · 후 18°C</div>
            </div>
            <div class="hs-distance">5.21<small>km</small></div>
            <div class="hs-rows">
              <div class="hs-row"><span class="hs-ic">⏱</span><b>00:32:45</b><i>시간</i></div>
              <div class="hs-row"><span class="hs-ic">⚡</span><b>6'12"</b><i>페이스</i></div>
              <div class="hs-row"><span class="hs-ic">🔥</span><b>368</b><i>kcal</i></div>
            </div>
          </div>

        </div>
      </div>

      <div class="week-section">
        <div class="week-header">
          <h3>이번주 러닝 기록 <span class="cal">📅</span></h3>
          <div class="week-legend">
            <span class="legend-item"><span class="dot dot-on"></span>기록있음</span>
            <span class="legend-item"><span class="dot dot-off"></span>기록없음</span>
          </div>
        </div>
        <div class="week-grid">
          ${week.map(d => `
            <div class="week-day">
              <div class="dow">${d.dow}</div>
              <div class="dom">${d.date}</div>
              <div class="dot ${d.on ? 'dot-on' : 'dot-off'}"></div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="home-stats-row">
        <div class="hs-card hs-month">
          <div class="hs-fig">
            <svg viewBox="0 0 60 60" fill="none">
              <circle cx="38" cy="14" r="4" fill="#8B5CF6"/>
              <path d="M22 50 L28 38 L34 30 L42 36 L48 32" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <path d="M28 38 L24 28 L34 22 L40 26" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <path d="M14 50 Q22 46 36 50 Q44 52 52 48" stroke="#E5E7EB" stroke-width="6" stroke-linecap="round" fill="none"/>
            </svg>
          </div>
          <div class="hs-label">이번달 러닝 횟수</div>
          <div class="hs-value">12 <small>회</small></div>
          <div class="hs-badge pink">↗ 지난달 대비 20%</div>
        </div>
        <div class="hs-card hs-best">
          <div class="hs-fig hs-trophy">🏆</div>
          <div class="hs-label">최고 기록(90일간)</div>
          <div class="hs-value">10.21 <small>km</small></div>
          <div class="hs-badge gray">2026.04.06 달성!</div>
        </div>
      </div>
    </section>
  `;
  },

  profile: () => `
    <section class="profile-screen">
      <div class="profile-cover"></div>
      <div class="app-header" style="position:absolute; top:34px; left:0; right:0;">
        <button class="back-btn" data-action="back" style="color:#fff;">‹</button>
        <div class="title" style="color:#fff;">프로필</div>
        <div class="right-action">
          <button title="공유"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 11l8-4M8 13l8 4"/></svg></button>
        </div>
      </div>
      <div class="profile-body">
        <div class="profile-avatar-row">
          <div class="avatar">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 4l3 3-7 7-3 1 1-3 6-8z"/></svg>
          </div>
          <div class="avatar-name">${state.user.name} 님</div>
        </div>
        <div class="profile-edit" data-go="profileEdit" role="button" aria-label="프로필 수정">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21l4-1L20 7l-3-3L4 17l-1 4z"/></svg>
        </div>
        <div class="profile-list">
          <div class="profile-row"><span class="k">이름</span><span class="v">${state.user.name}</span></div>
          <div class="profile-row"><span class="k">생년월일</span><span class="v">${state.user.birth}</span></div>
          <div class="profile-row"><span class="k">이메일 계정</span><span class="v">${state.user.email}</span></div>
          <div class="profile-row"><span class="k">선호하는 러닝 스타일</span><span class="v">${state.user.style}</span></div>
        </div>
      </div>
    </section>
  `,

  profileEdit: () => {
    const [y, m, d] = (state.user.birth || '').split('.');
    return `
      <div class="app-header">
        <button class="back-btn" data-action="back">‹</button>
        <div class="title">프로필 수정</div>
      </div>
      <section class="signup-screen" style="background:#fff; padding-top:8px;">
        <div class="profile-avatar-row" style="margin-top:0; margin-bottom:28px;">
          <div class="avatar">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 4l3 3-7 7-3 1 1-3 6-8z"/></svg>
          </div>
        </div>

        <div class="field">
          <label>이름</label>
          <input type="text" id="editName" value="${state.user.name || ''}" placeholder="이름을 입력하세요"/>
        </div>

        <div class="field">
          <label>생년월일</label>
          <div class="date-row">
            <input type="text" id="editYear" value="${y || ''}" placeholder="년*" maxlength="4"/>
            <input type="text" id="editMonth" value="${m || ''}" placeholder="월*" maxlength="2"/>
            <input type="text" id="editDay" value="${d || ''}" placeholder="일*" maxlength="2"/>
          </div>
        </div>

        <div class="field">
          <label>이메일 계정</label>
          <input type="email" id="editEmail" value="${state.user.email || ''}" placeholder="이메일을 입력하세요"/>
        </div>

        <div class="field">
          <label>선호하는 러닝 스타일</label>
          <div class="radio-row">
            <label><input type="radio" name="editStyle" value="산책/러닝" ${state.user.style === '산책/러닝' ? 'checked' : ''}/> 산책/러닝</label>
            <label><input type="radio" name="editStyle" value="10k 미만 러닝" ${state.user.style === '10k 미만 러닝' ? 'checked' : ''}/> 10k 미만 러닝</label>
            <label><input type="radio" name="editStyle" value="마라톤" ${state.user.style === '마라톤' ? 'checked' : ''}/> 마라톤</label>
          </div>
        </div>

        <button class="primary-btn" data-action="profile-save">저장하기</button>
      </section>
    `;
  },

  settings: () => `
    <div class="app-header">
      <button class="back-btn" data-action="back">‹</button>
      <div class="title">설정</div>
    </div>
    <section class="settings-screen">
      <div class="settings-section">
        <h3>파트너 앱</h3>
        <button class="partner-cta" data-go="partners">파트너 APP 기록 가져오기</button>
      </div>
      <div class="settings-section">
        <h3>고객 문의</h3>
        <div class="list-item" data-go="inquiry"><span>이용 문의하기</span><span class="arrow">›</span></div>
        <div class="list-item" data-go="inquiryList"><span>나의 문의내역</span><span class="arrow">›</span></div>
        <div class="list-item" data-go="feedback"><span>개선사항 보내기</span><span class="arrow">›</span></div>
      </div>
    </section>
  `,

  partners: () => `
    <div class="app-header">
      <button class="back-btn" data-action="back">‹</button>
      <div class="title">파트너 앱</div>
    </div>
    <section class="partner-screen">
      <h3>APP 연동하기</h3>
      <p class="sub">파트너 앱을 선택하여 기록을 가져오세요.</p>
      ${partners.map(p => `
        <div class="partner-row" data-go="partnerDetail:${p.id}">
          <div class="logo ${p.cls}">${p.initial}</div>
          <div class="name">${p.name}</div>
          <div class="ext">↗</div>
        </div>
      `).join('')}
    </section>
  `,

  partnerDetail: (id) => {
    const p = partners.find(x => x.id === id) || partners[0];
    return `
      <div class="app-header">
        <button class="back-btn" data-action="back">‹</button>
        <div class="title">${p.name}</div>
      </div>
      <section class="partner-detail">
        <div class="big-logo ${p.cls}">${p.initial}</div>
        <h2>${p.name} 에 연결</h2>
        <p>${p.desc}</p>
        <div class="actions">
          <button class="primary-btn" data-action="toast:연결 요청을 보냈어요" style="margin-top:0;">APP 연결하기</button>
          <button class="primary-btn" data-action="toast:동기화를 시작했어요" style="background:#fff; color:var(--primary); border:1px solid var(--primary); margin-top:0;">기록 동기화 및 가져오기</button>
        </div>
      </section>
    `;
  },

  inquiry: () => `
    <div class="app-header">
      <button class="back-btn" data-action="back">‹</button>
      <div class="title">이용문의</div>
    </div>
    <section class="inquiry-screen">
      <div class="top">
        <div>
          <h2>무엇을 도와드릴까요?</h2>
          <p>문의하시면 확인 후 답변해드릴게요.</p>
        </div>
        <div class="mail-emoji">📮</div>
      </div>
      <div class="field">
        <label>문의유형</label>
        <div class="radio-row">
          <label><input type="radio" name="iqtype" value="서비스 이용" checked/> 서비스 이용</label>
          <label><input type="radio" name="iqtype" value="계정/로그인"/> 계정/로그인</label>
          <label><input type="radio" name="iqtype" value="기타"/> 기타</label>
        </div>
      </div>
      <div class="field">
        <label>제목</label>
        <input type="text" id="inqTitle" placeholder="제목을 입력하세요"/>
      </div>
      <div class="field">
        <label>내용</label>
        <textarea id="inqBody" placeholder="문의하실 내용을 자세히 적어주세요"></textarea>
      </div>
      <button class="primary-btn" data-action="inquiry-submit">문의 완료하기</button>
    </section>
  `,

  inquiryDetail: (id) => {
    const i = state.inquiries.find(x => String(x.id) === String(id)) || state.inquiries[0];
    return `
      <div class="app-header">
        <button class="back-btn" data-action="back">‹</button>
        <div class="title">나의 문의내역</div>
      </div>
      <section class="inquiry-detail">
        <div class="info-row"><span class="k">문의유형</span><span class="v">${i.type}</span></div>
        <div class="info-row"><span class="k">제목</span><span class="v">${i.title}</span></div>
        <div class="info-row"><span class="k">문의일시</span><span class="v">${i.date || '2026.01.01 14:30'}</span></div>
        <div class="block">
          <div class="block-title">문의 내용</div>
          <div class="body-box">${i.body}</div>
        </div>
        ${i.reply ? `
        <div class="block">
          <div class="block-title">답변 내용</div>
          <div class="reply-box">${i.reply.replace(/\n/g, '<br/>')}</div>
        </div>` : ''}
      </section>
    `;
  },

  inquiryList: () => `
    <div class="app-header">
      <button class="back-btn" data-action="back">‹</button>
      <div class="title">나의 문의내역</div>
    </div>
    <section class="inquiry-list">
      ${state.inquiries.map(i => {
        const tagClass = i.type === '서비스 이용' ? 'purple' : i.type === '계정/로그인' ? 'orange' : 'gray';
        const status = i.status === 'done'
          ? '<span class="tag status-done">답변 완료</span>'
          : '<span class="tag status-wait">답변 대기</span>';
        return `
          <div class="inquiry-card" data-go="inquiryDetail:${i.id}">
            <div class="row1">
              <span class="tag ${tagClass}">${i.type}</span>
              ${status}
            </div>
            <div class="title-line">${i.title}</div>
            <div class="desc">${i.body}</div>
          </div>
        `;
      }).join('')}
    </section>
  `,

  feedback: () => `
    <div class="app-header">
      <button class="back-btn" data-action="back">‹</button>
      <div class="title">개선사항</div>
    </div>
    <section class="feedback-screen">
      <h2>더 나은 서비스를<br/>만들어가는데 도움을 주세요!</h2>
      <p class="sub">여러분의 소중한 의견이 트랙시의<br/>더 좋은 서비스를 만들어갑니다.</p>
      <div class="field">
        <label>제목</label>
        <input type="text" id="fbTitle" placeholder="제목을 입력하세요"/>
      </div>
      <div class="field">
        <label>내용</label>
        <textarea id="fbBody" placeholder="개선되었으면 하는 부분을 자유롭게 적어주세요"></textarea>
      </div>
      <div class="notice-box">
        <div class="t">안내사항</div>
        <ul>
          <li>보내주신 의견은 서비스 개선에 적극 반영할게요.</li>
          <li>모든 의견에 개별 답변이 어려운 점 양해부탁드립니다.</li>
        </ul>
      </div>
      <button class="primary-btn" data-action="feedback-submit">의견 보내기</button>
    </section>
  `,

  studio: () => {
    const tab = state.studioTab || 'edit';
    return `
    <section class="studio-screen">
      <div class="studio-toolbar">
        <button class="st-icon" data-action="back" aria-label="뒤로">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button class="st-icon" aria-label="실행취소">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5h-4"/></svg>
        </button>
        <button class="st-icon" aria-label="다시실행">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h4"/></svg>
        </button>
        <button class="st-icon" aria-label="레이어">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8.5 12 15 2 8.5 12 2"/><polyline points="2 15.5 12 22 22 15.5"/></svg>
        </button>
        <span style="flex:1"></span>
        <button class="st-export" data-go="studioExport">내보내기</button>
      </div>

      <div class="studio-canvas">
        ${runningCard()}
        <button class="st-fab" aria-label="스티커 추가">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="0.8" fill="currentColor"/><circle cx="15" cy="10" r="0.8" fill="currentColor"/><path d="M8.5 14.5c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2"/></svg>
        </button>
      </div>

      <div class="studio-panel">
        ${renderStudioPanel(tab)}
      </div>

      <div class="studio-tabs">
        <button class="st-tab ${tab==='edit'?'active':''}" data-action="studio-tab:edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2v16a2 2 0 0 0 2 2h14"/><path d="M2 6h16a2 2 0 0 1 2 2v14"/></svg>
          <span>편집</span>
        </button>
        <button class="st-tab ${tab==='text'?'active':''}" data-action="studio-tab:text">
          <span class="tab-tr">Tr</span>
          <span>텍스트</span>
        </button>
        <button class="st-tab ${tab==='sticker'?'active':''}" data-action="studio-tab:sticker">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="0.9" fill="currentColor"/><circle cx="15" cy="10" r="0.9" fill="currentColor"/><path d="M8 14c1.2 1.5 2.5 2.2 4 2.2s2.8-.7 4-2.2"/></svg>
          <span>스티커</span>
        </button>
        <button class="st-tab ${tab==='design'?'active':''}" data-action="studio-tab:design">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3a9 9 0 0 0 0 18c1.7 0 3-1.3 3-3a2 2 0 0 1 2-2h2a4 4 0 0 0 4-4 9 9 0 0 0-9-9z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="11" cy="7" r="1.2" fill="currentColor"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/><circle cx="18" cy="13" r="1.2" fill="currentColor"/></svg>
          <span>디자인</span>
        </button>
      </div>
    </section>
  `;
  },

  studioExport: () => `
    <div class="app-header export-header">
      <button class="back-btn" data-action="back" style="color:#fff;">‹</button>
      <div class="title" style="color:#fff;">내보내기</div>
    </div>
    <section class="export-screen">
      <div class="export-preview">
        ${runningCard(true)}
      </div>
      <div class="export-section">
        <div class="export-label">공유 및 저장</div>
        <button class="export-insta" data-action="toast:인스타그램으로 공유했어요">
          <span class="ig-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="white"/></svg>
          </span>
          <span class="ig-text">
            <b>인스타 공유</b>
            <em>인스타그램 스토리에 바로 공유해보세요</em>
          </span>
        </button>
        <button class="export-row" data-action="toast:공유 링크가 복사되었어요">
          <span class="er-ic">🔗</span>
          <span>공유 링크 복사</span>
          <span class="er-arrow">›</span>
        </button>
        <button class="export-row" data-action="toast:카카오톡으로 공유했어요">
          <span class="er-ic kk">K</span>
          <span>카카오톡 공유하기</span>
          <span class="er-arrow">›</span>
        </button>
        <button class="export-row" data-action="toast:갤러리에 저장했어요">
          <span class="er-ic">🖼</span>
          <span>내 휴대폰 갤러리 저장</span>
          <span class="er-arrow">›</span>
        </button>
      </div>
    </section>
  `,

  studioBg: () => {
    const subtab = state.bgPickerTab || 'mine';
    const swatches = [
      'linear-gradient(135deg,#FFD89B,#19547B)',
      'linear-gradient(135deg,#FFAFBD,#FFC3A0)',
      'linear-gradient(135deg,#1F4037,#99F2C8)',
      'linear-gradient(135deg,#E0E0E0,#B0B0B0)',
      'linear-gradient(135deg,#FCE38A,#F38181)',
      'linear-gradient(135deg,#7B6499,#2E2A3D)',
    ];
    return `
      <section class="studio-bg-screen">
        <div class="bg-preview">
          ${runningCard(true)}
        </div>
        <div class="bg-divider"></div>
        <div class="bg-tabs">
          <button class="bg-tab ${subtab==='mine'?'active':''}" data-action="bg-tab:mine">내 사진</button>
          <button class="bg-tab ${subtab==='ai'?'active':''}" data-action="bg-tab:ai">AI추천</button>
        </div>
        <div class="bg-grid">
          ${swatches.map((s, i) => `
            <button class="bg-tile" style="background:${s}" data-action="bg-pick:${i}">
              ${i === 0 ? '<span class="bg-check">✓</span>' : ''}
            </button>
          `).join('')}
        </div>
        <button class="primary-btn bg-apply" data-action="bg-apply">배경 적용하기</button>
      </section>
    `;
  },
  record: () => `
    <div class="app-header"><div class="title">기록 추가하기</div></div>
    <div class="placeholder">
      <div class="big">⏱️</div>
      <h2>러닝 기록 추가</h2>
      <p>오늘의 러닝을 직접 기록하거나<br/>파트너 앱에서 가져오세요.</p>
    </div>
  `,
  community: () => {
    const tab = state.communityTab || 'hot';
    const collections = [
      { title: '오늘 러닝 무드', emoji: '☁️', g: 'linear-gradient(135deg,#9CA3AF,#4B5563)' },
      { title: '데일리 러닝',   emoji: '🏆', g: 'linear-gradient(135deg,#FBBF24,#F59E0B)' },
      { title: '야경 러닝',     emoji: '🌙', g: 'linear-gradient(135deg,#1E3A8A,#312E81)' },
      { title: '감성 러닝',     emoji: '💜', g: 'linear-gradient(135deg,#A78BFA,#7C3AED)' },
    ];
    const posts = communityPosts;
    return `
    <section class="community-screen">
      <div class="comm-search">
        <div class="comm-search-box">
          <svg class="search-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <span class="search-tags">#오운완  #생활런  #응원해</span>
        </div>
        <button class="comm-bookmark" aria-label="저장">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4z"/></svg>
        </button>
      </div>

      <div class="comm-tabs">
        <button class="ct-tab ${tab==='hot'?'active':''}" data-action="comm-tab:hot">Hot</button>
        <button class="ct-tab ${tab==='new'?'active':''}" data-action="comm-tab:new">New</button>
      </div>

      <div class="comm-collections-wrap">
        <div class="cc-head">
          <div class="cc-title">인기 모음집 <span class="cc-emoji">👟</span></div>
          <button class="cc-write" data-go="communityCompose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <span>글쓰기</span>
          </button>
        </div>
        <div class="cc-grid">
          ${collections.map(c => `
            <div class="cc-tile" style="background:${c.g}">
              <div class="cc-label">${c.title} <span>${c.emoji}</span></div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="comm-feed">
        ${posts.map(p => feedCard(p)).join('')}
      </div>
    </section>
  `;
  },

  communityPost: (id) => {
    const p = communityPosts.find(x => String(x.id) === String(id)) || communityPosts[0];
    return `
      <div class="app-header comm-post-header">
        <button class="back-btn" data-action="back">‹</button>
        <div class="comm-post-user">
          <div class="cpu-avatar" style="background:${p.avatarBg || 'linear-gradient(135deg,#A78BFA,#7C3AED)'}"></div>
          <span>${p.user || '박채원'}</span>
        </div>
        <button class="comm-bookmark" style="margin-left:auto;" aria-label="저장">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4z"/></svg>
        </button>
      </div>
      <section class="comm-post">
        <div class="post-card">
          <div class="post-card-photo" style="background:${p.bg || 'linear-gradient(180deg,#7DC8E8 0%,#A8D08D 80%)'}"></div>
          <div class="post-card-overlay">
            <div class="pc-date">글쓴날 오전 9:41</div>
            <div class="pc-distance">${p.dist || '6.06'}</div>
            <div class="pc-stats-row">
              <div><b>5'48"</b><i>페이스</i></div>
              <div><b>46:45</b><i>시간</i></div>
              <div><b>154</b><i>kcal</i></div>
            </div>
            <div class="pc-stats-row sub">
              <div><b>25 m</b><i>고도</i></div>
              <div><b>152</b><i>심박</i></div>
              <div><b>173</b><i>케이던스</i></div>
            </div>
          </div>
        </div>

        <div class="post-body">
          <div class="post-title">오늘 날씨 진짜 좋다 - !!!</div>
          <div class="post-tags">@ 오공원 # 무이용 # 야자스</div>
          <div class="post-meta">
            <span class="post-time">4시간 전</span>
            <span class="post-likes">❤️ 563</span>
            <span class="post-comments">💬 120</span>
          </div>
        </div>

        <div class="post-actions">
          <button class="post-act" data-action="toast:즐겨찾기에 추가했어요">
            <span>⭐</span> 즐겨찾기
          </button>
          <button class="post-act primary" data-action="toast:템플릿을 적용했어요">
            <span>✨</span> 이 템플릿 사용하기
          </button>
        </div>
      </section>
    `;
  },

  communityCompose: () => `
    <div class="app-header comm-post-header">
      <button class="back-btn" data-action="back">‹</button>
      <div class="comm-post-user">
        <div class="cpu-avatar" style="background:linear-gradient(135deg,#A78BFA,#7C3AED)"></div>
        <span>${state.user.name || '김러너'}</span>
      </div>
      <button class="comm-bookmark" style="margin-left:auto;" aria-label="저장">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4z"/></svg>
      </button>
    </div>
    <section class="comm-compose">
      <div class="compose-canvas">
        <div class="cc-mascot">
          <img src="assets/mascot.png" alt="" onerror="this.onerror=null;this.src='assets/mascot.svg'"/>
          <div class="cc-card-icon">
            <svg viewBox="0 0 48 48" fill="none" stroke="#8B5CF6" stroke-width="2"><rect x="6" y="6" width="36" height="36" rx="6"/><circle cx="18" cy="18" r="3"/><path d="M6 32l10-8 8 6 8-6 10 8"/></svg>
          </div>
        </div>
        <div class="cc-bring">카드 가져오기</div>
        <button class="cc-plus" data-action="toast:카드를 가져왔어요">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <div class="compose-fields">
        <input type="text" class="compose-input" id="composeCaption" placeholder="캡션 추가..."/>
        <input type="text" class="compose-input" id="composeTags" placeholder="해시태그 추가..."/>
      </div>
      <button class="primary-btn compose-template" data-action="toast:저장된 템플릿을 불러왔어요">저장된 템플릿 가져오기</button>
    </section>
  `,
  archive: () => `
    <div class="app-header"><div class="title">보관함</div></div>
    <div class="placeholder">
      <div class="big">📁</div>
      <h2>나의 보관함</h2>
      <p>저장한 기록과 러닝카드를<br/>여기서 모아볼 수 있어요.</p>
    </div>
  `,

  placeholder: (name) => `
    <div class="placeholder">
      <div class="big">✨</div>
      <h2>${name}</h2>
      <p>준비 중인 화면이에요.</p>
    </div>
  `
};

// ----- Event delegation -----
function bindHandlers() {
  screen.querySelectorAll('[data-stop]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      toast('저장됨');
    });
  });
  screen.querySelectorAll('[data-go]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      go(el.dataset.go);
    });
  });
  screen.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = el.dataset.action;
      if (action === 'back') return back();
      if (action.startsWith('comm-tab:')) {
        state.communityTab = action.split(':')[1];
        render('community');
        return;
      }
      if (action.startsWith('studio-tab:')) {
        const next = action.split(':')[1];
        if (next === 'close') return; // panel close — keep current tab
        state.studioTab = next;
        render('studio');
        return;
      }
      if (action.startsWith('bg-tab:')) {
        state.bgPickerTab = action.split(':')[1];
        render('studioBg');
        return;
      }
      if (action.startsWith('bg-pick:')) {
        screen.querySelectorAll('.bg-tile .bg-check').forEach(c => c.remove());
        const check = document.createElement('span');
        check.className = 'bg-check'; check.textContent = '✓';
        el.appendChild(check);
        return;
      }
      if (action === 'bg-apply') {
        toast('배경이 적용되었어요');
        setTimeout(() => back(), 500);
        return;
      }
      if (action === 'signup-submit') {
        const name = document.getElementById('signupName')?.value.trim();
        const y = document.getElementById('signupYear')?.value.trim();
        const m = document.getElementById('signupMonth')?.value.trim();
        const d = document.getElementById('signupDay')?.value.trim();
        const style = document.querySelector('input[name="style"]:checked')?.value;
        if (!name) { toast('이름을 입력해주세요'); return; }
        if (!y || !m || !d) { toast('생년월일을 입력해주세요'); return; }
        state.user.name = name;
        state.user.birth = `${y}.${m.padStart(2,'0')}.${d.padStart(2,'0')}`;
        state.user.style = style;
        toast('계정이 만들어졌어요!');
        setTimeout(() => { navStack.length = 0; go('home'); }, 600);
        return;
      }
      if (action === 'inquiry-submit') {
        const type = document.querySelector('input[name="iqtype"]:checked')?.value || '서비스 이용';
        const title = document.getElementById('inqTitle')?.value.trim();
        const body = document.getElementById('inqBody')?.value.trim();
        if (!title || !body) { toast('제목과 내용을 입력해주세요'); return; }
        const newInq = {
          id: Date.now(),
          type, title, body,
          date: new Date().toISOString().slice(0,16).replace('T',' ').replace(/-/g,'.'),
          status: 'wait'
        };
        state.inquiries.unshift(newInq);
        toast('문의가 등록되었어요');
        setTimeout(() => go('inquiryDetail:' + newInq.id, { replace: true }), 500);
        return;
      }
      if (action === 'profile-save') {
        const name = document.getElementById('editName')?.value.trim();
        const y = document.getElementById('editYear')?.value.trim();
        const m = document.getElementById('editMonth')?.value.trim();
        const d = document.getElementById('editDay')?.value.trim();
        const email = document.getElementById('editEmail')?.value.trim();
        const style = document.querySelector('input[name="editStyle"]:checked')?.value;
        if (!name) { toast('이름을 입력해주세요'); return; }
        if (!y || !m || !d) { toast('생년월일을 입력해주세요'); return; }
        if (!email || !email.includes('@')) { toast('올바른 이메일을 입력해주세요'); return; }
        state.user.name = name;
        state.user.birth = `${y}.${m.padStart(2,'0')}.${d.padStart(2,'0')}`;
        state.user.email = email;
        state.user.style = style;
        toast('프로필이 수정되었어요');
        setTimeout(() => back(), 600);
        return;
      }
      if (action === 'feedback-submit') {
        const title = document.getElementById('fbTitle')?.value.trim();
        const body = document.getElementById('fbBody')?.value.trim();
        if (!title || !body) { toast('제목과 내용을 입력해주세요'); return; }
        toast('소중한 의견 감사합니다!');
        setTimeout(() => back(), 700);
        return;
      }
      if (action.startsWith('toast:')) {
        toast(action.slice(6));
        return;
      }
    });
  });
}

// Bottom nav handlers
bottomNav.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => {
    const route = el.dataset.nav;
    navStack.length = 0;
    go(route);
  });
});

// Boot
go('splash');
// Auto-advance from splash after a moment
setTimeout(() => {
  if (navStack[navStack.length - 1] === 'splash') {
    // Stay on splash; user taps to continue
  }
}, 0);
