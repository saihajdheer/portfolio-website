(function () {
  var stream    = null;
  var photoUrl  = null;
  var activeSrc = null;   /* selected sticker src (click-to-place mode) */
  var chipDragging = false; /* flag: don't select on drag */

  var video     = document.getElementById('pbVideo');
  var canvas    = document.getElementById('pbCanvas');
  var lensInner = document.getElementById('pbLensInner');
  var flashEl   = document.getElementById('pbFlash');
  var polaroid  = document.getElementById('pbPolaroid');
  var polPhoto  = document.getElementById('pbPolPhoto');
  var polDate   = document.getElementById('pbPolDate');
  var polWrap   = document.getElementById('pbPolImgWrap');
  var actions   = document.getElementById('pbActions');
  var stripL    = document.getElementById('pbStripLeft');
  var stripR    = document.getElementById('pbStripRight');
  var dragTip   = document.getElementById('pbDragTip');
  var shootHint = document.getElementById('pbShootHint');

  /* ── START CAMERA ── */
  window.pbStartCamera = function () {
    if (stream) return;
    if (location.protocol === 'file:') { alert('Please open via Live Server (http://127.0.0.1:5500) — file:// blocks the camera.'); return; }
    if (!navigator.mediaDevices) { alert('Camera not available.'); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 600 }, height: { ideal: 600 } } })
      .then(function (s) {
        stream = s; video.srcObject = s; lensInner.classList.add('active');
        /* show doodle shoot hint */
        shootHint.classList.add('visible');
      })
      .catch(function (e) { alert(e.name === 'NotAllowedError' ? 'Camera permission denied — allow it in address bar then refresh.' : 'Camera error: ' + e.message); });
  };

  /* ── TAKE PHOTO ── */
  window.pbTakePhoto = function () {
    if (location.protocol === 'file:') { alert('Use Live Server!'); return; }
    if (!stream) {
      pbStartCamera();
      setTimeout(function () { if (stream) pbTakePhoto(); }, 900);
      return;
    }
    flashEl.classList.add('on');
    setTimeout(function () { flashEl.classList.remove('on'); }, 110);

    var ctx = canvas.getContext('2d');
    var vw  = video.videoWidth  || 600;
    var vh  = video.videoHeight || 600;
    var dim = Math.min(vw, vh) || 600;
    ctx.save();
    ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
    try { ctx.drawImage(video, (vw - dim) / 2, (vh - dim) / 2, dim, dim, 0, 0, canvas.width, canvas.height); }
    catch (e) { console.error(e); }
    ctx.restore();

    photoUrl = canvas.toDataURL('image/jpeg', 0.92);
    pbEject(photoUrl);
  };

  /* ── EJECT POLAROID ── */
  function pbEject(dataUrl) {
    document.querySelectorAll('.pb-placed').forEach(function (s) { s.remove(); });

    polPhoto.src = dataUrl;
    var now = new Date();
    polDate.textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    /* hide shoot hint (photo is now taken) */
    shootHint.classList.remove('visible');

    /* reset */
    polaroid.classList.remove('ejecting', 'landed');
    polaroid.style.cssText = '';
    void polaroid.offsetWidth;

    /* animate */
    polaroid.classList.add('ejecting');

    setTimeout(function () {
      polaroid.classList.remove('ejecting');
      polaroid.classList.add('landed');

      /* show strips + actions */
      setTimeout(function () {
        stripL.classList.add('visible');
        stripR.classList.add('visible');
        actions.classList.add('visible');
        dragTip.classList.add('visible');
      }, 200);
    }, 1850);
  }

  /* ── DRAG STICKER ONTO PHOTO ──
     HTML5 drag from strips → drop on polWrap ── */
  document.querySelectorAll('.pb-sticker-chip').forEach(function (chip) {
    /* ── HTML5 DRAG from panel → drop on photo ── */
    chip.addEventListener('dragstart', function (e) {
      chipDragging = true;
      e.dataTransfer.setData('text/plain', chip.getAttribute('data-src'));
      e.dataTransfer.effectAllowed = 'copy';
    });
    chip.addEventListener('dragend', function () {
      setTimeout(function () { chipDragging = false; }, 50);
    });

    /* ── CLICK to select (click-to-place mode) ── */
    chip.addEventListener('click', function () {
      if (chipDragging) return; /* was a drag, ignore */
      var src = chip.getAttribute('data-src');
      if (activeSrc === src) {
        /* deselect */
        activeSrc = null;
        chip.classList.remove('sel');
        polWrap.classList.remove('pick');
        dragTip.textContent = '\u2190 drag any sticker from the sides onto your photo! \u2192';
      } else {
        document.querySelectorAll('.pb-sticker-chip').forEach(function (c) { c.classList.remove('sel'); });
        chip.classList.add('sel');
        activeSrc = src;
        polWrap.classList.add('pick');
        dragTip.textContent = 'now click anywhere on your photo to place the sticker!';
      }
    });
  });

  /* ── DROP from drag ── */
  polWrap.addEventListener('dragover', function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });

  polWrap.addEventListener('drop', function (e) {
    e.preventDefault();
    var src = e.dataTransfer.getData('text/plain');
    if (!src) return;
    placeSticker(src, e.clientX, e.clientY);
  });

  /* ── CLICK on photo to place selected sticker ── */
  polWrap.addEventListener('click', function (e) {
    if (!activeSrc) return;
    placeSticker(activeSrc, e.clientX, e.clientY);
    /* keep selected so user can stamp multiple of the same sticker;
       they can click the chip again or pick another to deselect */
  });

  /* ── SHARED place helper ── */
  function placeSticker(src, clientX, clientY) {
    var rect = polWrap.getBoundingClientRect();
    var x = clientX - rect.left - 32;
    var y = clientY - rect.top  - 32;
    var stk = document.createElement('img');
    stk.className = 'pb-placed';
    stk.src = src;
    stk.style.left = Math.max(-20, Math.min(x, rect.width  - 44)) + 'px';
    stk.style.top  = Math.max(-20, Math.min(y, rect.height - 44)) + 'px';
    polWrap.appendChild(stk);
    makeStickerDraggable(stk);
  }

  /* ── REPOSITION PLACED STICKERS (mouse + touch) ── */
  function makeStickerDraggable(el) {
    var d = false, ox, oy, sl, st;
    el.addEventListener('mousedown', function (e) {
      d = true; e.stopPropagation(); e.preventDefault();
      ox = e.clientX; oy = e.clientY;
      sl = parseInt(el.style.left) || 0;
      st = parseInt(el.style.top)  || 0;
      el.style.zIndex = 50;
    });
    document.addEventListener('mousemove', function (e) {
      if (!d) return;
      el.style.left = (sl + e.clientX - ox) + 'px';
      el.style.top  = (st + e.clientY - oy) + 'px';
    });
    document.addEventListener('mouseup', function () { if (d) { d = false; el.style.zIndex = 10; } });
    el.addEventListener('touchstart', function (e) {
      d = true; e.stopPropagation();
      var t = e.touches[0]; ox = t.clientX; oy = t.clientY;
      sl = parseInt(el.style.left) || 0; st = parseInt(el.style.top) || 0;
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!d) return;
      var t = e.touches[0];
      el.style.left = (sl + t.clientX - ox) + 'px';
      el.style.top  = (st + t.clientY - oy) + 'px';
    }, { passive: true });
    document.addEventListener('touchend', function () { d = false; });
  }

  /* ── SAVE PHOTO ── */
  window.pbSavePhoto = function () {
    var btn = document.querySelector('.pb-btn-save');
    btn.textContent = 'Saving...';

    var SIZE = 900, BORDER = 28, BOTTOM = 130;
    var fc = document.createElement('canvas');
    fc.width = SIZE; fc.height = SIZE + BOTTOM;
    var ctx = fc.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, fc.width, fc.height);

    var p = new Image(); p.src = photoUrl;
    p.onload = function () {
      ctx.drawImage(p, BORDER, BORDER, SIZE - BORDER * 2, SIZE - BORDER * 2);

      var wRect = polWrap.getBoundingClientRect();
      var scale = (SIZE - BORDER * 2) / wRect.width;

      var placed = document.querySelectorAll('.pb-placed');
      var done = 0;
      function finish() {
        ctx.fillStyle = '#333'; ctx.font = 'bold 34px Georgia,serif'; ctx.textAlign = 'center';
        ctx.fillText('\u2736 memory', fc.width / 2, SIZE + 46);
        ctx.fillStyle = '#bbb'; ctx.font = '22px Georgia,serif';
        ctx.fillText(polDate.textContent, fc.width / 2, SIZE + 80);
        var a = document.createElement('a');
        a.download = 'saihaj-memory-' + Date.now() + '.jpg';
        a.href = fc.toDataURL('image/jpeg', 0.95);
        a.click();
        btn.textContent = '✓ Saved!';
        setTimeout(function () { btn.textContent = '⬇ Save Photo'; }, 2500);
      }
      if (placed.length === 0) { finish(); return; }
      placed.forEach(function (stk) {
        var si = new Image(); si.src = stk.src;
        function draw() {
          ctx.drawImage(si,
            BORDER + (parseInt(stk.style.left) || 0) * scale,
            BORDER + (parseInt(stk.style.top)  || 0) * scale,
            (stk.offsetWidth  || 64) * scale,
            (stk.offsetHeight || 64) * scale);
          done++;
          if (done === placed.length) finish();
        }
        si.onload = draw;
        if (si.complete) draw();
      });
    };
  };

  /* ── RETAKE ── */
  window.pbRetake = function () {
    polaroid.classList.remove('ejecting', 'landed');
    polaroid.style.cssText = '';
    stripL.classList.remove('visible');
    stripR.classList.remove('visible');
    actions.classList.remove('visible');
    dragTip.classList.remove('visible');
    dragTip.textContent = '\u2190 drag any sticker from the sides onto your photo! \u2192';
    document.querySelectorAll('.pb-placed').forEach(function (s) { s.remove(); });
    /* reset selection */
    activeSrc = null;
    document.querySelectorAll('.pb-sticker-chip').forEach(function (c) { c.classList.remove('sel'); });
    polWrap.classList.remove('pick');
    /* re-show shoot hint (camera still on) */
    if (stream) shootHint.classList.add('visible');
  };
})();

