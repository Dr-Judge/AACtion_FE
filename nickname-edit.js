/* ============================================
   Dr.Judge — 닉네임 변경
   spec: 3-2 입력 / 3-3 변경하기 / 3-4 오류
   ============================================ */

(function () {
  if (!requireLogin()) return;

  const box = document.getElementById('nickBox');
  const input = document.getElementById('nickInput');
  const error = document.getElementById('nickError');
  const saveBtn = document.getElementById('saveBtn');

  const me = Store.current();
  if (!me) {
    location.replace('./login.html');
    return;
  }

  /* 3-2. 기존 닉네임 표시 */
  input.value = me.profile.nickname;

  const isValid = (v) => v.trim().length >= 2 && v.trim().length <= 10;

  /* 3-3. 2~10자일 때만 버튼 색이 바뀝니다 (버튼은 항상 눌립니다) */
  function update() {
    saveBtn.classList.toggle('is-ready', isValid(input.value));
  }

  input.addEventListener('input', () => {
    box.classList.remove('is-error');
    error.hidden = true;
    update();
  });

  /* 3-4. 조건을 못 채우면 빨간 테두리 + 문구 */
  input.addEventListener('blur', () => {
    if (input.value.length === 0) return;
    const bad = !isValid(input.value);
    box.classList.toggle('is-error', bad);
    error.hidden = !bad;
  });

  saveBtn.addEventListener('click', () => {
    // 3-4. 조건을 못 채웠으면 빨간 테두리 + 문구만 띄우고 넘어가지 않습니다
    if (!isValid(input.value)) {
      box.classList.add('is-error');
      error.hidden = false;
      return;
    }
    Store.updateProfile({ nickname: input.value.trim() });
    location.href = './profile-edit.html';
  });

  update();
})();
