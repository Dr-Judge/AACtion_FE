/* ============================================
   Dr.Judge — 카카오 로그인 콜백
   카카오가 ?code=... 를 붙여 이 화면으로 돌려보냅니다.
   ============================================ */

(function () {
  const statusText = document.getElementById('statusText');
  const alertEl = document.getElementById('callbackAlert');
  const retry = document.getElementById('retryLink');

  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const state = params.get('state');
  const denied = params.get('error'); // 사용자가 동의를 취소한 경우

  function fail(text) {
    statusText.textContent = '로그인하지 못했어요';
    alertEl.textContent = text;
    alertEl.hidden = false;
    retry.hidden = false;
  }

  (async () => {
    if (denied) return fail('카카오 로그인을 취소했어요.');
    if (!code) return fail('인증 정보를 받지 못했어요. 다시 시도해 주세요.');

    const res = await API.loginWithKakao(code, state);
    if (!res.ok) return fail(res.text);

    // 처음 온 사용자면 닉네임·관심분야를 채우는 회원가입 단계로
    location.replace(res.data.isNewUser ? './signup.html?social=kakao' : './home.html');
  })();
})();
