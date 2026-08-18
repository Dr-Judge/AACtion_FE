/* ============================================
   Dr.Judge — 오늘의 브리핑
   ============================================ */

(function () {
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );

  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  function fmtDate(iso) {
    const d = iso ? new Date(iso) : new Date();
    if (Number.isNaN(d.getTime())) return String(iso);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} (${DAYS[d.getDay()]})`;
  }

  const dateLabel = document.getElementById('dateLabel');
  const chips = document.getElementById('catChips');
  const list = document.getElementById('briefList');
  const empty = document.getElementById('briefEmpty');
  const summaryText = document.getElementById('summaryText');
  const summaryStats = document.getElementById('summaryStats');

  let items = [];
  let current = '전체';

  /* ---------- 카테고리 칩 ---------- */
  function renderChips() {
    const cats = ['전체', ...new Set(items.map((i) => i.category).filter(Boolean))];
    chips.innerHTML = cats
      .map(
        (c) =>
          `<button type="button" class="bchip ${c === current ? 'is-active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`,
      )
      .join('');
  }

  chips.addEventListener('click', (e) => {
    const btn = e.target.closest('.bchip');
    if (!btn) return;
    current = btn.dataset.cat;
    chips
      .querySelectorAll('.bchip')
      .forEach((b) => b.classList.toggle('is-active', b === btn));
    renderList();
  });

  /* ---------- 요약 ---------- */
  function renderSummary() {
    if (!items.length) {
      summaryText.textContent = '오늘은 새로 도착한 브리핑이 없어요.';
      summaryStats.innerHTML = '';
      return;
    }

    const keywords = items.map((i) => i.title.split(/[,·]/)[0].trim()).slice(0, 3);
    summaryText.innerHTML =
      `오늘은 ${keywords.map((k) => `<b>${esc(k.length > 14 ? k.slice(0, 14) + '…' : k)}</b>`).join(', ')}<br />관련 소식이 도착했어요.`;

    const levels = new Set(items.map((i) => i.levelLabel).filter(Boolean));
    const stats = [
      ['오늘의 카드', `${items.length}건`],
      ['분야', `${new Set(items.map((i) => i.category)).size}개`],
      ['신뢰도 라벨', `${levels.size}종`],
    ];
    summaryStats.innerHTML = stats
      .map(
        ([label, value]) =>
          `<div class="summary__stat"><span>${esc(label)}</span><b>${esc(value)}</b></div>`,
      )
      .join('');
  }

  /* ---------- 목록 ---------- */
  function renderList() {
    const shown =
      current === '전체' ? items : items.filter((i) => i.category === current);

    list.innerHTML = shown
      .map(
        (b) => `
      <li class="bitem" data-id="${esc(b.id)}" data-archive="${esc(b.archiveId || '')}">
        <div class="bitem__body">
          <span class="chip">${esc(b.category || '기타')}</span>
          <h3 class="bitem__title">${esc(b.title)}</h3>
          <p class="bitem__desc">${esc(b.summary)}</p>
          <span class="bitem__time">${esc(b.levelLabel)}</span>
        </div>
        <span class="bitem__arrow" aria-hidden="true">›</span>
      </li>`,
      )
      .join('');

    empty.hidden = shown.length > 0;

    list.querySelectorAll('.bitem').forEach((el) => {
      el.addEventListener('click', () => {
        const archive = el.dataset.archive;
        location.href = archive
          ? `./feed-detail.html?id=${encodeURIComponent(archive)}`
          : `./feed-detail.html?id=${encodeURIComponent(el.dataset.id)}`;
      });
    });
  }

  /* ---------- 공유 ---------- */
  document.getElementById('shareBtn').addEventListener('click', async () => {
    const text = `Dr.Judge ${dateLabel.textContent} 브리핑`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Dr.Judge', text, url: location.href });
        return;
      } catch (e) {
        /* 취소 */
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(location.href);
      alert('브리핑 링크를 복사했어요.');
    }
  });

  /* ---------- 시작 ---------- */
  (async () => {
    dateLabel.textContent = fmtDate();
    summaryText.textContent = '브리핑을 불러오는 중…';

    const res = await API.getTodayBriefing();

    if (!res.ok) {
      summaryText.textContent = res.text;
      summaryStats.innerHTML = '';
      list.innerHTML = '';
      empty.hidden = false;
      return;
    }

    dateLabel.textContent = fmtDate(res.data.date);
    items = res.data.items;

    renderChips();
    renderSummary();
    renderList();
  })();
})();
