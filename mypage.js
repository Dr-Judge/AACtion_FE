/* ============================================
   Dr.Judge — 마이페이지
   모든 값은 로그인한 계정의 데이터(Store)에서 읽습니다.
   ============================================ */

(function () {
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const num = (n) => n.toLocaleString('ko-KR');

  const app = document.querySelector('.mypage');
  const me = Store.current();

  /* ---------- 로그인 안 된 상태 ---------- */
  if (!me) {
    document.querySelector('.profile2').hidden = true;
    document.querySelector('.mtabs').hidden = true;
    document.querySelector('.scroll-area').innerHTML = `
      <div class="empty empty--page">
        <p class="empty__title">로그인이 필요해요</p>
        <p class="empty__desc">로그인하면 판정 이력과 포인트를<br />여기에서 확인할 수 있어요.</p>
        <a href="./login.html" class="empty__btn">로그인하기</a>
      </div>`;
    return;
  }

  /* ---------- 프로필 ---------- */
  document.getElementById('myNickname').textContent = me.profile.nickname;
  if (me.profile.avatar) {
    document.getElementById('avatar').style.backgroundImage = `url(${me.profile.avatar})`;
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

  const empty = (title, desc) =>
    `<li class="empty"><p class="empty__title">${title}</p><p class="empty__desc">${desc}</p></li>`;

  /* ---------- 포인트 ---------- */
  document.getElementById('pointValue').textContent = num(Store.totalPoint()) + 'P';
  const log = document.getElementById('pointLog');
  log.innerHTML = me.points.length
    ? me.points
        .map(
          (p) => `
      <li class="pointlog__item">
        <span class="pointlog__text">
          <b>${esc(p.label)}</b>
          <span>${esc(p.at)}</span>
        </span>
        <span class="pointlog__amount">+${num(p.amount)}P</span>
      </li>`,
        )
        .join('')
    : empty('아직 적립 내역이 없어요', '판정을 완료하거나 카드를 공유하면 포인트가 쌓여요.');

  /* ---------- 판정 이력 ---------- */
  const counts = me.history.reduce(
    (a, h) => ((a[h.status] = (a[h.status] || 0) + 1), a),
    {},
  );
  document.getElementById('statRow').innerHTML = `
    <div class="statrow__item"><b>${me.history.length}</b><span>전체 판정</span></div>
    <div class="statrow__item is-fit"><b>${counts.fit || 0}</b><span>적합</span></div>
    <div class="statrow__item is-vague"><b>${counts.vague || 0}</b><span>애매</span></div>
    <div class="statrow__item is-unfit"><b>${counts.unfit || 0}</b><span>부적합</span></div>`;

  const hist = document.getElementById('historyList');
  hist.innerHTML = me.history.length
    ? me.history
        .map((h) => {
          const s = HISTORY_STATUS[h.status] || HISTORY_STATUS.vague;
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
        })
        .join('')
    : empty('아직 판정한 내역이 없어요', '판정 탭에서 궁금한 정보를 확인해 보세요.');

  /* ---------- 나의 공유 카드 ---------- */
  const myCards = document.getElementById('myCards');

  function renderCards() {
    const list = Store.current().cards;
    document.getElementById('cardCount').textContent = list.length;

    myCards.innerHTML = list.length
      ? list
          .map(
            (c) => `
      <li class="mycard" data-id="${c.id}">
        <div class="mycard__top">
          <span>${esc(c.category)}</span>
          <span>${esc(c.date || '')}</span>
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
          .join('')
      : empty('아직 공유한 카드가 없어요', '판정 결과를 카드로 공유해 보세요.');

    myCards.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('이 공유 카드를 삭제할까요?')) return;
        Store.removeCard(btn.dataset.del);
        renderCards();
      });
    });
  }
  renderCards();

  /* ---------- 설정 · 로그아웃 ---------- */
  const gear = document.getElementById('settingBtn');
  const menu = document.getElementById('settingMenu');
  const menuList = document.getElementById('settingList');
  const box = document.getElementById('logoutConfirm');

  function closeMenu() {
    menuList.hidden = true;
    gear.setAttribute('aria-expanded', 'false');
  }

  gear.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menuList.hidden;
    menuList.hidden = !open;
    gear.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) closeMenu();
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    closeMenu();
    box.hidden = false;
  });
  document.getElementById('logoutCancel').addEventListener('click', () => {
    box.hidden = true;
  });
  box.addEventListener('click', (e) => {
    if (e.target === box) box.hidden = true;
  });
  document.getElementById('logoutOk').addEventListener('click', async () => {
    await API.logout();
    location.href = './start.html';
  });
})();
