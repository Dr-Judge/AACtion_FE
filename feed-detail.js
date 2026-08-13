/* ============================================
   Dr.Judge — 피드 카드 상세 보기
   ============================================ */

(function () {
  const box = document.getElementById('detail');
  const id = new URLSearchParams(location.search).get('id');
  const card = FEED_CARDS.find((c) => c.id === id) || FEED_CARDS[1];

  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );

  const d = card.detail || {
    verdict: RESULT[card.result].label,
    summary: RESULT[card.result].hint,
    info: [
      ['대상', '성인 일반'],
      ['효과', '—'],
      ['조건 · 범위', '일반적 사용 조건 기준'],
      ['근거 버전', 'v2024.11'],
    ],
    evidence: card.desc,
    checkpoints: [],
  };

  box.innerHTML = `
    <section class="detail__head">
      <span class="badge-done detail__badge">판정 완료</span>
      <h2 class="detail__title">“${esc(card.title)}”</h2>
      <div class="detail__meta">
        <span>${esc(card.category)}</span>
        <span>@${esc(card.author)}</span>
      </div>
    </section>

    <section class="detail__card">
      <div class="result">
        <span class="result__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
        </span>
        <span class="result__text">
          <span class="result__label">판정 결과</span>
          <b class="result__value">${esc(d.verdict)}</b>
        </span>
        <span class="result__summary">${esc(d.summary)}</span>
      </div>

      <h3 class="detail__h">판정 정보</h3>
      <table class="infotable">
        <tbody>
          ${d.info.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}
        </tbody>
      </table>

      <h3 class="detail__h">근거 요약</h3>
      <p class="detail__body">${esc(d.evidence)}</p>

      ${
        d.checkpoints.length
          ? `<section class="checkbox-card">
          <h3 class="checkbox-card__title">구매 기준 체크포인트</h3>
          <ul class="checkbox-card__list">
            ${d.checkpoints
              .map(
                (t) => `<li>
              <span class="checkbox-card__mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
              </span>${esc(t)}</li>`,
              )
              .join('')}
          </ul>
        </section>`
          : ''
      }

      <section class="notice-card">
        <h3 class="notice-card__title">주의 안내</h3>
        <p>이 서비스는 의료 진단·처방을 대체하지 않습니다.</p>
        <p>증상이 있다면 반드시 전문가와 상담하세요.</p>
      </section>
    </section>
  `;
})();
