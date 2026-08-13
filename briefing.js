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
  const fmt = (d) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${DAYS[d.getDay()]})`;

  /* ---------- 날짜 선택 ---------- */
  const picker = document.getElementById('datePicker');
  const dateBtn = document.getElementById('dateBtn');
  const dateList = document.getElementById('dateList');
  const dateLabel = document.getElementById('dateLabel');

  const recent = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  });
  let picked = recent[0];
  dateLabel.textContent = fmt(picked);

  dateList.innerHTML = recent
    .map(
      (d, i) =>
        `<li><button type="button" class="bdate__opt ${i === 0 ? 'is-selected' : ''}" data-i="${i}">${fmt(d)}</button></li>`,
    )
    .join('');

  const closeDates = () => {
    dateList.hidden = true;
    dateBtn.setAttribute('aria-expanded', 'false');
  };

  dateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dateList.hidden;
    dateList.hidden = !open;
    dateBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!picker.contains(e.target)) closeDates();
  });

  dateList.querySelectorAll('.bdate__opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      picked = recent[Number(btn.dataset.i)];
      dateLabel.textContent = fmt(picked);
      dateList
        .querySelectorAll('.bdate__opt')
        .forEach((b) => b.classList.toggle('is-selected', b === btn));
      closeDates();
      render();
    });
  });

  /* ---------- 요약 ---------- */
  const kw = BRIEFING_TODAY.keywords;
  document.getElementById('summaryText').innerHTML =
    `오늘은 ${kw.map((k) => `<b>${esc(k)}</b>`).join(', ')}<br />효과에 대한 관심이 높아요.`;

  document.getElementById('summaryStats').innerHTML = BRIEFING_TODAY.stats
    .map(
      ([label, value]) =>
        `<div class="summary__stat"><span>${esc(label)}</span><b>${esc(value)}</b></div>`,
    )
    .join('');

  /* ---------- 카테고리 ---------- */
  const chips = document.getElementById('catChips');
  const CATS = ['전체', ...CATEGORIES.slice(1)];
  let current = '전체';

  chips.innerHTML = CATS.map(
    (c) =>
      `<button type="button" class="bchip ${c === current ? 'is-active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`,
  ).join('');

  chips.addEventListener('click', (e) => {
    const btn = e.target.closest('.bchip');
    if (!btn) return;
    current = btn.dataset.cat;
    chips
      .querySelectorAll('.bchip')
      .forEach((b) => b.classList.toggle('is-active', b === btn));
    render();
  });

  /* ---------- 리스트 ---------- */
  const list = document.getElementById('briefList');
  const empty = document.getElementById('briefEmpty');

  function render() {
    const items =
      current === '전체' ? FEEDS : FEEDS.filter((f) => f.category === current);

    list.innerHTML = items
      .map(
        (f) => `
      <li class="bitem" data-id="${f.id}">
        <div class="bitem__body">
          <span class="chip">${esc(f.category)}</span>
          <h3 class="bitem__title">${esc(f.title)}</h3>
          <p class="bitem__desc">${esc(f.desc)}</p>
          <span class="bitem__time">${timeAgo(f.createdAt)}</span>
        </div>
        <span class="bitem__arrow" aria-hidden="true">›</span>
      </li>`,
      )
      .join('');

    empty.hidden = items.length > 0;

    list.querySelectorAll('.bitem').forEach((el) => {
      el.addEventListener('click', () => {
        location.href = `./feed-detail.html?id=${encodeURIComponent(el.dataset.id)}`;
      });
    });
  }
  render();

  /* ---------- 브리핑 공유 ---------- */
  document.getElementById('shareBtn').addEventListener('click', async () => {
    const text = `Dr.Judge ${fmt(picked)} 브리핑`;
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
})();
