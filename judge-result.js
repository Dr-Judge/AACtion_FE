/* ============================================
   Dr.Judge — 판정 결과
   서버에서 결과를 받아 그립니다. 아직 판정 중이면 잠시 기다립니다.
   ============================================ */

(function () {
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );

  const box = document.querySelector('.result2');
  const id = new URLSearchParams(location.search).get('id');

  /* ---------- 판정 중 안내 ---------- */
  function showWaiting(text) {
    document.getElementById('claimText').textContent = text || '판정하고 있어요…';
    box.classList.add('is-waiting');
  }
  function hideWaiting() {
    box.classList.remove('is-waiting');
  }

  /* ---------- 화면 그리기 ---------- */
  function render(r) {
    hideWaiting();

    document.getElementById('claimText').textContent = `“${r.claim}”`;

    /* 근거 계층 라벨 */
    const levelName = document.getElementById('levelName');
    levelName.textContent =
      r.levelLabel ||
      (EVIDENCE_LEVELS.find((l) => l.key === r.level) || {}).name ||
      '판정 결과';

    const strong = r.level === 'clinical' || r.level === 'expert';
    const mark = document.querySelector('.tagcard__mark');
    if (!strong) mark.style.background = 'var(--gray-400)';

    document.getElementById('levelSources').textContent = r.sources
      .map((s) => s.title)
      .join(' · ');

    const levelDesc =
      (EVIDENCE_LEVELS.find((l) => l.key === r.level) || {}).desc || '';
    document.querySelector('.tagcard__desc').textContent = levelDesc;

    /* 이해상충 배지 */
    const coi = document.getElementById('conflictCard');
    if (!r.conflict) {
      coi.hidden = true;
    } else {
      coi.hidden = false;
      coi.querySelector('.tagcard__name').textContent = r.conflictBadge;
      coi.querySelector('.tagcard__desc').textContent = r.conflictDesc;
    }

    /* 근거 요약 */
    document.getElementById('sourceList').innerHTML = r.sources.length
      ? r.sources
          .map(
            (s) =>
              `<li>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title)}</li>`,
          )
          .join('')
      : '<li>확인된 출처가 없어요.</li>';

    if (r.evidence) {
      const p = document.createElement('p');
      p.className = 'sect__body';
      p.style.marginTop = '10px';
      p.textContent = r.evidence;
      document.getElementById('sourceList').after(p);
    }

    /* 구매 기준 카드 */
    const tips = (r.guideCard && r.guideCard.tips) || [];
    document.getElementById('criteriaPreview').innerHTML = tips.length
      ? tips.map((t) => `<li>${esc(t)}</li>`).join('')
      : '<li>확인 기준이 준비되지 않았어요.</li>';

    if (r.guideCard && r.guideCard.title) {
      document.querySelector('#criteriaPreview').previousElementSibling.textContent =
        r.guideCard.title;
    }

    /* 의료 안전 안내 — 서버가 문구를 주면 그걸 씁니다 */
    if (r.safetyNotice) {
      const notice = document.querySelector('.notice-card p');
      if (notice) notice.textContent = r.safetyNotice;
    }

    wireShare(r);
  }

  /* ---------- 공유 ---------- */
  function wireShare(r) {
    const postBtn = document.getElementById('postBtn');

    /* 이미 피드에 올린 판정이면 버튼을 잠급니다 */
    const already = (Store.current() || { cards: [] }).cards.some(
      (c) => String(c.judgmentId) === String(r.id || id),
    );
    if (already) {
      postBtn.disabled = true;
      postBtn.textContent = '이미 게시했어요';
    }

    postBtn.addEventListener('click', async () => {
      if (postBtn.disabled) return;
      if (!Store.isLoggedIn()) {
        location.href = './login.html';
        return;
      }

      postBtn.disabled = true;
      postBtn.textContent = '게시하는 중…';

      const res = await API.publishToFeed(r.id || id);

      postBtn.disabled = false;
      postBtn.textContent = '공유 피드에 게시하기';

      if (!res.ok) {
        alert(res.text);
        return;
      }

      const d = new Date();
      Store.addCard({
        judgmentId: r.id || id,
        postId: res.data.postId,
        category: r.levelLabel || '건강 · 판정 결과',
        date: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
        title: r.claim,
        result: r.levelLabel || '',
      });

      postBtn.disabled = true;
      postBtn.textContent = '이미 게시했어요';
      alert('공유 피드에 게시했어요. 마이페이지에서 확인할 수 있습니다.');
      location.href = './mypage.html';
    });

    const confirmBox = document.getElementById('shareConfirm');
    const open = () => (confirmBox.hidden = false);
    const close = () => (confirmBox.hidden = true);

    document.getElementById('linkBtn').addEventListener('click', open);
    document.getElementById('shareCancel').addEventListener('click', close);
    confirmBox.addEventListener('click', (e) => {
      if (e.target === confirmBox) close();
    });

    const shareOk = document.getElementById('shareOk');

    shareOk.addEventListener('click', async () => {
      shareOk.disabled = true;
      shareOk.textContent = '만드는 중…';

      // 서버에서 공유 전용 링크를 발급받습니다 (로그인 없이 열리는 주소)
      const res = await API.createShareLink(r.id || id);

      shareOk.disabled = false;
      shareOk.textContent = '공유하기';

      if (!res.ok) {
        close();
        alert(res.text);
        return;
      }
      close();

      const url = res.data.shareUrl || location.href;
      const text = `Dr.Judge 판정 결과 — ${r.claim}`;

      if (navigator.share) {
        try {
          await navigator.share({ title: 'Dr.Judge', text, url });
          return;
        } catch (e) {
          /* 사용자가 취소한 경우 */
        }
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('공유 링크를 복사했어요.');
      }
    });
  }

  /* ---------- 시작 ---------- */
  (async () => {
    if (!id) {
      // 직접 열어본 경우 — 예시로 보여줍니다
      render({
        claim: RESULT_SAMPLE.claim,
        level: RESULT_SAMPLE.level,
        levelLabel: null,
        evidence: RESULT_SAMPLE.scope,
        conflict: RESULT_SAMPLE.conflict,
        conflictBadge: '이해상충 가능성',
        conflictDesc:
          '이 정보의 출처는 제조사 또는 판매사와 연관된 채널입니다.',
        sources: RESULT_SAMPLE.sources.map((t) => ({ title: t })),
        guideCard: {
          title: '이렇게 확인하세요',
          tips: BUY_CRITERIA[0].items.map(([t]) => t),
        },
        safetyNotice: null,
      });
      return;
    }

    // 저장된 결과가 이미 완료 상태면 바로 그립니다
    const saved = Store.getResult(String(id));
    if (saved && saved.status === 'DONE') {
      render(saved);
      return;
    }

    showWaiting();
    const res = await API.waitForJudgment(id);

    if (!res.ok) {
      showWaiting(res.text);
      return;
    }
    if (res.data.status === 'FAILED') {
      location.replace('./judge-fail.html');
      return;
    }
    render(res.data);
  })();
})();
