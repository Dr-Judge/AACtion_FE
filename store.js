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

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { session: null, users: {} };
    } catch (e) {
      return { session: null, users: {} };
    }
  }
  function write(db) {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) {
      /* 저장 공간이 없으면 조용히 넘어갑니다 */
    }
  }

  const now = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}  ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  /** 새 계정의 초기 상태 — 비어 있는 채로 시작합니다 */
  function blank(userId, profile) {
    return {
      profile: {
        userId,
        nickname:
          (profile && profile.nickname) ||
          RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)],
        name: (profile && profile.name) || '',
        email: (profile && profile.email) || '',
        studentNo: (profile && profile.studentNo) || '',
        interest: (profile && profile.interest) || null,
        avatar: null,
      },
      points: [],
      history: [],
      cards: [],
    };
  }

  /* ---------- 세션 ---------- */

  /** 로그인 — 없는 계정이면 새로 만듭니다 */
  function signIn(userId, profile) {
    const db = read();
    const isNew = !db.users[userId];
    if (isNew) db.users[userId] = blank(userId, profile);
    db.session = userId;
    write(db);

    if (isNew) addPoint('가입 축하 포인트', 1000);
    return { isNew, user: db.users[userId] };
  }

  function signOut() {
    const db = read();
    db.session = null; // 계정 데이터는 남기고 세션만 끊습니다
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

  /** 개발용 — 저장된 계정을 전부 지웁니다 */
  function reset() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
  }

  return {
    signIn,
    signOut,
    current,
    currentId,
    isLoggedIn,
    updateProfile,
    addPoint,
    totalPoint,
    addHistory,
    addCard,
    removeCard,
    hydrate,
    reset,
    RANDOM_NICKNAMES,
  };
})();
