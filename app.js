// TRACKSY Prototype — single-file router
const screen = document.getElementById('screen');
const device = document.getElementById('device');
const bottomNav = document.getElementById('bottomNav');

const state = {
  user: { name: '김러너', birth: '2000.01.01', email: 'tracksy1@gmail.com', style: '산책/러닝' },
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
  const showNav = !['splash','login','signup'].some(s => route === s);
  if (!showNav) {
    bottomNav.style.display = 'none';
    if (route === 'splash') device.classList.add('hide-nav');
  }
  // Set active nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navMap = { home: 'home', studio: 'studio', record: 'record', community: 'community', archive: 'archive' };
  const navKey = ['profile','settings','partners','inquiry','inquiryDetail','inquiryList','feedback'].includes(route.split(':')[0]) ? 'home' : navMap[route] || null;
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
}

// ----- Views -----
const views = {
  splash: () => `
    <section class="splash">
      <div class="logo-wrap">
        <svg viewBox="0 0 64 64" fill="none">
          <rect x="8" y="8" width="48" height="48" rx="12" fill="white" opacity="0.95"/>
          <path d="M22 38 c0 -8 6 -14 14 -14 c4 0 7 2 9 5 l-4 3 c-1 -2 -3 -3 -5 -3 c-5 0 -9 4 -9 9 c0 5 4 9 9 9 c2 0 4 -1 5 -3 l4 3 c-2 3 -5 5 -9 5 c-8 0 -14 -6 -14 -14 z" fill="#8B5CF6"/>
          <circle cx="42" cy="22" r="4" fill="#FBBF24"/>
        </svg>
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

  home: () => `
    <section class="home-screen">
      <div class="home-top">
        <div class="brand">TRACKSY</div>
        <div class="icons">
          <button class="icon-btn" data-go="profile" title="프로필">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
          </button>
          <button class="icon-btn" data-go="settings" title="설정">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
          </button>
        </div>
      </div>

      <div class="hero-card">
        <h2>러닝 카드 만들기</h2>
        <p>오늘의 러닝을 멋진 카드로 꾸며보세요</p>
        <button class="cta" data-go="studio">시작하기 →</button>
      </div>

      <div class="section-title">이번 주 러닝</div>
      <div class="stats-grid">
        <div class="stat-card full">
          <div class="label">
            <span class="icon-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l4-8 4 16 4-12 4 8h2"/></svg></span>
            이번 주 누적 거리
          </div>
          <div class="value">24.5 <small>km</small></div>
          <div class="bars">
            <div class="bar" style="height:30%"></div>
            <div class="bar active" style="height:60%"></div>
            <div class="bar" style="height:20%"></div>
            <div class="bar active" style="height:80%"></div>
            <div class="bar" style="height:45%"></div>
            <div class="bar active" style="height:90%"></div>
            <div class="bar" style="height:0%"></div>
          </div>
          <div class="bars-labels">
            <span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span><span>일</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="label">
            <span class="icon-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg></span>
            이번 달 횟수
          </div>
          <div class="value">12 <small>회</small></div>
          <div class="sub">지난달보다 +3회</div>
        </div>

        <div class="stat-card">
          <div class="label">
            <span class="icon-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7h7l-5.5 4 2 8L12 17l-6.5 4 2-8L2 9h7z"/></svg></span>
            90일 최고 페이스
          </div>
          <div class="value">5'12" <small>/km</small></div>
          <div class="sub">개인 베스트</div>
        </div>
      </div>
    </section>
  `,

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
        <div class="profile-edit">
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

  studio: () => `
    <div class="app-header"><div class="title">스튜디오</div></div>
    <div class="placeholder">
      <div class="big">🎨</div>
      <h2>러닝 카드 스튜디오</h2>
      <p>나만의 러닝 카드를 디자인하는 공간이에요.<br/>곧 만나요!</p>
    </div>
  `,
  record: () => `
    <div class="app-header"><div class="title">기록 추가하기</div></div>
    <div class="placeholder">
      <div class="big">⏱️</div>
      <h2>러닝 기록 추가</h2>
      <p>오늘의 러닝을 직접 기록하거나<br/>파트너 앱에서 가져오세요.</p>
    </div>
  `,
  community: () => `
    <div class="app-header"><div class="title">커뮤니티</div></div>
    <div class="placeholder">
      <div class="big">👥</div>
      <h2>러너들의 이야기</h2>
      <p>다른 러너들의 카드를 둘러보고<br/>서로 응원해보세요.</p>
    </div>
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
