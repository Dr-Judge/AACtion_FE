/* ============================================
   Dr.Judge — 내 정보 수정
   프로필 사진은 기본 캐릭터로 고정입니다.
   ============================================ */

(function () {
  if (!requireLogin()) return;

  const me = Store.current();
  if (!me) {
    location.replace('./login.html');
    return;
  }

  const p = me.profile;
  document.getElementById('nickValue').textContent = p.nickname;
  document.getElementById('mailValue').textContent = p.email || '—';

  const list = p.interests || (p.interest ? [p.interest] : []);
  document.getElementById('interestValue').textContent = list.length
    ? list.join(', ')
    : '미설정';
})();
