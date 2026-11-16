/* ============================================
   Dr.Judge — '체험하기' 버튼 (학술제·시연용)

   가입 없이 미리 만들어 둔 체험 계정으로 바로 들어갑니다.
   - 이 계정은 공개용입니다. 비밀번호가 화면 코드에 들어 있어도 괜찮은 대신,
     실제 개인 정보를 넣지 않는 계정이어야 합니다(서버 시드: deploy/seed/seed_users.py).
   - 여러 방문자가 같은 계정을 함께 쓰므로 서로의 판정 이력이 섞여 보일 수 있습니다.
   - 시연 후/중간에 화면을 처음 상태로 되돌리려면 deploy/seed/gen_demo_sql.py 로 만든
     demo_data.sql 을 다시 적용하세요.
   ============================================ */

(function () {
  const DEMO_ACCOUNT = { userId: 'demo', password: 'Judge2026!!' };

  const btn = document.getElementById('demoBtn');
  if (!btn) return;

  const label = btn.textContent.trim();

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = '체험 계정으로 들어가는 중…';

    const res = await API.login(DEMO_ACCOUNT);

    if (res.ok) {
      location.href = './home.html';
      return;
    }

    /* 실패하면(서버 꺼짐 등) 버튼을 되살리고 이유를 알려 줍니다 */
    btn.disabled = false;
    btn.textContent = label;
    alert(
      (res && res.text) ||
        '체험 계정으로 들어가지 못했어요.\n잠시 후 다시 눌러 주세요.',
    );
  });
})();
