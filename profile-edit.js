/* ============================================
   Dr.Judge — 내 정보 수정
   spec: 1 뒤로가기 / 2 카메라 / 2-1 사진 팝업 / 3 닉네임
   ============================================ */

(function () {
  const img = document.getElementById('avatarImg');
  const camBtn = document.getElementById('camBtn');
  const menu = document.getElementById('photoMenu');
  const album = document.getElementById('albumInput');
  const file = document.getElementById('fileInput');

  const me = Store.current();
  if (!me) {
    location.replace('./login.html');
    return;
  }

  /* 저장된 내 정보 표시 */
  const p = me.profile;
  document.getElementById('nickValue').textContent = p.nickname;
  document.getElementById('stuValue').textContent = p.studentNo || '—';
  document.getElementById('mailValue').textContent = p.email || '—';
  if (p.avatar) img.style.backgroundImage = `url(${p.avatar})`;

  /* 2. 카메라 → 2-1 팝업 */
  const open = () => {
    menu.hidden = false;
    camBtn.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    menu.hidden = true;
    camBtn.setAttribute('aria-expanded', 'false');
  };

  camBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden ? open() : close();
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== camBtn) close();
  });

  /* 2-1. 사진 보관함 → 앨범, 파일 선택 → 파일 */
  menu.querySelectorAll('[data-pick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      close();
      (btn.dataset.pick === 'album' ? album : file).click();
    });
  });

  [album, file].forEach((input) => {
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if (!f || !f.type.startsWith('image/')) return;

      // 새로고침해도 남도록 데이터 URL 로 보관합니다.
      // 서버 연동 시에는 이 자리에서 업로드 후 받은 URL 을 저장하세요.
      const reader = new FileReader();
      reader.onload = () => {
        img.style.backgroundImage = `url(${reader.result})`;
        Store.updateProfile({ avatar: reader.result });
      };
      reader.readAsDataURL(f);
    });
  });
})();
