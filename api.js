/* ============================================
   Dr.Judge — API 래퍼
   백엔드 연동 시 이 파일만 수정하면 됩니다.

   1) BASE_URL 을 실제 서버 주소로 변경
   2) USE_MOCK 을 false 로 변경
   3) 서버 응답 스펙이 다르면 normalize() / ERROR_MESSAGE 만 수정
   ============================================ */

const API = (() => {
  const BASE_URL = 'http://localhost:8080/api';
  const USE_MOCK = true; // ← 백엔드 붙이면 false
  const TIMEOUT = 8000;

  /* ---------- 켜고 끌 수 있는 기능 ----------
     false 로 두면 화면에서 카카오 버튼이 자동으로 사라집니다. */
  const FEATURES = {
    kakaoLogin: true,
  };

  /* ---------- 카카오 로그인 설정 ----------
     연동 순서
       1. https://developers.kakao.com 에서 앱 생성
       2. REST API 키를 clientId 에 입력
       3. 카카오 개발자 콘솔 > 카카오 로그인 > Redirect URI 에
          아래 redirectUri 와 똑같은 주소를 등록
       4. 서버에 POST /auth/kakao 구현
          (받은 code 로 카카오에 토큰 요청 → 우리 서비스 토큰 발급)

     주의: 클라이언트 시크릿은 절대 이 파일에 넣지 마세요. 서버에만 둡니다. */
  const KAKAO = {
    clientId: 'YOUR_KAKAO_REST_API_KEY',
    redirectUri: location.origin + '/kakao-callback.html',
    authUrl: 'https://kauth.kakao.com/oauth/authorize',
  };

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
    NETWORK_ERROR: { field: null, text: '네트워크 연결을 확인해 주세요.' },
    UNKNOWN: { field: null, text: '잠시 후 다시 시도해 주세요.' },
  };

  function toError(code) {
    return { ok: false, code, ...(ERROR_MESSAGE[code] || ERROR_MESSAGE.UNKNOWN) };
  }

  /* ---------- 공통 fetch ---------- */
  async function request(path, { method = 'GET', body, auth = true } = {}) {
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) return toError(data.code || 'UNKNOWN');
      return { ok: true, data };
    } catch (e) {
      return toError(e.name === 'AbortError' ? 'NETWORK_ERROR' : 'NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- 토큰 보관 ----------
     주의: 브라우저 저장소 대신 메모리에 보관합니다.
     실제 서비스에서는 httpOnly 쿠키 사용을 권장합니다. */
  let accessToken = null;
  const getToken = () => accessToken;
  const setToken = (t) => {
    accessToken = t;
  };
  const clearToken = () => {
    accessToken = null;
  };

  /* ---------- 목 데이터 ---------- */
  const MOCK_USERS = [
    { userId: 'drjudge', password: 'test1234', nickname: '건강한일상' },
  ];
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ============================================
     화면에서 호출하는 함수들
     ============================================ */

  /** 로그인 — 성공: {ok:true, data:{token, user}} / 실패: {ok:false, code, field, text} */
  async function login({ userId, password }) {
    if (!USE_MOCK) {
      const res = await request('/auth/login', {
        method: 'POST',
        body: { userId, password },
        auth: false,
      });
      if (res.ok) {
        setToken(res.data.token);
        // 서버에서 받은 프로필로 계정 저장소를 채웁니다
        Store.signIn(userId, res.data.user);
        Store.hydrate(res.data);
      }
      return res;
    }

    await delay(120);

    // 목 모드에서는 어떤 아이디로도 로그인됩니다 (화면 확인용).
    // 오류 화면을 보고 싶을 때만 아래 계정을 쓰세요.
    //   아이디 error    → 아이디 오류
    //   비밀번호 wrong  → 비밀번호 오류
    if (userId === 'error') return toError('USER_NOT_FOUND');
    if (password === 'wrong') return toError('INVALID_PASSWORD');

    setToken('mock-token');
    const { user } = Store.signIn(userId);
    return { ok: true, data: { token: 'mock-token', user: user.profile } };
  }

  /** 회원가입 */
  async function signup(payload) {
    if (!USE_MOCK) {
      const res = await request('/auth/signup', {
        method: 'POST',
        body: payload,
        auth: false,
      });
      // 서버가 가입 응답에 토큰을 주면 자동 로그인 처리
      if (res.ok && res.data.token) {
        setToken(res.data.token);
        Store.signIn(payload.userId, payload);
      }
      return res;
    }

    await delay(150);
    if (MOCK_USERS.some((u) => u.userId === payload.userId)) {
      return toError('DUPLICATE_USER_ID');
    }
    MOCK_USERS.push(payload);

    // 가입 직후 바로 로그인 상태가 되도록 토큰을 발급합니다.
    setToken('mock-token');
    Store.signIn(payload.userId, payload); // 이름·닉네임·이메일 저장
    return { ok: true, data: { token: 'mock-token', userId: payload.userId } };
  }

  /** 중복 확인 — field: 'userId' | 'nickname' | 'email' */
  async function checkDuplicate(field, value) {
    if (!USE_MOCK) {
      return request(
        `/auth/check?field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`,
        { auth: false },
      );
    }

    await delay(80);
    const taken = {
      userId: ['drjudge', 'admin'],
      nickname: ['건강한일상'],
      email: ['dr.judge@g.eulji.ac.kr'],
    };
    if ((taken[field] || []).includes(value)) {
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

  /** 판정 요청 — payload: { type:'text'|'image'|'link', ... } */
  let mockCount = 0;
  const DAILY_MAX = 3; // 목 모드 하루 한도 (모달 확인용)

  async function requestJudge(payload) {
    if (!USE_MOCK) {
      return request('/judge', { method: 'POST', body: payload });
    }

    await delay(300);
    if (mockCount >= DAILY_MAX) return toError('DAILY_LIMIT');
    mockCount += 1;

    const title =
      payload.text || payload.url || payload.fileName || '판정 요청';
    Store.addHistory({
      category: '기타',
      title: title.length > 24 ? title.slice(0, 24) + '…' : title,
      status: 'vague',
    });
    return { ok: true, data: { id: 'j' + Date.now(), ...payload } };
  }

  /** 관심 분야 저장 */
  async function saveInterest(interest) {
    if (!USE_MOCK) {
      const res = await request('/users/me/interest', {
        method: 'PATCH',
        body: { interest },
      });
      if (res.ok) Store.updateProfile({ interest });
      return res;
    }
    await delay(80);
    Store.updateProfile({ interest });
    return { ok: true, data: { interest } };
  }

  /* ============================================
     카카오 로그인
     ============================================ */

  /** 카카오 인증 페이지로 이동 (버튼에서 호출) */
  function startKakaoLogin() {
    // CSRF 방지용 state — 리다이렉트 후 콜백에서 대조합니다
    const state = Math.random().toString(36).slice(2);
    sessionStorage.setItem('kakao_state', state);

    if (USE_MOCK) {
      // 목 모드에서는 카카오를 거치지 않고 콜백 화면으로 바로 이동
      location.href = `./kakao-callback.html?code=mock-code&state=${state}`;
      return;
    }

    const q = new URLSearchParams({
      client_id: KAKAO.clientId,
      redirect_uri: KAKAO.redirectUri,
      response_type: 'code',
      state,
    });
    location.href = `${KAKAO.authUrl}?${q}`;
  }

  /**
   * 콜백 화면에서 호출 — 카카오가 준 code 를 서버로 넘겨 우리 토큰을 받습니다.
   * 성공: { ok:true, data:{ token, user, isNewUser } }
   *   isNewUser 가 true 면 닉네임·관심분야 입력 단계로 보냅니다.
   */
  async function loginWithKakao(code, state) {
    const saved = sessionStorage.getItem('kakao_state');
    sessionStorage.removeItem('kakao_state');
    if (state && saved && state !== saved) return toError('UNKNOWN');

    if (!USE_MOCK) {
      const res = await request('/auth/kakao', {
        method: 'POST',
        body: { code, redirectUri: KAKAO.redirectUri },
        auth: false,
      });
      if (res.ok) setToken(res.data.token);
      return res;
    }

    await delay(150);
    setToken('mock-kakao-token');
    const { isNew, user } = Store.signIn('kakao_user');
    return {
      ok: true,
      data: { token: 'mock-kakao-token', user: user.profile, isNewUser: isNew },
    };
  }

  async function logout() {
    if (!USE_MOCK) await request('/auth/logout', { method: 'POST' });
    clearToken();
    Store.signOut(); // 계정 데이터는 남기고 세션만 끊습니다
    return { ok: true };
  }

  return {
    login,
    signup,
    checkDuplicate,
    requestJudge,
    saveInterest,
    startKakaoLogin,
    loginWithKakao,
    FEATURES,
    logout,
    getToken,
    ERROR_MESSAGE,
  };
})();