// ====================

/* â”€â”€ SMOOTH SCROLL HELPER â”€â”€ */
          function scrollTo(id) {
            var el = document.getElementById(id);
            if (!el) return;
            /* offset for sticky nav height (~68px) */
            var navH = 68;
            var top = el.getBoundingClientRect().top + window.pageYOffset - navH;
            window.scrollTo({ top: top, behavior: 'smooth' });
          }

          /* â”€â”€ RESUME OPEN â”€â”€ */
          function openResume() {
            window.open('assets/CV_202604040911586316_12301117.pdf', '_blank');
          }

          /* â”€â”€ SPLASH ANIMATION â”€â”€ */
          window.addEventListener('load', function () {
            var letters = document.querySelectorAll('.letter');
            var sub = document.getElementById('splashSub');
            var usvg = document.getElementById('usvg');
            var upath = document.getElementById('upath');
            var splash = document.getElementById('splash');
            var main = document.getElementById('main');

            letters.forEach(function (l, i) {
              setTimeout(function () { l.classList.add('show'); }, 200 + i * 110);
            });
            var after = 200 + (letters.length - 1) * 110;

            setTimeout(function () {
              usvg.classList.add('vis');
              var s = null;
              (function anim(ts) {
                if (!s) s = ts;
                var p = Math.min((ts - s) / 700, 1);
                upath.style.strokeDashoffset = String(560 * (1 - p));
                if (p < 1) requestAnimationFrame(anim);
              })(performance.now());
            }, after + 200);

            setTimeout(function () { sub.classList.add('show'); }, after + 420);

            setTimeout(function () {
              splash.style.opacity = '0';
              setTimeout(function () {
                splash.style.display = 'none';
                main.style.display = 'block';
              }, 700);
            }, after + 1800);
          });

          /* â”€â”€ MODAL â”€â”€ */
          window.openModal = function () { document.getElementById('modal').classList.add('open'); };
          document.getElementById('modal').addEventListener('click', function (e) {
            if (e.target === this) this.classList.remove('open');
          });

          /* â”€â”€ DRAGGABLE POLAROIDS â”€â”€ */
          function makeDraggable(el) {
            var drag = false, ox = 0, oy = 0, sl = 0, st = 0;
            var base = parseFloat(el.getAttribute('data-b')) || 0;
            el.addEventListener('mousedown', function (e) {
              drag = true; el.style.animation = 'none'; el.style.zIndex = 50;
              ox = e.clientX; oy = e.clientY; sl = el.offsetLeft; st = el.offsetTop;
              e.preventDefault();
            });
            document.addEventListener('mousemove', function (e) {
              if (!drag) return;
              var dx = e.clientX - ox, dy = e.clientY - oy;
              el.style.left = (sl + dx) + 'px'; el.style.top = (st + dy) + 'px';
              el.style.right = 'auto'; el.style.bottom = 'auto';
              el.style.transform = 'rotate(' + (base + dx * 0.04) + 'deg)';
            });
            document.addEventListener('mouseup', function () {
              if (!drag) return; drag = false; el.style.zIndex = 5;
              el.style.transform = 'rotate(' + base + 'deg)';
            });
          }
          ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].forEach(function (id) {
            var el = document.getElementById(id); if (el) makeDraggable(el);
          });

          /* â”€â”€ SAY HELLO POPUP â”€â”€ */
          window.toggleHelloPopup = function(e) {
            e.stopPropagation();
            document.getElementById('helloPopup').classList.toggle('show');
          };
          window.copyHelloEmail = function() {
            navigator.clipboard.writeText('saihajdheer@gmail.com').then(() => {
              var btn = document.getElementById('hpCopyBtn');
              btn.innerText = 'Copied!';
              setTimeout(() => btn.innerText = 'Copy', 2000);
            });
          };
          document.addEventListener('click', function(e) {
            var popup = document.getElementById('helloPopup');
            if (popup && popup.classList.contains('show') && !e.target.closest('.hello-wrap')) {
              popup.classList.remove('show');
            }
          });