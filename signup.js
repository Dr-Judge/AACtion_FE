/* ============================================
   Dr.Judge — 회원가입 (2단계)
   1단계 이름·닉네임·이메일  →  2단계 아이디·비밀번호·약관
   ============================================ */

(function () {
  const TOTAL_STEPS = 4;

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

  // 3단계 : 성별 · 연령대
  const step3El = document.getElementById('step3');
  const nextBtn3 = document.getElementById('nextBtn3');
  const alert3 = document.getElementById('step3Alert');
  const genderPicker = document.getElementById('genderPicker');
  const genderBtn = document.getElementById('genderBtn');
  const genderList = document.getElementById('genderList');
  const genderLabel = document.getElementById('genderLabel');
  const ageList = document.getElementById('ageList');
  let gender = null;
  let ageRange = null;

  // 4단계 : 관심 분야
  const step4El = document.getElementById('step4');
  const doneBtn = document.getElementById('doneBtn');

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
    step4El.hidden = n !== 4;
    progressBar.style.width = `${(n / TOTAL_STEPS) * 100}%`;
    progress.setAttribute('aria-valuenow', String(n));
    window.scrollTo(0, 0);
  }

  backBtn.addEventListener('click', () => {
    if (step === 1) location.href = './start.html';
    else goStep(step - 1);
  });

  /* ---------- 3단계 : 성별 · 연령대 ---------- */
  function closeGender() {
    genderList.hidden = true;
    genderBtn.setAttribute('aria-expanded', 'false');
  }

  genderBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = genderList.hidden;
    genderList.hidden = !open;
    genderPicker.classList.toggle('is-open', open);
    genderBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!genderPicker.contains(e.target)) {
      closeGender();
      genderPicker.classList.remove('is-open');
    }
  });

  genderList.querySelectorAll('.picker__opt').forEach((opt) => {
    opt.addEventListener('click', () => {
      gender = opt.dataset.value;
      genderLabel.textContent = gender;
      genderPicker.classList.add('is-selected');
      genderPicker.classList.remove('is-error', 'is-open');
      genderList
        .querySelectorAll('.picker__opt')
        .forEach((o) => o.classList.toggle('is-selected', o === opt));
      closeGender();
      updateStep3();
    });
  });

  ageList.querySelectorAll('.agelist__opt').forEach((opt) => {
    opt.addEventListener('click', () => {
      ageRange = opt.dataset.value;
      ageList
        .querySelectorAll('.agelist__opt')
        .forEach((o) => o.classList.toggle('is-selected', o === opt));
      ageList.classList.remove('is-error');
      updateStep3();
    });
  });

  function updateStep3() {
    nextBtn3.classList.toggle('is-ready', Boolean(gender && ageRange));
  }

  nextBtn3.addEventListener('click', () => {
    alert3.hidden = true;

    // 버튼은 눌리되, 안 고른 항목이 있으면 알려주고 넘어가지 않습니다
    genderPicker.classList.toggle('is-error', !gender);
    ageList.classList.toggle('is-error', !ageRange);
    if (!gender || !ageRange) {
      alert3.textContent = '성별과 연령대를 모두 선택해 주세요.';
      alert3.hidden = false;
      return;
    }

    // 성별·연령대는 모아뒀다가 4단계에서 관심분야와 함께 한 번에 저장합니다
    Object.assign(draft, { gender, ageRange });
    goStep(4);
  });

  /* ---------- 4단계 : 관심 분야 (다중 선택) ---------- */
  const interestList = document.getElementById('interestList');
  const alert4 = document.getElementById('step4Alert');
  const interests = new Set();

  interestList.querySelectorAll('.optlist__opt').forEach((opt) => {
    opt.addEventListener('click', () => {
      const v = opt.dataset.value;
      if (interests.has(v)) interests.delete(v);
      else interests.add(v);

      opt.classList.toggle('is-selected', interests.has(v));
      interestList.classList.remove('is-error');
      alert4.hidden = true;
      doneBtn.classList.toggle('is-ready', interests.size > 0);
    });
  });

  /* 분야별 설명 아코디언 — 한 번에 하나만 열림 */
  const accordions = [...step4El.querySelectorAll('[data-acc]')];
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
    alert4.hidden = true;

    if (interests.size === 0) {
      interestList.classList.add('is-error');
      alert4.textContent = '희망 분야를 하나 이상 선택해 주세요.';
      alert4.hidden = false;
      return;
    }

    setLoading(doneBtn, true, '저장 중…');
    const res = await API.saveOnboarding({
      interests: [...interests],
      ageRange: draft.ageRange,
      gender: draft.gender,
    });
    setLoading(doneBtn, false, '완료');

    if (!res.ok) {
      alert4.textContent = res.text;
      alert4.hidden = false;
      return;
    }
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
    if (!form2.validateAll()) return;
    if (!agree.checked) {
      alert2.textContent = '이용약관 및 개인정보 처리방침에 동의해 주세요.';
      alert2.hidden = false;
      return;
    }

    setLoading(signupBtn, true, '가입 중…');
    const v = form2.values();
    const res = await API.signup({
      ...draft,
      userId: v.userId.trim(),
      password: v.password,
    });
    setLoading(signupBtn, false, '가입 완료');

    if (res.ok) {
      goStep(3); // 성별 · 연령대로
      return;
    }

    if (res.field || res.fields) form2.applyApiError(res);
    else {
      alert2.textContent = res.text;
      alert2.hidden = false;
    }
  });

  function setLoading(btn, on, label) {
    btn.textContent = label;
    btn.disabled = on; // 통신 중에만 잠급니다
    if (on || btn === doneBtn) return;
    (btn === nextBtn ? form1 : form2).updateSubmit();
  }

  goStep(1);
})();
