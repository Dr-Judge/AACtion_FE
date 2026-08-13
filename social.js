/* ============================================
   Dr.Judge — 소셜 로그인 버튼
   <div class="social" data-social></div> 자리에 그려집니다.
   API.FEATURES.kakaoLogin 이 false 면 아무것도 그리지 않습니다.
   ============================================ */

function renderSocialLogin(root = document) {
  root.querySelectorAll('[data-social]').forEach((box) => {
    if (!API.FEATURES.kakaoLogin) {
      box.remove();
      return;
    }

    const label = box.dataset.social === 'signup' ? '카카오로 시작하기' : '카카오로 로그인';

    box.innerHTML = `
      <div class="social__divider"><span>또는</span></div>
      <button type="button" class="social__btn social__btn--kakao">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 3.6c-4.7 0-8.5 2.9-8.5 6.6 0 2.3 1.5 4.4 3.8 5.6l-.9 3.4c-.1.3.2.5.5.4l4-2.6c.4 0 .7.1 1.1.1 4.7 0 8.5-3 8.5-6.9S16.7 3.6 12 3.6Z" />
        </svg>
        ${label}
      </button>
    `;

    box
      .querySelector('.social__btn--kakao')
      .addEventListener('click', () => API.startKakaoLogin());
  });
}

document.addEventListener('DOMContentLoaded', () => renderSocialLogin());
