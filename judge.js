/* ============================================
   Dr.Judge — 판정 탭 스크립트
   ============================================ */

(function () {
  const list = document.getElementById('judgeList');

  /* 최근 판정 기록 */
  function renderJudgements() {
    list.innerHTML = JUDGEMENTS.map(
      (j) => `
      <li class="judgecard" data-id="${j.id}">
        <div class="judgecard__top">
          <span class="chip">${j.category}</span>
          <span class="verdict verdict--${j.verdict}">${VERDICT_LABEL[j.verdict]}</span>
          <span class="judgecard__time">${timeAgo(j.createdAt)}</span>
        </div>
        <h3 class="judgecard__title">${escapeHtml(j.title)}</h3>
      </li>`,
    ).join('');

    list.querySelectorAll('.judgecard').forEach((card) => {
      card.addEventListener('click', () => {
        location.href = `./judge-result.html?id=${encodeURIComponent(card.dataset.id)}`;
      });
    });
  }

  renderJudgements();
})();
