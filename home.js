/* ============================================
   Dr.Judge — 메인(홈) 화면 스크립트
   spec: 1 검색 바 / 2 카테고리 선택 바 / 3 공유 피드 / 4 데일리 브리핑
   데이터: data.js · 피드 목록: feedsection.js
   ============================================ */

/* ---------- 4. 데일리 브리핑 캐러셀 ---------- */
const track = document.getElementById('briefingTrack');
const dots = document.getElementById('briefingDots');
let slideIndex = 0;
let autoTimer = null;

function renderBriefings() {
  track.innerHTML = BRIEFINGS.map(
    (b) => `
    <button class="briefing__slide" data-id="${b.id}" type="button">
      <span class="briefing__badge">DAILY BRIEFING</span>
      <h3 class="briefing__title">${b.title}</h3>
      <p class="briefing__desc">${b.desc}</p>
      <span class="briefing__cta">${b.cta} <span aria-hidden="true">›</span></span>
      <img class="briefing__char" src="./assets/character.png" alt="Dr.Judge" data-fallback="character" />
    </button>
  `,
  ).join('');

  dots.innerHTML = BRIEFINGS.map(
    (_, i) => `<span class="${i === 0 ? 'is-active' : ''}"></span>`,
  ).join('');

  initImageFallback(track);

  // 터치 시 데일리 브리핑 상세로 이동
  track.querySelectorAll('.briefing__slide').forEach((el) => {
    el.addEventListener('click', () => goBriefingDetail(el.dataset.id));
  });
}

function goBriefingDetail(id) {
  location.href = `./briefing.html?id=${encodeURIComponent(id)}`;
}

function syncDots() {
  const w = track.clientWidth;
  if (!w) return;
  slideIndex = Math.round(track.scrollLeft / w);
  dots
    .querySelectorAll('span')
    .forEach((d, i) => d.classList.toggle('is-active', i === slideIndex));
}

function startAuto() {
  stopAuto();
  autoTimer = setInterval(() => {
    slideIndex = (slideIndex + 1) % BRIEFINGS.length;
    track.scrollTo({ left: slideIndex * track.clientWidth, behavior: 'smooth' });
  }, 4500);
}
function stopAuto() {
  clearInterval(autoTimer);
}

track.addEventListener('scroll', syncDots, { passive: true });
track.addEventListener('pointerdown', stopAuto);
track.addEventListener('pointerup', startAuto);

/* ---------- 1. 검색 바 ---------- */
const searchbar = document.getElementById('searchbar');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const searchIcon = document.getElementById('searchIcon');
let keyword = '';

/* ---------- 2·3. 카테고리 · 공유 피드 ---------- */
const feedSection = initFeedSection({ getKeyword: () => keyword });

// 돋보기 아이콘 터치 시 키보드가 올라옴 (input focus)
searchIcon.addEventListener('click', () => searchInput.focus());
searchInput.addEventListener('focus', () =>
  searchbar.classList.add('is-focused'),
);
searchInput.addEventListener('blur', () =>
  searchbar.classList.remove('is-focused'),
);
searchInput.addEventListener('input', () => {
  keyword = searchInput.value.trim();
  searchClear.hidden = keyword.length === 0;
  feedSection.render();
});
searchClear.addEventListener('click', () => {
  searchInput.value = '';
  keyword = '';
  searchClear.hidden = true;
  feedSection.render();
  searchInput.focus();
});

/* ---------- init ---------- */
renderBriefings();
startAuto();
window.addEventListener('resize', syncDots);
