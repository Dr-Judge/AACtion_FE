/* ============================================
   Dr.Judge — API 래퍼
   백엔드 연동 시 이 파일만 수정하면 됩니다.

   1) BASE_URL 을 실제 서버 주소로 변경
   2) 아래 LIVE 에서 서버에 준비된 기능을 true 로 변경
   3) 응답 형태가 다르면 ERROR_MESSAGE / statusMap 만 수정
   ============================================ */

const API = (() => {
  /* ---------- 서버 주소 ----------
     프론트는 Live Server(5500) 로 열고, 백엔드는 8080 에서 돕니다.
     배포하면 아래 SERVER_URL 만 실제 주소로 바꾸면 됩니다. */
  const SERVER_URL = ''; // 예: 'https://api.drjudge.com'

  const BASE_URL =
    (SERVER_URL || 'http://' + (location.hostname || 'localhost') + ':8080') +
    '/api';

  const TIMEOUT = 8000;

  /* ---------- 어떤 기능을 실제 서버에 붙일지 ----------
     서버에 만들어진 것부터 하나씩 true 로 바꾸면 됩니다.
     false 인 기능은 서버 없이 브라우저 안에서 동작합니다. */
  const LIVE = {
    signup: true, // POST /auth/signup — 연동됨
    login: true, // POST /auth/login — 연동됨
    checkDuplicate: false, // 명세 대기
    judge: true, // POST·GET /judgements — 연동됨
    onboarding: true, // POST·PATCH /me/onboarding — 연동됨
    briefing: true, // GET /briefings/today — 연동됨
    share: true, // POST /judgments/{id}/share — 연동됨
    feed: true, // POST /feed/posts — 연동됨
    profile: false, // 명세 대기
  };

  const live = (key) => LIVE[key] === true;



  /* ---------- 서버 에러코드 → 화면 오류 문구 ----------
     서버는 { code, message } 형태로 내려준다고 가정합니다.
     field 는 오류를 표시할 입력 칸(data-field 값)입니다. */
  const ERROR_MESSAGE = {
    USER_NOT_FOUND: { field: 'userId', text: '아이디를 다시 확인해 주세요.' },
    INVALID_PASSWORD: {
      field: 'password',
      text: '비밀번호를 다시 확인해 주세요.',
    },
    DUPLICATE_USER_ID: {
      field: 'userId',
      text: '이미 사용 중인 아이디예요.',
    },
    DUPLICATE_NICKNAME: {
      field: 'nickname',
      text: '이미 사용 중인 닉네임이에요.',
    },
    DUPLICATE_EMAIL: {
      field: 'email',
      text: '이미 가입된 이메일 주소예요.',
    },
    INVALID_EMAIL: {
      field: 'email',
      text: '이메일 주소를 다시 확인해 주세요.',
    },
    DAILY_LIMIT: {
      field: null,
      text: '오늘 판정 요청 한도에 도달했습니다.',
    },
    OCR_FAILED: {
      field: null,
      text: '이미지에서 텍스트를 읽지 못했어요.',
    },
    UNSUPPORTED_LINK: {
      field: null,
      text: '비공개·멤버십 콘텐츠는 추출이 제한될 수 있습니다.',
    },
    INVALID_INPUT: { field: null, text: '입력한 내용을 다시 확인해 주세요.' },
    INVALID_CREDENTIALS: {
      // 서버가 아이디/비밀번호를 구분하지 않으므로 두 칸 모두 표시합니다
      fields: ['userId', 'password'],
      field: null,
      text: '아이디 또는 비밀번호를 다시 확인해 주세요.',
    },
    WITHDRAWN_USER: { field: null, text: '이미 탈퇴한 계정이에요.' },
    FEED_BLOCKED: {
      field: null,
      text: '아직 게시할 수 없는 판정이에요. 판정이 끝난 뒤 다시 시도해 주세요.',
    },
    SHARE_NOT_FOUND: {
      field: null,
      text: '이미 회수됐거나 발급된 링크가 없어요.',
    },
    SHARE_GONE: {
      field: null,
      text: '더 이상 볼 수 없는 링크예요. 공유한 분에게 다시 요청해 주세요.',
    },
    SESSION_EXPIRED: {
      field: null,
      text: '로그인이 만료됐어요. 다시 로그인해 주세요.',
    },
    FORBIDDEN: { field: null, text: '내가 요청한 판정만 볼 수 있어요.' },
    NOT_FOUND: { field: null, text: '판정 결과를 찾을 수 없어요.' },
    JUDGE_TIMEOUT: {
      field: null,
      text: '판정이 오래 걸리고 있어요. 잠시 후 판정 이력에서 확인해 주세요.',
    },
    SERVER_ERROR: { field: null, text: '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.' },
    NETWORK_ERROR: { field: null, text: '네트워크 연결을 확인해 주세요.' },
    UNKNOWN: { field: null, text: '잠시 후 다시 시도해 주세요.' },
  };

  function toError(code) {
    return { ok: false, code, ...(ERROR_MESSAGE[code] || ERROR_MESSAGE.UNKNOWN) };
  }

  /* ---------- 공통 fetch ----------
     서버는 이런 형태로 응답합니다.
       성공 { "success": true,  "data": {...}, "error": null }
       실패 { "success": false, "data": null,  "error": {...} }
     여기서 껍데기를 벗겨 화면에는 data 만 넘겨줍니다. */

  /* HTTP 상태코드 → 화면 오류코드 (엔드포인트별로 statusMap 으로 덮어쓸 수 있음) */
  const STATUS_FALLBACK = {
    400: 'INVALID_INPUT',
    401: 'INVALID_PASSWORD',
    403: 'FORBIDDEN',
    404: 'USER_NOT_FOUND',
    409: 'DUPLICATE_EMAIL',
    429: 'DAILY_LIMIT',
    500: 'SERVER_ERROR',
  };

  async function request(path, opts = {}) {
    const { method = 'GET', body, auth = true, statusMap, noRetry, _retried } = opts;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const res = await fetch(BASE_URL + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(auth && getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const json = await res.json().catch(() => ({}));
      const err = json.error || {};

      // 토큰이 없는데 401 이면 로그인이 필요한 상황입니다
      if (res.status === 401 && auth && !getRefreshToken()) {
        notifySessionExpired();
        return toError('SESSION_EXPIRED');
      }

      // 액세스 토큰이 만료된 경우 → 한 번만 재발급 후 다시 시도
      if (res.status === 401 && auth && !noRetry && !_retried && getRefreshToken()) {
        const again = await refresh();
        if (again.ok) return request(path, { ...opts, _retried: true });
        return toError('SESSION_EXPIRED');
      }

      if (!res.ok || json.success === false) {
        const code =
          err.code ||
          err.errorCode ||
          (statusMap && statusMap[res.status]) ||
          STATUS_FALLBACK[res.status] ||
          'UNKNOWN';

        const out = toError(code);
        // 서버가 사람이 읽을 문구를 주면 그걸 우선 보여줍니다
        if (err.message) out.text = err.message;
        out.status = res.status;
        return out;
      }

      // data 가 있으면 data 만, 없으면 전체를 돌려줍니다
      return { ok: true, data: json.data !== undefined && json.data !== null ? json.data : json };
    } catch (e) {
      // 무엇 때문에 실패했는지 콘솔에 남깁니다.
      // fetch 가 던지는 오류는 CORS 차단과 서버 다운을 구분해주지 않아서,
      // 개발자도구 Network 탭을 함께 보셔야 합니다. (server-check.html 참고)
      console.error(
        `[API] ${method} ${BASE_URL + path} 실패 —`,
        e && e.name === 'AbortError' ? '응답이 없어 시간 초과' : e && e.message,
        '\n서버가 떠 있는지 / CORS 가 열려 있는지 확인: ./server-check.html',
      );
      return toError('NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- 토큰 보관 ----------
     주의: 브라우저 저장소 대신 메모리에 보관합니다.
     실제 서비스에서는 httpOnly 쿠키 사용을 권장합니다. */
  const getToken = () => Store.tokens().accessToken;
  const getRefreshToken = () => Store.tokens().refreshToken;

  function setTokens(accessToken, refreshToken) {
    Store.saveTokens({ accessToken, refreshToken });
  }
  const clearToken = () => Store.saveTokens(null);

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- 목 데이터 ---------- */

  /* ============================================
     화면에서 호출하는 함수들
     ============================================ */

  /** 로그인 — 성공: {ok:true, data:{token, user}} / 실패: {ok:false, code, field, text} */
  async function login({ userId, password }) {
    if (live('login')) {
      const res = await request('/auth/login', {
        method: 'POST',
        auth: false,
        body: { loginId: userId, password },
        statusMap: {
          400: 'INVALID_CREDENTIALS', // 아이디 또는 비번 틀림 / 값 누락
          409: 'WITHDRAWN_USER', // 이미 탈퇴한 회원
        },
      });
      if (!res.ok) return res;

      setTokens(res.data.accessToken, res.data.refreshToken);

      // 서버가 프로필을 주지 않으므로, 없으면 아이디로 계정을 만들어 둡니다
      if (!Store.signIn(userId).ok) {
        Store.register(userId, password, {});
      }
      Store.hydrate(res.data);
      return res;
    }

    await delay(120);

    // 가입한 계정이 아니면 로그인되지 않습니다.
    const r = Store.authenticate(userId, password);
    if (!r.ok) return toError(r.code);

    setTokens('mock-token', 'mock-refresh');
    return { ok: true, data: { token: 'mock-token', user: r.user.profile } };
  }

  /** 회원가입 */
  /**
   * 회원가입
   *   POST /api/auth/signup
   *   요청  { loginId, password, email, name, nickname }
   *   응답  201 { success:true, data:{ userId:5 }, error:null }
   *         400 필수 값 누락·형식 오류 / 409 이미 등록된 이메일 / 500 서버 오류
   *
   * 서버가 토큰을 주지 않으므로, 가입 성공 후 곧바로 로그인해 세션을 만듭니다.
   */
  async function signup(payload) {
    if (live('signup')) {
      // 서버 409 는 이메일 중복만 알려주므로, 아이디·닉네임은 먼저 확인합니다
      if (Store.isTaken('userId', payload.userId)) return toError('DUPLICATE_USER_ID');
      if (Store.isTaken('nickname', payload.nickname))
        return toError('DUPLICATE_NICKNAME');

      const res = await request('/auth/signup', {
        method: 'POST',
        auth: false,
        body: {
          loginId: payload.userId,
          password: payload.password,
          email: payload.email,
          name: payload.name,
          nickname: payload.nickname,
        },
        statusMap: { 409: 'DUPLICATE_EMAIL', 400: 'INVALID_INPUT' },
      });
      if (!res.ok) return res;

      // 가입 성공 → 계정 저장
      Store.register(payload.userId, payload.password, payload);
      Store.updateProfile({ serverId: res.data.userId });

      // 로그인 API 가 준비되면 토큰까지 받아옵니다.
      // 아직이면 방금 만든 로컬 세션으로 그대로 진행합니다.
      if (live('login')) {
        const signed = await login({
          userId: payload.userId,
          password: payload.password,
        });
        if (!signed.ok) return signed;
      }
      return { ok: true, data: res.data };
    }

    await delay(150);

    // 아이디·이메일·닉네임이 겹치면 가입되지 않습니다 (한 사람 한 계정)
    const r = Store.register(payload.userId, payload.password, payload);
    if (!r.ok) return toError(r.code);

    setTokens('mock-token', 'mock-refresh');
    return { ok: true, data: { token: 'mock-token', userId: payload.userId } };
  }

  /** 중복 확인 — field: 'userId' | 'nickname' | 'email' */
  async function checkDuplicate(field, value) {
    if (live('checkDuplicate')) {
      return request(
        `/auth/check?field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`,
        { auth: false },
      );
    }

    await delay(80);

    if (Store.isTaken(field, value)) {
      return toError(
        {
          userId: 'DUPLICATE_USER_ID',
          nickname: 'DUPLICATE_NICKNAME',
          email: 'DUPLICATE_EMAIL',
        }[field],
      );
    }
    return { ok: true, data: { available: true } };
  }

  /* ---------- 판정 ----------
     엔드포인트 경로는 아래 한 줄에서 바꿀 수 있습니다. */
  const JUDGE_PATH = '/judgements';

  /* 공유 링크만 명세서 URL 이 /judgments (e 없음) 로 적혀 있습니다.
     서버와 다르면 404 가 나니 이 줄을 고치면 됩니다. */
  const SHARE_PATH = '/judgments';

  /**
   * 판정 요청 생성
   *   POST /api/judgements
   *   요청  { inputType:'TEXT'|'IMAGE'|'LINK', text, imageBase64, url, categoryId }
   *   응답  202 { success:true, data:{ judgmentId:1, status:'PROCESSING' } }
   *
   * 비동기라서 접수만 하고 끝납니다. 상세 결과는 조회 API 로 따로 받아옵니다.
   *
   *   400 입력 값 오류
   *   401 인증 필요·토큰 만료
   *   422 입력 형식 인식 불가 (OCR·자막 추출 실패) → 추출 실패 안내 화면
   *   429 일일 한도 초과 (nextAvailableAt 포함) → 한도 초과 안내 화면
   *   500 서버 오류
   */
  let mockCount = 0;
  const DAILY_MAX = 3; // 목 모드 하루 한도 (모달 확인용)

  async function requestJudge(payload) {
    if (live('judge')) {
      const body = { inputType: (payload.type || 'text').toUpperCase() };

      if (body.inputType === 'TEXT') body.text = payload.text;
      if (body.inputType === 'IMAGE') body.imageBase64 = payload.imageBase64;
      if (body.inputType === 'LINK') body.url = payload.url;
      if (payload.categoryId) body.categoryId = payload.categoryId;

      const res = await request(JUDGE_PATH, {
        method: 'POST',
        body,
        statusMap: {
          400: 'INVALID_INPUT',
          422: 'OCR_FAILED',
          429: 'DAILY_LIMIT',
        },
      });
      if (!res.ok) return res;

      // 접수만 된 상태 — 결과는 조회 API 로 받아옵니다
      const id = String(res.data.judgmentId);
      Store.saveResult({
        id,
        claim: payload.text || payload.url || payload.fileName || '판정 요청',
        type: payload.type,
        status: res.data.status || 'PROCESSING',
        createdAt: new Date().toISOString(),
      });
      return { ok: true, data: { ...res.data, id } };
    }

    await delay(300);

    // 목 모드에서 추출 실패 화면을 보려면
    //   이미지: 파일명에 fail 포함  /  링크: 주소에 fail 포함
    const name = payload.fileName || payload.url || '';
    if (payload.type !== 'text' && /fail/i.test(name)) {
      return toError('OCR_FAILED');
    }

    if (mockCount >= DAILY_MAX) return toError('DAILY_LIMIT');
    mockCount += 1;

    // 입력한 내용을 그대로 판정 대상으로 삼습니다.
    const claim = payload.text || payload.url || payload.fileName || '판정 요청';

    // 같은 문장은 늘 같은 결과가 나오도록 내용에서 등급을 계산합니다.
    const levels =
      typeof EVIDENCE_LEVELS !== 'undefined'
        ? EVIDENCE_LEVELS
        : [{ key: 'hold' }];
    const level = levels[Store.hashOf(claim) % levels.length];

    const STATUS = {
      clinical: 'fit',
      expert: 'fit',
      hold: 'vague',
      lack: 'vague',
      refuted: 'unfit',
    };

    const result = {
      id: 'j' + Date.now(),
      claim,
      type: payload.type,
      level: level.key,
      conflict: Store.hashOf(claim) % 2 === 0,
      createdAt: new Date().toISOString(),
    };
    Store.saveResult(result);

    Store.addHistory({
      id: result.id,
      category: '기타',
      title: claim.length > 24 ? claim.slice(0, 24) + '…' : claim,
      status: STATUS[level.key] || 'vague',
    });

    return { ok: true, data: result };
  }

  /* ---------- 서버 값 → 화면 값 ---------- */
  const TRUST_TO_LEVEL = {
    CLINICAL_EVIDENCE: 'clinical',
    EXPERT_OPINION: 'expert',
    PENDING: 'hold',
    NO_EVIDENCE: 'lack',
    COUNTER_EVIDENCE: 'refuted',
  };
  const LEVEL_TO_HISTORY = {
    clinical: 'fit',
    expert: 'fit',
    hold: 'vague',
    lack: 'vague',
    refuted: 'unfit',
  };

  function normalizeJudgment(d) {
    const coi = d.conflictOfInterest || {};
    return {
      id: String(d.judgmentId),
      status: d.status,
      claim: d.extractedText || '',
      inputType: d.inputType,
      categoryId: d.categoryId,
      level: TRUST_TO_LEVEL[d.trustLevel] || null,
      levelLabel: d.trustLevelLabel || null,
      evidence: d.evidenceSummary || '',
      conflict: Boolean(coi.detected),
      conflictType: coi.type || null,
      conflictBadge: coi.badgeLabel || '이해상충 가능성',
      conflictDesc: coi.description || '',
      safetyNotice: d.safetyNotice || null,
      sources: Array.isArray(d.sources) ? d.sources : [],
      guideCard: d.guideCard || null,
      createdAt: d.createdAt,
    };
  }

  /**
   * 판정 결과 조회
   *   GET /api/judgements/{judgementId}
   *   200 조회 성공 / 401 인증 / 403 남의 판정 / 404 없음 / 500 서버 오류
   */
  async function getJudgment(id) {
    if (!live('judge')) {
      const saved = Store.getResult(String(id));
      return saved
        ? { ok: true, data: { ...saved, status: saved.status || 'DONE' } }
        : toError('NOT_FOUND');
    }

    const res = await request(`${JUDGE_PATH}/${encodeURIComponent(id)}`, {
      statusMap: { 403: 'FORBIDDEN', 404: 'NOT_FOUND' },
    });
    if (!res.ok) return res;

    const result = normalizeJudgment(res.data);
    Store.saveResult(result);

    // 판정이 끝나면 이력에 남깁니다 (같은 판정은 한 번만)
    if (result.status === 'DONE' && !Store.hasHistory(result.id)) {
      Store.addHistory({
        id: result.id,
        category: result.levelLabel || '기타',
        title:
          result.claim.length > 24
            ? result.claim.slice(0, 24) + '…'
            : result.claim || '판정 요청',
        status: LEVEL_TO_HISTORY[result.level] || 'vague',
      });
    }
    return { ok: true, data: result };
  }

  /* 라벨 문자열 → 이력 뱃지 상태 */
  const LABEL_TO_HISTORY = {
    '임상적 근거 있음': 'fit',
    '전문가 의견 있음': 'fit',
    판단보류: 'vague',
    '근거 부족': 'vague',
    '반박 근거 있음': 'unfit',
  };

  /**
   * 판정 히스토리 조회
   *   GET /api/judgements?page=&size=&categoryId=
   *   응답 200 { success:true, data:{ items:[...], hasNext:true } }
   *        401 인증 / 500 서버 오류
   *
   * items 에는 제목이 없어서, 이 기기에 저장된 판정 문장이 있으면 함께 채웁니다.
   */
  async function getJudgmentHistory(opts = {}) {
    const page = opts.page || 1;
    const size = opts.size || 20;

    if (!live('judge')) {
      const u = Store.current();
      const all = u ? u.history : [];
      const start = (page - 1) * size;
      return {
        ok: true,
        data: { items: all.slice(start, start + size), hasNext: all.length > start + size },
      };
    }

    const q = new URLSearchParams({ page: String(page), size: String(size) });
    if (opts.categoryId) q.set('categoryId', String(opts.categoryId));

    const res = await request(`${JUDGE_PATH}?${q}`);
    if (!res.ok) return res;

    const items = (res.data.items || []).map((it) => {
      const saved = Store.getResult(String(it.judgmentId));
      const title = (saved && saved.claim) || `판정 #${it.judgmentId}`;
      return {
        id: String(it.judgmentId),
        title: title.length > 24 ? title.slice(0, 24) + '…' : title,
        category: it.trustLevelLabel || '기타',
        categoryId: it.categoryId,
        status: LABEL_TO_HISTORY[it.trustLevelLabel] || 'vague',
        at: formatDate(it.createdAt),
      };
    });

    return { ok: true, data: { items, hasNext: Boolean(res.data.hasNext) } };
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} · ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  /**
   * 판정이 끝날 때까지 기다립니다.
   * PROCESSING 이면 잠깐 쉬었다가 다시 물어봅니다.
   */
  async function waitForJudgment(id, opts = {}) {
    const interval = opts.interval || 1500;
    const timeout = opts.timeout || 60000;
    const onTick = opts.onTick;
    const started = Date.now();

    while (Date.now() - started < timeout) {
      const res = await getJudgment(id);
      if (!res.ok) return res;

      if (res.data.status !== 'PROCESSING') return res;
      if (onTick) onTick(res.data);

      await delay(interval);
    }
    return toError('JUDGE_TIMEOUT');
  }

  /* ---------- 온보딩 ----------
     화면에서는 한글 라벨을 쓰고, 여기서 서버 값으로 바꿔 보냅니다.
     값이 주어진 항목만 담습니다(수정 때 일부만 보내기 위함). */
  function onboardingBody({ interests, ageRange, gender }) {
    const body = {};
    if (interests) {
      body.interestCategories = interests
        .map((l) => labelToValue(INTEREST_OPTIONS, l))
        .filter(Boolean);
    }
    if (ageRange) body.ageGroup = labelToValue(AGE_OPTIONS, ageRange);
    if (gender) body.gender = labelToValue(GENDER_OPTIONS, gender);
    return body;
  }

  function applyOnboarding(input, data) {
    const patch = {};
    if (input.interests) patch.interests = input.interests;
    if (input.ageRange) patch.ageRange = input.ageRange;
    if (input.gender) patch.gender = input.gender;
    if (data && data.onboardingCompleted !== undefined) {
      patch.onboardingCompleted = Boolean(data.onboardingCompleted);
    }
    Store.updateProfile(patch);
  }

  /**
   * 온보딩 정보 저장 (최초)
   *   POST /api/me/onboarding
   *   요청  { interestCategories:[...], ageGroup, gender }  — 모두 필수
   *   응답  201 { ..., onboardingCompleted:true }
   *         400 필수 값 누락·형식 오류 / 401 인증 / 500 서버 오류
   */
  async function saveOnboarding(input) {
    const body = onboardingBody(input);

    if (live('onboarding')) {
      const res = await request('/me/onboarding', {
        method: 'POST',
        body,
        statusMap: { 400: 'INVALID_INPUT' },
      });
      if (!res.ok) return res;
      applyOnboarding(input, res.data);
      return res;
    }

    await delay(80);
    applyOnboarding(input, { onboardingCompleted: true });
    return { ok: true, data: { ...body, onboardingCompleted: true } };
  }

  /**
   * 온보딩 정보 수정
   *   PATCH /api/me/onboarding
   *   요청  { interestCategories?, ageGroup?, gender? }  — 바꿀 것만
   *   응답  200 (2.1 과 같은 구조, 수정된 값 반영)
   *
   * 아직 최초 저장 전이면 POST 로 돌립니다.
   */
  async function updateOnboarding(input) {
    const me = Store.current();
    if (!me || !me.profile.onboardingCompleted) return saveOnboarding(input);

    const body = onboardingBody(input);

    if (live('onboarding')) {
      const res = await request('/me/onboarding', {
        method: 'PATCH',
        body,
        statusMap: { 400: 'INVALID_INPUT' },
      });
      if (!res.ok) return res;
      applyOnboarding(input, res.data);
      return res;
    }

    await delay(80);
    applyOnboarding(input, null);
    return { ok: true, data: body };
  }

  /**
   * 판정 결과 공유 링크 생성
   *   POST /api/judgments/{judgmentId}/share
   *   응답  201 { success:true, data:{ shareToken, shareUrl, imageUrl } }
   *         401 인증 / 403 남의 판정 / 404 없음 / 500 서버 오류
   */
  async function createShareLink(judgmentId) {
    if (!live('share')) {
      await delay(80);
      return {
        ok: true,
        data: {
          shareToken: 'mock-token',
          shareUrl: location.href,
          imageUrl: null,
        },
      };
    }

    return request(`${SHARE_PATH}/${encodeURIComponent(judgmentId)}/share`, {
      method: 'POST',
      statusMap: { 403: 'FORBIDDEN', 404: 'NOT_FOUND' },
    });
  }

  /**
   * 공유 피드에 게시
   *   POST /api/feed/posts
   *   요청  { judgmentId }
   *   응답  201 { success:true, data:{ postId:'p_5001', status:'PUBLISHED' } }
   *         400 검증되지 않은 판정 등 게시 불가 / 401 인증 / 404 판정 없음 / 500 서버 오류
   */
  async function publishToFeed(judgmentId) {
    if (!live('feed')) {
      await delay(80);
      return { ok: true, data: { postId: 'p_' + Date.now(), status: 'PUBLISHED' } };
    }

    return request('/feed/posts', {
      method: 'POST',
      body: { judgmentId: String(judgmentId) },
      statusMap: { 400: 'FEED_BLOCKED', 404: 'NOT_FOUND' },
    });
  }

  /* 라벨 → 피드 카드의 판정 결과 줄 */
  const LABEL_TO_RESULT = {
    '임상적 근거 있음': 'expert',
    '전문가 의견 있음': 'expert',
    판단보류: 'hold',
    '근거 부족': 'lack',
    '반박 근거 있음': 'lack',
  };

  /**
   * 공유 피드 전체 목록 조회
   *   GET /api/feed/posts?sort=&page=&size=
   *   sort  recent | popular (기본 recent)
   *   응답  200 { items:[{ postId, author:{userId,nickname}, trustLevelLabel,
   *              summary, likeCount, createdAt }], page, totalPages }
   *         401 인증 / 500 서버 오류
   */
  async function getFeedPosts(opts = {}) {
    const sort = opts.sort === 'popular' ? 'popular' : 'recent';
    const page = opts.page || 1;
    const size = opts.size || 20;

    if (!live('feed')) {
      await delay(80);
      const all = typeof FEED_CARDS !== 'undefined' ? FEED_CARDS : [];
      return { ok: true, data: { items: all, page: 1, totalPages: 1 } };
    }

    const q = new URLSearchParams({ sort, page: String(page), size: String(size) });
    const res = await request(`/feed/posts?${q}`);
    if (!res.ok) return res;

    return {
      ok: true,
      data: {
        page: res.data.page || page,
        totalPages: res.data.totalPages || 1,
        items: (res.data.items || []).map((it) => ({
          id: it.postId,
          author: (it.author && it.author.nickname) || '익명',
          authorId: it.author && it.author.userId,
          levelLabel: it.trustLevelLabel || '',
          result: LABEL_TO_RESULT[it.trustLevelLabel] || 'hold',
          summary: it.summary || '',
          likes: it.likeCount || 0,
          liked: Boolean(it.liked), // 서버가 안 주면 false 로 시작합니다
          createdAt: it.createdAt,
        })),
      },
    };
  }

  /**
   * 피드 게시물 좋아요 / 좋아요 취소
   *   좋아요   POST   /api/feed/posts/{postId}/like
   *   취소     DELETE /api/feed/posts/{postId}/like
   *   응답  200 { success:true, data:{ liked:true, likeCount:13 } }
   *         401 인증 / 404 게시물 없음 / 500 서버 오류
   *
   * @param {string}  postId
   * @param {boolean} liked  지금 눌러져 있는지 (true 면 취소로 보냅니다)
   */
  async function toggleLike(postId, liked) {
    const method = liked ? 'DELETE' : 'POST';

    if (!live('feed')) {
      await delay(80);
      return { ok: true, data: { liked: !liked, likeCount: liked ? 0 : 1 } };
    }

    return request(`/feed/posts/${encodeURIComponent(postId)}/like`, {
      method,
      statusMap: { 404: 'NOT_FOUND' },
    });
  }

  /**
   * 내가 올린 피드 게시물 목록
   *   GET /api/feed/posts/me?page=&size=
   *   응답  200 6.5 와 같은 구조, 본인 게시물만
   *         401 인증 / 500 서버 오류
   *
   * items 에 judgmentId 가 없어서, 공유 중지에 필요한 값은
   * 이 기기에 저장해 둔 카드에서 찾아 붙입니다.
   */
  async function getMyFeedPosts(opts = {}) {
    const page = opts.page || 1;
    const size = opts.size || 20;

    if (!live('feed')) {
      await delay(80);
      const u = Store.current();
      return {
        ok: true,
        data: { items: u ? u.cards : [], page: 1, totalPages: 1 },
      };
    }

    const q = new URLSearchParams({ page: String(page), size: String(size) });
    const res = await request(`/feed/posts/me?${q}`);
    if (!res.ok) return res;

    const mine = (Store.current() || { cards: [] }).cards;

    return {
      ok: true,
      data: {
        page: res.data.page || page,
        totalPages: res.data.totalPages || 1,
        items: (res.data.items || []).map((it) => {
          const local = mine.find((c) => c.postId === it.postId) || {};
          return {
            id: it.postId,
            postId: it.postId,
            judgmentId: it.judgmentId || local.judgmentId || null,
            title: local.title || it.summary || '',
            category: local.category || it.trustLevelLabel || '',
            date: formatDate(it.createdAt).split(' · ')[0],
            result: it.trustLevelLabel || '',
            likes: it.likeCount || 0,
          };
        }),
      },
    };
  }

  /**
   * 공유 링크 회수 (비활성화)
   *   DELETE /api/judgments/{judgmentId}/share
   *   응답  200 { success:true, data:null }
   *         401 인증 / 403 남의 판정 / 404 발급된 링크 없음 / 500 서버 오류
   *
   * 회수하면 그 링크로 들어온 사람은 410 을 받습니다.
   */
  async function revokeShareLink(judgmentId) {
    if (!live('share')) {
      await delay(80);
      return { ok: true, data: null };
    }

    return request(`${SHARE_PATH}/${encodeURIComponent(judgmentId)}/share`, {
      method: 'DELETE',
      statusMap: { 403: 'FORBIDDEN', 404: 'SHARE_NOT_FOUND' },
    });
  }

  /**
   * 공유 링크 공개 조회 (로그인 없이)
   *   GET /api/share/{shareToken}
   *   응답  200 3.2 와 같은 구조에서 작성자 정보 제외
   *         404 없는 링크 / 410 회수·만료된 링크 / 500 서버 오류
   */
  async function getSharedJudgment(shareToken) {
    if (!live('share')) {
      await delay(80);
      const saved = Store.getResult(String(shareToken));
      return saved ? { ok: true, data: saved } : toError('NOT_FOUND');
    }

    const res = await request(`/share/${encodeURIComponent(shareToken)}`, {
      auth: false, // 비회원도 볼 수 있는 링크입니다
      statusMap: { 404: 'NOT_FOUND', 410: 'SHARE_GONE' },
    });
    if (!res.ok) return res;

    return { ok: true, data: normalizeJudgment(res.data) };
  }

  /**
   * 오늘의 브리핑 조회
   *   GET /api/briefings/today
   *   응답  200 { success:true, data:{ date, items:[
   *              { briefingId, category, trustLevelLabel, title, summary, relatedArchiveId } ] } }
   *         401 인증 / 500 서버 오류
   *
   * 관심 카테고리와 판정 이력으로 매칭된 오늘의 카드 1~2건이 옵니다.
   */
  async function getTodayBriefing() {
    if (!live('briefing')) {
      await delay(80);
      return {
        ok: true,
        data: {
          date: new Date().toISOString().slice(0, 10),
          items: (typeof FEEDS !== 'undefined' ? FEEDS : []).slice(0, 2).map((f) => ({
            id: f.id,
            category: f.category,
            levelLabel: '판단보류',
            title: f.title,
            summary: f.desc,
            archiveId: null,
          })),
        },
      };
    }

    const res = await request('/briefings/today');
    if (!res.ok) return res;

    return {
      ok: true,
      data: {
        date: res.data.date,
        items: (res.data.items || []).map((it) => ({
          id: it.briefingId,
          category: valueToLabel(INTEREST_OPTIONS, it.category),
          levelLabel: it.trustLevelLabel || '',
          title: it.title || '',
          summary: it.summary || '',
          archiveId: it.relatedArchiveId || null,
        })),
      },
    };
  }

  /**
   * 토큰 재발급
   *   POST /api/auth/refresh
   *   헤더  Authorization: Bearer {accessToken}
   *         X-Refresh-Token: {refreshToken}
   *   응답  200 { success:true, data:{ accessToken, refreshToken }, error:null }
   *         400 형식 오류 / 401 만료·무효 / 500 서버 오류
   */
  /* 로그인이 풀렸을 때 화면에 한 번만 알립니다 */
  let expiredNotified = false;
  function notifySessionExpired() {
    if (expiredNotified) return;
    expiredNotified = true;
    try {
      window.dispatchEvent(new CustomEvent('drjudge:session-expired'));
    } catch (e) {}
  }

  let refreshing = null;

  async function refresh() {
    // 동시에 여러 요청이 401 을 받아도 재발급은 한 번만 합니다
    if (refreshing) return refreshing;

    refreshing = (async () => {
      const rt = getRefreshToken();
      if (!rt) return toError('SESSION_EXPIRED');

      try {
        const res = await fetch(BASE_URL + '/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken() || ''}`,
            'X-Refresh-Token': rt,
          },
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || json.success === false) {
          clearToken();
          Store.signOut();
          notifySessionExpired();
          return toError(res.status === 400 ? 'INVALID_INPUT' : 'SESSION_EXPIRED');
        }

        setTokens(json.data.accessToken, json.data.refreshToken);
        return { ok: true, data: json.data };
      } catch (e) {
        return toError('NETWORK_ERROR');
      } finally {
        refreshing = null;
      }
    })();

    return refreshing;
  }

  async function logout() {
    let server = null;

    if (live('login') && getToken()) {
      // 401 이 와도 재발급을 시도하지 않습니다 — 어차피 나가는 길이라서
      server = await request('/auth/logout', { method: 'POST', noRetry: true });
    }

    clearToken();
    Store.signOut();
    return { ok: true, server };
  }

  /**
   * 회원 탈퇴
   *   DELETE /api/auth/me
   *   헤더  Authorization: Bearer {accessToken}
   *   응답  200 { success:true, data:{ withdrawnAt:"..." }, error:null }
   *         401 인증 필요·토큰 만료 / 500 서버 오류
   *
   * 성공하면 이 기기에 저장된 계정 데이터도 함께 지웁니다.
   */
  async function withdraw() {
    const id = Store.currentId();
    if (!id) return toError('SESSION_EXPIRED');

    if (live('login')) {
      const res = await request('/auth/me', { method: 'DELETE', noRetry: true });
      if (!res.ok) return res;

      clearToken();
      Store.removeAccount(id);
      return { ok: true, data: res.data };
    }

    clearToken();
    Store.removeAccount(id);
    return { ok: true, data: { withdrawnAt: new Date().toISOString() } };
  }

  return {
    LIVE,
    login,
    signup,
    checkDuplicate,
    requestJudge,
    getJudgment,
    getJudgmentHistory,
    getTodayBriefing,
    createShareLink,
    getSharedJudgment,
    revokeShareLink,
    publishToFeed,
    getFeedPosts,
    getMyFeedPosts,
    toggleLike,
    waitForJudgment,
    saveOnboarding,
    updateOnboarding,
    logout,
    withdraw,
    refresh,
    getToken,
    getRefreshToken,
    ERROR_MESSAGE,
  };
})();
