/* ============================================
   Dr.Judge — 내 정보 수정
   spec: 1 뒤로가기 / 2 카메라 아이콘 / 2-1 사진 팝업 / 3 닉네임
   ============================================ */

(function () {
  const img = document.getElementById('avatarImg');
  const camBtn = document.getElementById('camBtn');
  const menu = document.getElementById('photoMenu');
  const album = document.getElementById('albumInput');
  const file = document.getElementById('fileInput');

  /* 저장된 내 정보 표시 */
  document.getElementById('nickValue').textContent = ME.nickname;
  document.getElementById('stuValue').textContent = ME.studentNo;
  document.getElementById('mailValue').textContent = ME.email;
  if (ME.avatar) img.style.backgroundImage = `url(${ME.avatar})`;

  /* 2. 카메라 아이콘 → 2-1 팝업 */
  function openMenu() {
    menu.hidden = false;
    camBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    menu.hidden = true;
    camBtn.setAttribute('aria-expanded', 'false');
  }

  camBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden ? openMenu() : closeMenu();
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== camBtn) closeMenu();
  });

  /* 2-1. 사진 보관함 → 앨범, 파일 선택 → 파일 */
  menu.querySelectorAll('[data-pick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeMenu();
      (btn.dataset.pick === 'album' ? album : file).click();
    });
  });

  [album, file].forEach((input) => {
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if (!f || !f.type.startsWith('image/')) return;

      const url = URL.createObjectURL(f);
      img.style.backgroundImage = `url(${url})`;
      ME.avatar = url;
      // TODO: 서버 업로드 연동 지점 (multipart/form-data)
    });
  });
})();
