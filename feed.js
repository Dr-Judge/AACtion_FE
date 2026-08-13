/* ============================================
   Dr.Judge — 공유 피드 탭
   ============================================ */

(function () {
  const list = document.getElementById('cardList');
  const pills = document.getElementById('sortPills');
  let sort = 'latest';

  const ICON = {
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>',
    bang: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 6h2v8h-2zM11 16h2v2h-2z" /></svg>',
    question:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9.2 9a2.8 2.8 0 1 1 3.6 2.7c-.6.2-.8.7-.8 1.3v.6" /><path d="M12 17.2v.1" /></svg>',
  };

  function sorted() {
    const l = FEED_CARDS.slice();
    return sort === 'popular'
      ? l.sort((a, b) => b.likes - a.likes)
      : l.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function render() {
    list.innerHTML = sorted()
      .map((c) => {
        const r = RESULT[c.result];
        return `
      <li class="pcard" data-id="${c.id}">
        <div class="pcard__top">
          <span class="pcard__cat">${escapeHtml(c.category)}</span>
          <span class="badge-done">판정 완료</span>
        </div>
        <h2 class="pcard__title">“${escapeHtml(c.title)}”</h2>
        <p class="pcard__desc">${escapeHtml(c.desc)}</p>

        <div class="verdict-row verdict-row--${r.tone}">
          <span class="verdict-row__icon">${ICON[r.icon]}</span>
          <span class="verdict-row__label">${r.label}</span>
          <span class="verdict-row__hint">${r.hint}</span>
        </div>

        <div class="pcard__foot">
          <span class="pcard__author">@${escapeHtml(c.author)}</span>
          <span class="pcard__like">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
              <path d="M12 20s-7.2-4.4-7.2-9.3A4.2 4.2 0 0 1 12 8.1a4.2 4.2 0 0 1 7.2 2.6C19.2 15.6 12 20 12 20Z" />
            </svg>
            ${c.likes}
          </span>
        </div>
      </li>`;
      })
      .join('');

    list.querySelectorAll('.pcard').forEach((el) => {
      el.addEventListener('click', () => {
        location.href = `./feed-detail.html?id=${encodeURIComponent(el.dataset.id)}`;
      });
    });
  }

  pills.addEventListener('click', (e) => {
    const btn = e.target.closest('.pills__item');
    if (!btn) return;
    sort = btn.dataset.sort;
    pills
      .querySelectorAll('.pills__item')
      .forEach((b) => b.classList.toggle('is-active', b === btn));
    render();
  });

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }

  render();
})();
