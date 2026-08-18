/* ============================================
   Dr.Judge — 계정별 데이터 저장소

   백엔드가 붙기 전까지 브라우저에 계정별로 나눠 보관합니다.
   화면들은 Store 만 보고 그리므로, 나중에 서버를 붙일 때는
   이 파일의 함수 안쪽만 API 호출로 바꾸면 됩니다.

   구조
     drjudge = {
       session: 'userId',
       users: { userId: { profile, points, history, cards } }
     }
   ============================================ */

const Store = (() => {
  const KEY = 'drjudge';

  /* 가입 시 자동으로 붙는 닉네임 후보 */
  const RANDOM_NICKNAMES = [
    '건강한하루',
    '성분탐정',
    '팩트체커',
    '오늘도판정',
    '꼼꼼한소비자',
    '라벨읽는사람',
    '근거먼저',
    '차분한리서처',
  ];

  /* ---------- 저장 위치 ----------
     localStorage 가 우선이지만, 파일을 더블클릭해서 여는 file:// 환경에서는
     브라우저가 localStorage 를 막습니다. 그때는 window.name 에 담아
     같은 탭 안에서 화면을 옮겨다녀도 데이터가 유지되게 합니다. */
  const TAG = '#drjudge#';

  function canUseLocal() {
    try {
      localStorage.setItem('__t', '1');
      localStorage.removeItem('__t');
      return true;
    } catch (e) {
      return false;
    }
  }
  const USE_LOCAL = canUseLocal();

  function rawGet() {
    if (USE_LOCAL) {
      try {
        return localStorage.getItem(KEY);
      } catch (e) {
        return null;
      }
    }
    const n = String(window.name || '');
    return n.startsWith(TAG) ? n.slice(TAG.length) : null;
  }
  function rawSet(text) {
    if (USE_LOCAL) {
      try {
        localStorage.setItem(KEY, text);
      } catch (e) {}
      return;
    }
    window.name = TAG + text;
  }

  function read() {
    try {
      return JSON.parse(rawGet()) || { session: null, users: {} };
    } catch (e) {
      return { session: null, users: {} };
    }
  }
  function write(db) {
    rawSet(JSON.stringify(db));
  }

  const now = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}  ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  /** 새 계정의 초기 상태 — 비어 있는 채로 시작합니다 */
  /** 문자열 → 숫자 (같은 입력이면 항상 같은 값) */
  function hashOf(str) {
    let h = 0;
    for (let i = 0; i < String(str).length; i++) {
      h = (h * 31 + String(str).charCodeAt(i)) >>> 0;
    }
    return h;
  }

  function blank(userId, profile) {
    return {
      profile: {
        userId,
        // 아이디에서 계산하므로 같은 계정은 늘 같은 닉네임을 받습니다
        nickname:
          (profile && profile.nickname) ||
          RANDOM_NICKNAMES[hashOf(userId) % RANDOM_NICKNAMES.length],
        name: (profile && profile.name) || '',
        email: (profile && profile.email) || '',
        studentNo: (profile && profile.studentNo) || '',
        interest: (profile && profile.interest) || null,
      },
      points: [],
      history: [],
      cards: [],
    };
  }

  /* ---------- 계정 ---------- */

  /**
   * 회원가입 — 이미 있는 아이디·이메일이면 거절합니다.
   * 한 사람이 계정을 여러 개 만들 수 없도록 이메일로도 막습니다.
   *
   * 주의: 지금은 백엔드가 없어 비밀번호를 브라우저에 그대로 둡니다.
   *       서버가 붙으면 이 부분은 서버로 옮기고 여기서는 지워야 합니다.
   */
  function register(userId, password, profile) {
    const db = read();
    const users = db.users;

    if (users[userId]) return { ok: false, code: 'DUPLICATE_USER_ID' };

    const email = (profile && profile.email ? profile.email : '').toLowerCase();
    const nickname = profile && profile.nickname ? profile.nickname : '';

    const taken = (pick, value) =>
      value &&
      Object.values(users).some(
        (u) => String(pick(u.profile) || '').toLowerCase() === value.toLowerCase(),
      );

    if (taken((p) => p.email, email)) return { ok: false, code: 'DUPLICATE_EMAIL' };
    if (taken((p) => p.nickname, nickname))
      return { ok: false, code: 'DUPLICATE_NICKNAME' };

    users[userId] = blank(userId, profile);
    users[userId].password = password;
    db.session = userId;
    write(db);

    addPoint('가입 축하 포인트', 1000);
    return { ok: true, user: users[userId] };
  }

  /** 로그인 — 가입한 계정이 아니거나 비밀번호가 다르면 거절합니다. */
  function authenticate(userId, password) {
    const db = read();
    const user = db.users[userId];

    if (!user) return { ok: false, code: 'USER_NOT_FOUND' };
    if (user.password !== password) return { ok: false, code: 'INVALID_PASSWORD' };

    db.session = userId;
    write(db);
    return { ok: true, user };
  }

  /** 이미 쓰고 있는 값인지 — field: userId | email | nickname */
  function isTaken(field, value) {
    if (!value) return false;
    const users = read().users;
    if (field === 'userId') return Boolean(users[value]);
    return Object.values(users).some(
      (u) =>
        String(u.profile[field] || '').toLowerCase() ===
        String(value).toLowerCase(),
    );
  }

  /* ---------- 세션 ---------- */

  /** 세션만 다시 여는 용도 — 계정이 없으면 실패합니다 */
  function signIn(userId) {
    const db = read();
    if (!db.users[userId]) return { ok: false, code: 'USER_NOT_FOUND' };
    db.session = userId;
    write(db);
    return { ok: true, user: db.users[userId] };
  }

  function signOut() {
    const db = read();
    db.session = null; // 계정 데이터는 남기고 세션만 끊습니다
    db.tokens = null;
    write(db);
  }

  const currentId = () => read().session;
  const isLoggedIn = () => Boolean(currentId());

  /** 현재 로그인한 계정의 데이터 (없으면 null) */
  function current() {
    const db = read();
    return db.session ? db.users[db.session] : null;
  }

  /* ---------- 프로필 ---------- */
  function updateProfile(patch) {
    const db = read();
    if (!db.session) return null;
    Object.assign(db.users[db.session].profile, patch);
    write(db);
    return db.users[db.session].profile;
  }

  /* ---------- 포인트 ---------- */
  function addPoint(label, amount) {
    const db = read();
    if (!db.session) return;
    db.users[db.session].points.unshift({ label, at: now(), amount });
    write(db);
  }
  function totalPoint() {
    const u = current();
    return u ? u.points.reduce((s, p) => s + p.amount, 0) : 0;
  }

  /* ---------- 판정 이력 ---------- */
  function hasHistory(id) {
    const u = current();
    return Boolean(u && u.history.some((h) => h.id && String(h.id) === String(id)));
  }

  function addHistory(item) {
    const db = read();
    if (!db.session) return;
    db.users[db.session].history.unshift({ at: now(), ...item });
    write(db);
    addPoint('판정 완료', 50);
  }

  /* ---------- 공유 카드 ---------- */
  function addCard(card) {
    const db = read();
    if (!db.session) return;
    db.users[db.session].cards.unshift({ id: 'm' + Date.now(), likes: 0, ...card });
    write(db);
    addPoint('카드 공유', 50);
  }
  function removeCard(id) {
    const db = read();
    if (!db.session) return;
    const u = db.users[db.session];
    u.cards = u.cards.filter((c) => c.id !== id);
    write(db);
  }

  /**
   * 서버에서 받은 내 데이터를 그대로 채워 넣습니다.
   * 연동 후에는 로그인 직후 한 번 호출해 주면
   * 화면 코드는 지금과 똑같이 Store 만 읽으면 됩니다.
   *   Store.hydrate({ profile, points, history, cards })
   */
  function hydrate(data) {
    const db = read();
    if (!db.session || !data) return;
    const u = db.users[db.session];
    if (data.profile) Object.assign(u.profile, data.profile);
    if (data.points) u.points = data.points;
    if (data.history) u.history = data.history;
    if (data.cards) u.cards = data.cards;
    write(db);
  }

  /* ---------- 토큰 ----------
     화면을 옮겨도 로그인이 유지되도록 저장소에 함께 보관합니다.
     주의: 브라우저 저장소는 스크립트가 읽을 수 있습니다.
           실제 서비스라면 httpOnly 쿠키로 옮기는 편이 안전합니다. */
  function saveTokens(t) {
    const db = read();
    db.tokens = t
      ? { accessToken: t.accessToken || null, refreshToken: t.refreshToken || null }
      : null;
    write(db);
  }
  function tokens() {
    return read().tokens || { accessToken: null, refreshToken: null };
  }

  /* ---------- 판정 결과 ---------- */
  function saveResult(result) {
    const db = read();
    if (!db.session) return result;
    const u = db.users[db.session];
    u.results = u.results || {};
    u.results[result.id] = result;
    write(db);
    return result;
  }
  function getResult(id) {
    const u = current();
    return u && u.results ? u.results[id] || null : null;
  }

  /** 탈퇴 — 이 계정의 데이터를 통째로 지웁니다 (되돌릴 수 없음) */
  function removeAccount(userId) {
    const db = read();
    const id = userId || db.session;
    if (!id) return false;
    delete db.users[id];
    if (db.session === id) {
      db.session = null;
      db.tokens = null;
    }
    write(db);
    return true;
  }

  /** 개발용 — 저장된 계정을 전부 지웁니다 */
  function reset() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
  }

  return {
    register,
    authenticate,
    isTaken,
    signIn,
    signOut,
    current,
    currentId,
    isLoggedIn,
    updateProfile,
    addPoint,
    totalPoint,
    addHistory,
    hasHistory,
    addCard,
    removeCard,
    removeAccount,
    saveTokens,
    tokens,
    saveResult,
    getResult,
    hashOf,
    hydrate,
    reset,
    RANDOM_NICKNAMES,
  };
})();
