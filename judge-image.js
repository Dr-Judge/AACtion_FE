/* Dr.Judge — 이미지로 판정 요청 */
(function () {
  const zone = document.getElementById('dropzone');
  const file = document.getElementById('fileInput');
  const preview = document.getElementById('preview');
  const clearBtn = document.getElementById('clearFile');

  let picked = null;

  const req = initJudgeRequest({
    isReady: () => Boolean(picked),
    payload: () => ({ type: 'image', fileName: picked && picked.name }),
  });

  function setFile(f) {
    if (!f || !f.type.startsWith('image/')) return;
    picked = f;
    preview.src = URL.createObjectURL(f);
    zone.classList.add('has-file');
    req.update();
  }

  file.addEventListener('change', () => setFile(file.files[0]));

  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    picked = null;
    file.value = '';
    preview.removeAttribute('src');
    zone.classList.remove('has-file');
    req.update();
  });

  // 드래그 앤 드롭
  ['dragenter', 'dragover'].forEach((t) =>
    zone.addEventListener(t, (e) => {
      e.preventDefault();
      zone.classList.add('is-over');
    }),
  );
  ['dragleave', 'drop'].forEach((t) =>
    zone.addEventListener(t, (e) => {
      e.preventDefault();
      zone.classList.remove('is-over');
    }),
  );
  zone.addEventListener('drop', (e) => setFile(e.dataTransfer.files[0]));
})();
