/* ============================================
   Dr.Judge — 회원가입 (2단계)
   1단계 이름·닉네임·이메일  →  2단계 아이디·비밀번호·약관
   ============================================ */

(function () {
  const TOTAL_STEPS = 3;

  const progress = document.getElementById('progress');
  const progressBar = document.getElementById('progressBar');
  const backBtn = document.getElementById('backBtn');

  const step1El = document.getElementById('step1');
  const step2El = document.getElementById('step2');
  const nextBtn = document.getElementById('nextBtn');
  const signupBtn = document.getElementById('signupBtn');
  const agree = document.getElementById('agree');
  const alert1 = document.getElementById('step1Alert');
  const alert2 = document.getElementById('step2Alert');

  const step3El = document.getElementById('step3');
  const doneBtn = document.getElementById('doneBtn');
  const picker = document.getElementById('interestPicker');
  const pickerBtn = document.getElementById('interestBtn');
  const pickerList = document.getElementById('interestList');
  const pickerLabel = document.getElementById('interestLabel');
  let interest = null;

  let step = 1;
  const draft = {}; // 단계별 입력값 보관

  const form1 = createForm(step1El, { submitBtn: nextBtn });
  const form2 = createForm(step2El, {
    submitBtn: signupBtn,
    canSubmit: () => agree.checked, // 약관에 동의해야 활성화
  });

  initPasswordToggles(step2El);

  agree.addEventListener('change', () => form2.updateSubmit());

  /* ---------- 단계 이동 ---------- */
  function goStep(n) {
    step = n;
    step1El.hidden = n !== 1;
    step2El.hidden = n !== 2;
    step3El.hidden = n !== 3;
    progressBar.style.width = `${(n / TOTAL_STEPS) * 100}%`;
    progress.setAttribute('aria-valuenow', String(n));
    window.scrollTo(0, 0);
  }

  backBtn.addEventListener('click', () => {
    if (step === 1) location.href = './start.html';
    else goStep(step - 1);
  });

  /* ---------- 3단계 : 관심 분야 선택 ---------- */
  function openPicker() {
    pickerList.hidden = false;
    picker.classList.add('is-open');
    pickerBtn.setAttribute('aria-expanded', 'true');
  }
  function closePicker() {
    pickerList.hidden = true;
    picker.classList.remove('is-open');
    pickerBtn.setAttribute('aria-expanded', 'false');
  }

  pickerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pickerList.hidden ? openPicker() : closePicker();
  });
  document.addEventListener('click', (e) => {
    if (!picker.contains(e.target)) closePicker();
  });

  pickerList.querySelectorAll('.picker__opt').forEach((opt) => {
    opt.addEventListener('click', () => {
      interest = opt.dataset.value;
      pickerLabel.textContent = interest;
      picker.classList.add('is-selected');
      pickerList
        .querySelectorAll('.picker__opt')
        .forEach((o) => o.classList.toggle('is-selected', o === opt));
      closePicker();
      doneBtn.disabled = false;
    });
  });

  /* 분야별 설명 아코디언 — 한 번에 하나만 열림 */
  const accordions = [...step3El.querySelectorAll('[data-acc]')];
  accordions.forEach((acc) => {
    const head = acc.querySelector('.accordion__head');
    const panel = acc.querySelector('.accordion__panel');
    head.addEventListener('click', () => {
      const willOpen = panel.hidden;
      accordions.forEach((a) => {
        a.classList.remove('is-open');
        a.querySelector('.accordion__panel').hidden = true;
      });
      if (willOpen) {
        acc.classList.add('is-open');
        panel.hidden = false;
      }
    });
  });

  doneBtn.addEventListener('click', async () => {
    if (!interest) return;
    setLoading(doneBtn, true, '저장 중…');
    await API.saveInterest(interest);
    location.href = './welcome.html';
  });

  /* ---------- 1단계 제출 ---------- */
  step1El.addEventListener('submit', async (e) => {
    e.preventDefault();
    alert1.hidden = true;
    if (!form1.validateAll()) return;

    setLoading(nextBtn, true, '확인 중…');
    const v = form1.values();

    // 닉네임 · 이메일 중복 확인
    const [nick, mail] = await Promise.all([
      API.checkDuplicate('nickname', v.nickname.trim()),
      API.checkDuplicate('email', v.email.trim()),
    ]);
    setLoading(nextBtn, false, '계속하기');

    if (!nick.ok) return form1.applyApiError(nick);
    if (!mail.ok) return form1.applyApiError(mail);

    Object.assign(draft, {
      name: v.name.trim(),
      nickname: v.nickname.trim(),
      email: v.email.trim(),
    });
    goStep(2);
  });

  /* ---------- 2단계 제출 ---------- */
  step2El.addEventListener('submit', async (e) => {
    e.preventDefault();
    alert2.hidden = true;
    if (!form2.validateAll() || !agree.checked) return;

    setLoading(signupBtn, true, '가입 중…');
    const v = form2.values();
    const res = await API.signup({
      ...draft,
      userId: v.userId.trim(),
      password: v.password,
    });
    setLoading(signupBtn, false, '가입 완료');

    if (res.ok) {
      goStep(3); // 관심 분야 선택으로
      return;
    }

    if (res.field) form2.applyApiError(res);
    else {
      alert2.textContent = res.text;
      alert2.hidden = false;
    }
  });

  function setLoading(btn, on, label) {
    btn.textContent = label;
    btn.disabled = on;
    if (on || btn === doneBtn) return;
    (btn === nextBtn ? form1 : form2).updateSubmit();
  }

  goStep(1);
})();
