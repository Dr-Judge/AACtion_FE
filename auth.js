/* ============================================
   Dr.Judge — 스플래시 자동 전환
   ============================================ */

(function () {
  var DELAY = 1800; // 표시 시간(ms)
  var NEXT = './start.html';

  function go() {
    location.replace(NEXT);
  }

  var timer = setTimeout(go, DELAY);

  // 화면을 탭하면 즉시 넘어가기
  document.addEventListener(
    'click',
    function () {
      clearTimeout(timer);
      go();
    },
    { once: true },
  );
})();
