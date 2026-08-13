/* ============================================
   Dr.Judge — 마이페이지
   포인트 · 판정 이력 · 나의 공유 카드
   ============================================ */

(function () {
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const won = (n) => n.toLocaleString('ko-KR');

  /* ---------- 1. 프로필 ---------- */
  document.getElementById('myNickname').textContent = ME.nickname;
  if (ME.avatar) {
    document.getElementById('avatar').style.backgroundImage = `url(${ME.avatar})`;
  }

  /* ---------- 탭 전환 ---------- */
  const tabs = document.getElementById('myTabs');
  const panels = [...document.querySelectorAll('[data-panel]')];

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.mtabs__item');
    if (!btn) return;
    tabs
      .querySelectorAll('.mtabs__item')
      .forEach((b) => b.classList.toggle('is-active', b === btn));
    panels.forEach((p) => (p.hidden = p.dataset.panel !== btn.dataset.tab));
  });

  /* ---------- 포인트 ---------- */
  document.getElementById('pointValue').textContent = won(ME.point) + 'P';
  document.getElementById('pointLog').innerHTML = POINT_LOGS.map(
    (p) => `
    <li class="pointlog__item">
      <span class="pointlog__text">
        <b>${esc(p.label)}</b>
        <span>${esc(p.at)}</span>
      </span>
      <span class="pointlog__amount">+${won(p.amount)}P</span>
    </li>`,
  ).join('');

  /* ---------- 판정 이력 ---------- */
  const counts = JUDGE_HISTORY.reduce(
    (a, h) => ((a[h.status] = (a[h.status] || 0) + 1), a),
    {},
  );
  document.getElementById('statRow').innerHTML = `
    <div class="statrow__item"><b>${JUDGE_HISTORY.length}</b><span>전체 판정</span></div>
    <div class="statrow__item is-fit"><b>${counts.fit || 0}</b><span>적합</span></div>
    <div class="statrow__item is-vague"><b>${counts.vague || 0}</b><span>애매</span></div>
    <div class="statrow__item is-unfit"><b>${counts.unfit || 0}</b><span>부적합</span></div>`;

  document.getElementById('historyList').innerHTML = JUDGE_HISTORY.map((h) => {
    const s = HISTORY_STATUS[h.status];
    return `
    <li class="hitem">
      <span class="hitem__thumb" aria-hidden="true">+</span>
      <span class="hitem__text">
        <span class="hitem__cat">${esc(h.category)}</span>
        <b class="hitem__title">${esc(h.title)}</b>
        <span class="hitem__date">${esc(h.at)}</span>
      </span>
      <span class="hitem__status is-${h.status}">
        <b>${s.mark} ${s.label}</b>
        <span>${s.hint}</span>
      </span>
    </li>`;
  }).join('');

  /* ---------- 나의 공유 카드 ---------- */
  const myCards = document.getElementById('myCards');
  let cards = MY_CARDS.slice();

  function renderCards() {
    document.getElementById('cardCount').textContent = cards.length;
    myCards.innerHTML = cards
      .map(
        (c) => `
      <li class="mycard" data-id="${c.id}">
        <div class="mycard__top">
          <span>${esc(c.category)}</span>
          <span>${esc(c.date)}</span>
        </div>
        <h3 class="mycard__title">“${esc(c.title)}”</h3>
        <p class="mycard__done">
          <span class="mycard__dot" aria-hidden="true"></span> 판정 완료
        </p>
        <div class="mycard__result">
          <span class="mycard__bullet" aria-hidden="true"></span>
          <span>판정 결과<b>${esc(c.result)}</b></span>
        </div>
        <div class="mycard__foot">
          <span class="pcard__like">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
              <path d="M12 20s-7.2-4.4-7.2-9.3A4.2 4.2 0 0 1 12 8.1a4.2 4.2 0 0 1 7.2 2.6C19.2 15.6 12 20 12 20Z" />
            </svg>
            ${c.likes}
          </span>
          <a href="./feed-detail.html?id=${encodeURIComponent(c.id)}" class="mycard__view">공유 카드 보기 ›</a>
          <button type="button" class="mycard__del" data-del="${c.id}" aria-label="삭제">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />
            </svg>
          </button>
        </div>
      </li>`,
      )
      .join('');

    myCards.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('이 공유 카드를 삭제할까요?')) return;
        cards = cards.filter((c) => c.id !== btn.dataset.del);
        renderCards();
      });
    });
  }
  renderCards();

  /* ---------- 설정 ---------- */
  document.getElementById('settingBtn').addEventListener('click', async () => {
    if (!confirm('로그아웃할까요?')) return;
    await API.logout();
    location.href = './start.html';
  });
})();
