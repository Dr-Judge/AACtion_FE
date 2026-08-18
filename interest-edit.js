/* ============================================
   Dr.Judge — 관심분야 변경 (여러 개 선택)
   ============================================ */

(function () {
  if (!requireLogin()) return;

  const list = document.getElementById('interestList');
  const error = document.getElementById('interestError');
  const saveBtn = document.getElementById('saveBtn');

  const me = Store.current();
  if (!me) {
    location.replace('./login.html');
    return;
  }

  /* 지금 설정된 분야들을 먼저 표시합니다 */
  const picked = new Set(
    me.profile.interests || (me.profile.interest ? [me.profile.interest] : []),
  );

  const options = [...list.querySelectorAll('.optlist__opt')];
  options.forEach((o) =>
    o.classList.toggle('is-selected', picked.has(o.dataset.value)),
  );

  options.forEach((opt) => {
    opt.addEventListener('click', () => {
      const v = opt.dataset.value;
      if (picked.has(v)) picked.delete(v);
      else picked.add(v);

      opt.classList.toggle('is-selected', picked.has(v));
      list.classList.remove('is-error');
      error.hidden = true;
      update();
    });
  });

  function update() {
    saveBtn.classList.toggle('is-ready', picked.size > 0);
  }

  /* 버튼은 항상 눌리고, 하나도 안 고르면 알려줍니다 */
  saveBtn.addEventListener('click', async () => {
    if (picked.size === 0) {
      list.classList.add('is-error');
      error.hidden = false;
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중…';

    // 바꾼 것만 보냅니다 (PATCH)
    const res = await API.updateOnboarding({ interests: [...picked] });

    saveBtn.disabled = false;
    saveBtn.textContent = '변경하기';

    if (!res.ok) {
      error.textContent = res.text;
      error.hidden = false;
      return;
    }
    location.href = './profile-edit.html';
  });

  update();
})();
