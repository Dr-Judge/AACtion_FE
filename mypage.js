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
    if (btn.dataset.tab === 'history') ensureHistory();
    if (btn.dataset.tab === 'cards') ensureCards();
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

  /* ---------- 판정 이력 (서버에서 페이지 단위로) ---------- */
  const statRow = document.getElementById('statRow');
  const hist = document.getElementById('historyList');
  const moreBtn = document.getElementById('historyMore');

  let histItems = [];
  let histPage = 1;
  let histHasNext = false;
  let histLoading = false;

  function renderStats() {
    const counts = histItems.reduce(
      (a, h) => ((a[h.status] = (a[h.status] || 0) + 1), a),
      {},
    );
    const suffix = histHasNext ? '+' : '';
    statRow.innerHTML = `
      <div class="statrow__item"><b>${histItems.length}${suffix}</b><span>전체 판정</span></div>
      <div class="statrow__item is-fit"><b>${counts.fit || 0}</b><span>적합</span></div>
      <div class="statrow__item is-vague"><b>${counts.vague || 0}</b><span>애매</span></div>
      <div class="statrow__item is-unfit"><b>${counts.unfit || 0}</b><span>부적합</span></div>`;
  }

  function renderHistory() {
    hist.innerHTML = histItems.length
      ? histItems
          .map((h) => {
            const s = HISTORY_STATUS[h.status] || HISTORY_STATUS.vague;
            return `
      <li class="hitem" data-result="${h.id || ''}">
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

    hist.querySelectorAll('.hitem[data-result]').forEach((el) => {
      if (!el.dataset.result) return;
      el.addEventListener('click', () => {
        location.href = `./judge-result.html?id=${encodeURIComponent(el.dataset.result)}`;
      });
    });

    moreBtn.hidden = !histHasNext;
    renderStats();
  }

  async function loadHistory(next) {
    if (histLoading) return;
    histLoading = true;
    moreBtn.textContent = '불러오는 중…';

    const res = await API.getJudgmentHistory({ page: next ? histPage + 1 : 1 });

    histLoading = false;
    moreBtn.textContent = '더 보기';

    if (!res.ok) {
      hist.innerHTML = empty('이력을 불러오지 못했어요', res.text);
      moreBtn.hidden = true;
      return;
    }

    histPage = next ? histPage + 1 : 1;
    histItems = next ? histItems.concat(res.data.items) : res.data.items;
    histHasNext = res.data.hasNext;
    renderHistory();
  }

  moreBtn.addEventListener('click', () => loadHistory(true));

  // 판정 이력 탭을 처음 열 때 불러옵니다
  let histLoaded = false;
  function ensureHistory() {
    if (histLoaded) return;
    histLoaded = true;
    loadHistory(false);
  }

  /* ---------- 나의 공유 카드 (서버에서 페이지 단위로) ---------- */
  const myCards = document.getElementById('myCards');
  const cardsMore = document.getElementById('cardsMore');

  let cardItems = [];
  let cardPage = 1;
  let cardTotal = 1;
  let cardLoading = false;
  let cardsLoaded = false;

  function renderCards() {
    document.getElementById('cardCount').textContent = cardItems.length;

    myCards.innerHTML = cardItems.length
      ? cardItems
          .map(
            (c) => `
      <li class="mycard" data-id="${esc(c.id)}">
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
          <button type="button" class="mycard__del" data-del="${esc(c.id)}" aria-label="공유 중지">
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
      btn.addEventListener('click', () => openRevoke(btn.dataset.del));
    });

    cardsMore.hidden = cardPage >= cardTotal;
  }

  async function loadCards(next) {
    if (cardLoading) return;
    cardLoading = true;
    cardsMore.textContent = '불러오는 중…';

    const res = await API.getMyFeedPosts({ page: next ? cardPage + 1 : 1 });

    cardLoading = false;
    cardsMore.textContent = '더 보기';

    if (!res.ok) {
      myCards.innerHTML = empty('공유 카드를 불러오지 못했어요', res.text);
      cardsMore.hidden = true;
      return;
    }

    cardPage = res.data.page;
    cardTotal = res.data.totalPages;
    cardItems = next ? cardItems.concat(res.data.items) : res.data.items;
    renderCards();
  }

  cardsMore.addEventListener('click', () => loadCards(true));

  function ensureCards() {
    if (cardsLoaded) return;
    cardsLoaded = true;
    loadCards(false);
  }

  /* ---------- 공유 링크 회수 ---------- */
  const rBox = document.getElementById('revokeConfirm');
  const rAlert = document.getElementById('revokeAlert');
  const rOk = document.getElementById('revokeOk');
  let revokingId = null;

  function openRevoke(cardId) {
    revokingId = cardId;
    rAlert.hidden = true;
    rBox.hidden = false;
  }

  document.getElementById('revokeCancel').addEventListener('click', () => {
    rBox.hidden = true;
  });
  rBox.addEventListener('click', (e) => {
    if (e.target === rBox) rBox.hidden = true;
  });

  rOk.addEventListener('click', async () => {
    const card = cardItems.find((c) => c.id === revokingId);
    if (!card) {
      rBox.hidden = true;
      return;
    }

    if (!card.judgmentId) {
      rAlert.textContent =
        '이 카드는 공유를 중지할 수 없어요. 판정 결과 화면에서 다시 시도해 주세요.';
      rAlert.hidden = false;
      return;
    }

    rOk.disabled = true;
    rOk.textContent = '중지하는 중…';

    const res = await API.revokeShareLink(card.judgmentId);

    rOk.disabled = false;
    rOk.textContent = '공유 중지';

    // 이미 회수된 링크(404)면 목록에서 지우는 게 맞습니다
    if (!res.ok && res.code !== 'SHARE_NOT_FOUND') {
      rAlert.textContent = res.text;
      rAlert.hidden = false;
      return;
    }

    Store.removeCard(revokingId);
    cardItems = cardItems.filter((c) => c.id !== revokingId);
    rBox.hidden = true;
    renderCards();
  });

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

  /* ---------- 회원탈퇴 ---------- */
  const wBox = document.getElementById('withdrawConfirm');
  const wAlert = document.getElementById('withdrawAlert');
  const wOk = document.getElementById('withdrawOk');

  document.getElementById('withdrawBtn').addEventListener('click', () => {
    closeMenu();
    wAlert.hidden = true;
    wBox.hidden = false;
  });
  document.getElementById('withdrawCancel').addEventListener('click', () => {
    wBox.hidden = true;
  });
  wBox.addEventListener('click', (e) => {
    if (e.target === wBox) wBox.hidden = true;
  });

  wOk.addEventListener('click', async () => {
    wOk.disabled = true;
    wOk.textContent = '처리 중…';

    const res = await API.withdraw();

    if (res.ok) {
      location.href = './start.html';
      return;
    }

    wOk.disabled = false;
    wOk.textContent = '탈퇴하기';
    wAlert.textContent = res.text;
    wAlert.hidden = false;
  });
})();
