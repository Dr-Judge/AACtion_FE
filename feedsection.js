/* ============================================
   Dr.Judge — 공유 피드 섹션 (홈 · 피드 탭 공용)
   카테고리 선택 · 정렬 탭 · 피드 카드 목록
   ============================================ */

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
}

/**
 * @param {object} options
 * @param {() => string} options.getKeyword 검색어를 돌려주는 함수 (없으면 빈 문자열)
 */
function initFeedSection(options = {}) {
  const getKeyword = options.getKeyword || (() => '');

  const catSelect = document.getElementById('catSelect');
  const catBtn = document.getElementById('catBtn');
  const catList = document.getElementById('catList');
  const catLabel = document.getElementById('catBtnLabel');
  const sortTabs = document.getElementById('sortTabs');
  const feedList = document.getElementById('feedList');
  const feedEmpty = document.getElementById('feedEmpty');

  if (!feedList) return { render() {} };

  let currentCategory = CATEGORIES[0];
  let currentSort = 'latest';

  /* ---------- 검색어 하이라이트 ---------- */
  function highlight(text) {
    const keyword = getKeyword();
    const safe = escapeHtml(text);
    if (!keyword) return safe;
    const re = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return safe.replace(re, (m) => `<span class="hl">${m}</span>`);
  }

  /* ---------- 카테고리 선택 바 ---------- */
  function renderCategories() {
    if (!catList) return;
    catList.innerHTML = CATEGORIES.map(
      (c) => `
      <li>
        <button type="button" class="catselect__opt ${c === currentCategory ? 'is-selected' : ''}" data-cat="${c}">
          <span>${c}</span>
          <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7" />
          </svg>
        </button>
      </li>`,
    ).join('');

    catList.querySelectorAll('.catselect__opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.cat;
        catLabel.textContent = currentCategory;
        catSelect.classList.toggle(
          'is-filtered',
          currentCategory !== CATEGORIES[0],
        );
        closeCatList();
        renderCategories();
        render();
      });
    });
  }

  function openCatList() {
    catList.hidden = false;
    catSelect.classList.add('is-open');
    catBtn.setAttribute('aria-expanded', 'true');
  }
  function closeCatList() {
    catList.hidden = true;
    catSelect.classList.remove('is-open');
    catBtn.setAttribute('aria-expanded', 'false');
  }

  if (catBtn) {
    catBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      catList.hidden ? openCatList() : closeCatList();
    });
    document.addEventListener('click', (e) => {
      if (!catSelect.contains(e.target)) closeCatList();
    });
  }

  /* ---------- 정렬 탭 ---------- */
  if (sortTabs) {
    sortTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.sorttabs__item');
      if (!btn) return;
      currentSort = btn.dataset.sort;
      sortTabs
        .querySelectorAll('.sorttabs__item')
        .forEach((i) => i.classList.toggle('is-active', i === btn));
      render();
    });
  }

  /* ---------- 목록 ---------- */
  function getVisibleFeeds() {
    let list = FEEDS.slice();

    if (currentCategory !== CATEGORIES[0]) {
      list = list.filter((f) => f.category === currentCategory);
    }

    list =
      currentSort === 'popular'
        ? list.sort((a, b) => b.likes - a.likes)
        : list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 검색 시: 일치하는 항목을 맨 위로
    const keyword = getKeyword();
    if (keyword) {
      const k = keyword.toLowerCase();
      const match = (f) => (f.title + f.desc).toLowerCase().includes(k);
      list = [...list.filter(match), ...list.filter((f) => !match(f))];
    }
    return list;
  }

  function render() {
    const list = getVisibleFeeds();
    const keyword = getKeyword();
    const k = keyword.toLowerCase();
    const isHit = (f) => keyword && (f.title + f.desc).toLowerCase().includes(k);

    feedList.innerHTML = list
      .map(
        (f) => `
      <li class="feedcard ${isHit(f) ? 'is-hit' : ''}" data-id="${f.id}">
        <span class="chip">${f.category}</span>
        <h3 class="feedcard__title">${highlight(f.title)}</h3>
        <p class="feedcard__desc">${highlight(f.desc)}</p>
        <div class="feedcard__meta">
          <span class="img-placeholder avatar"></span>
          <span class="feedcard__author">${escapeHtml(f.author)}</span>
          <span class="feedcard__divider"></span>
          <span>${timeAgo(f.createdAt)}</span>
          <span class="feedcard__actions">
            <button type="button" class="feedcard__like ${f.liked ? 'is-liked' : ''}" data-like="${f.id}" aria-label="좋아요">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
                <path d="M12 20s-7.2-4.4-7.2-9.3A4.2 4.2 0 0 1 12 8.1a4.2 4.2 0 0 1 7.2 2.6C19.2 15.6 12 20 12 20Z" />
              </svg>
              <span>${f.likes}</span>
            </button>
            <span class="feedcard__share" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 16 16.5 7.5" /><path d="M9.5 7.5h7v7" />
              </svg>
            </span>
          </span>
        </div>
      </li>`,
      )
      .join('');

    if (feedEmpty) feedEmpty.hidden = list.length > 0;

    // 카드 터치 → 상세로 이동
    feedList.querySelectorAll('.feedcard').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-like]')) return;
        location.href = `./feed-detail.html?id=${encodeURIComponent(card.dataset.id)}`;
      });
    });

    // 좋아요 토글
    feedList.querySelectorAll('[data-like]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = FEEDS.find((f) => f.id === btn.dataset.like);
        item.liked = !item.liked;
        item.likes += item.liked ? 1 : -1;
        btn.classList.toggle('is-liked', item.liked);
        btn.querySelector('span').textContent = item.likes;
      });
    });
  }

  renderCategories();
  render();

  return { render };
}
