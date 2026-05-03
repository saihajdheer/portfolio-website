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
    if (!activeSrc) {
      document.querySelectorAll('.pb-placed').forEach(function (s) { s.classList.remove('selected'); });
      return;
    }
    placeSticker(activeSrc, e.clientX, e.clientY);
    /* keep selected so user can stamp multiple of the same sticker;
       they can click the chip again or pick another to deselect */
  });

  /* ── SHARED place helper ── */
  function placeSticker(src, clientX, clientY) {
    var rect = polWrap.getBoundingClientRect();
    var size = 64;
    var x = clientX - rect.left - size / 2;
    var y = clientY - rect.top  - size / 2;

    var wrap = document.createElement('div');
    wrap.className = 'pb-placed';
    wrap.style.width = size + 'px';
    wrap.style.height = size + 'px';
    wrap.style.left = Math.max(-20, Math.min(x, rect.width  - 44)) + 'px';
    wrap.style.top  = Math.max(-20, Math.min(y, rect.height - 44)) + 'px';

    var img = document.createElement('img');
    img.src = src;
    wrap.appendChild(img);

    // Tools
    var tools = document.createElement('div');
    tools.className = 'pb-stk-tools';
    
    var btnPlus = document.createElement('button');
    btnPlus.className = 'pb-stk-tool'; btnPlus.innerHTML = '+';
    btnPlus.onclick = function(e) { e.stopPropagation(); scaleSticker(wrap, 1.2); };
    
    var btnMinus = document.createElement('button');
    btnMinus.className = 'pb-stk-tool'; btnMinus.innerHTML = '−';
    btnMinus.onclick = function(e) { e.stopPropagation(); scaleSticker(wrap, 0.8); };
    
    var btnDel = document.createElement('button');
    btnDel.className = 'pb-stk-tool del'; btnDel.innerHTML = '×';
    btnDel.onclick = function(e) { e.stopPropagation(); wrap.remove(); };

    tools.appendChild(btnPlus);
    tools.appendChild(btnMinus);
    tools.appendChild(btnDel);
    wrap.appendChild(tools);

    polWrap.appendChild(wrap);
    makeStickerDraggable(wrap);
    
    // Stop propagation on click to avoid duplication
    wrap.addEventListener('click', function(e) { e.stopPropagation(); });
  }

  function scaleSticker(el, factor) {
    var w = parseInt(el.style.width) || 64;
    var h = parseInt(el.style.height) || 64;
    var newW = Math.min(250, Math.max(32, w * factor));
    var newH = Math.min(250, Math.max(32, h * factor));
    el.style.width = newW + 'px';
    el.style.height = newH + 'px';
    // adjust position to keep centered
    var l = parseInt(el.style.left) || 0;
    var t = parseInt(el.style.top) || 0;
    el.style.left = (l - (newW - w) / 2) + 'px';
    el.style.top = (t - (newH - h) / 2) + 'px';
  }

  /* ── REPOSITION PLACED STICKERS (mouse + touch) ── */
  function makeStickerDraggable(el) {
    var d = false, ox, oy, sl, st;
    el.addEventListener('mousedown', function (e) {
      d = true; e.stopPropagation(); e.preventDefault();
      
      // Select sticker
      document.querySelectorAll('.pb-placed').forEach(function(s) { s.classList.remove('selected'); });
      el.classList.add('selected');

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
    
    // Deselect if clicking polWrap (but wrap click handles its own thing)
    // We already stop propagation on wrap click.
    
    el.addEventListener('touchstart', function (e) {
      d = true; e.stopPropagation();
      document.querySelectorAll('.pb-placed').forEach(function(s) { s.classList.remove('selected'); });
      el.classList.add('selected');
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
        var si = new Image(); 
        var imgTag = stk.querySelector('img');
        si.src = imgTag.src;
        function draw() {
          ctx.drawImage(si,
            BORDER + (parseInt(stk.style.left) || 0) * scale,
            BORDER + (parseInt(stk.style.top)  || 0) * scale,
            (parseInt(stk.style.width)  || 64) * scale,
            (parseInt(stk.style.height) || 64) * scale);
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

// ====================
// PLAYGROUND — Drawing Canvas
// ====================
(function () {
  var canvas = document.getElementById('pgCanvas');
  var wrap   = document.getElementById('pgCanvasWrap');
  var ctx    = canvas.getContext('2d');

  // State
  var brushColor = '#1a1a1a';
  var brushSize  = 6;
  var isEraser   = false;
  var isDrawing  = false;
  var gridOn     = true;
  var isSmooth   = false;
  var inited     = false;

  // Stroke-based storage (source of truth)
  var strokes     = [];   // [{type:'draw', points, color, size, eraser}, {type:'image', img, x, y, w, h}]
  var currentStroke = null;
  var undoStack   = [];   // previous strokes snapshots
  var redoStack   = [];
  var MAX_HIST    = 50;

  // ── HELPERS ──
  function cw() { return canvas.width / (window.devicePixelRatio || 1); }
  function ch() { return canvas.height / (window.devicePixelRatio || 1); }

  function cloneStrokes() {
    return strokes.map(function (s) {
      if (s.type === 'image') return { type: 'image', img: s.img, x: s.x, y: s.y, w: s.w, h: s.h };
      return { type: 'draw', points: s.points.slice(), color: s.color, size: s.size, eraser: s.eraser };
    });
  }

  function pushUndo() {
    undoStack.push(cloneStrokes());
    if (undoStack.length > MAX_HIST) undoStack.shift();
    redoStack = [];
  }

  // ── RESIZE ──
  function resizeCanvas() {
    var rect = wrap.getBoundingClientRect();
    var dpr  = window.devicePixelRatio || 1;
    var w = Math.round(rect.width);
    var h = Math.round(rect.height);
    if (w === 0 || h === 0) return false;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  // ── INIT (wait for #main to be visible) ──
  function tryInit() {
    if (inited) return;
    if (!resizeCanvas()) { requestAnimationFrame(tryInit); return; }
    inited = true;
    wrap.classList.add('grid-on');
  }
  tryInit();

  window.addEventListener('resize', function () {
    if (!inited) return;
    var timer;
    clearTimeout(timer);
    timer = setTimeout(function () {
      resizeCanvas();
      redrawAll();
    }, 200);
  });

  // ── COORDINATE MAPPING ──
  function getPos(e) {
    var rect = wrap.getBoundingClientRect();
    var cx, cy;
    if (e.touches && e.touches.length) {
      cx = e.touches[0].clientX; cy = e.touches[0].clientY;
    } else {
      cx = e.clientX; cy = e.clientY;
    }
    return { x: cx - rect.left, y: cy - rect.top };
  }

  // ══════════════════════════════════════════
  //  IMAGE TRANSFORMATION (Drag & Resize)
  // ══════════════════════════════════════════
  var selectedImgIdx = -1;
  var isResizing    = false;
  var isDraggingImg = false;
  var transformStart = { x: 0, y: 0 };
  var origTransform = { x: 0, y: 0, w: 0, h: 0 };
  var HANDLE_SIZE    = 12;

  function getImgAt(p) {
    for (var i = strokes.length - 1; i >= 0; i--) {
      var s = strokes[i];
      if (s.type === 'image') {
        if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h) {
          return i;
        }
      }
    }
    return -1;
  }

  function isOverHandle(p, s) {
    var hx = s.x + s.w, hy = s.y + s.h;
    var res = (p.x >= hx - HANDLE_SIZE && p.x <= hx + HANDLE_SIZE &&
               p.y >= hy - HANDLE_SIZE && p.y <= hy + HANDLE_SIZE);
    if (res) return 'resize';
    
    var dx = s.x + s.w, dy = s.y;
    var overDel = (p.x >= dx - HANDLE_SIZE && p.x <= dx + HANDLE_SIZE &&
                   p.y >= dy - HANDLE_SIZE && p.y <= dy + HANDLE_SIZE);
    if (overDel) return 'delete';
    
    return null;
  }

  // ══════════════════════════════════════════
  //  REDRAW ALL STROKES (the core of smooth)
  // ══════════════════════════════════════════
  function redrawAll() {
    ctx.clearRect(0, 0, cw(), ch());
    strokes.forEach(function (s, idx) {
      if (s.type === 'image') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(s.img, s.x, s.y, s.w, s.h);
        
        if (idx === selectedImgIdx) {
          // Draw selection box
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = '#e8587a';
          ctx.lineWidth = 2;
          ctx.strokeRect(s.x, s.y, s.w, s.h);
          ctx.setLineDash([]);
          
          // Draw resize handle
          ctx.fillStyle = '#e8587a';
          ctx.fillRect(s.x + s.w - HANDLE_SIZE/2, s.y + s.h - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
          
          // Draw delete handle (top-right)
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(s.x + s.w, s.y, HANDLE_SIZE/1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('×', s.x + s.w, s.y);
        }
      } else {
        applyStrokeStyle(s);
        // Draw initial dot
        ctx.beginPath();
        ctx.arc(s.points[0].x, s.points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        // Draw the line
        if (isSmooth && s.points.length > 2 && !s.eraser) {
          drawSmoothCurve(s.points);
        } else {
          drawRawStroke(s.points);
        }
      }
    });
  }

  function applyStrokeStyle(s) {
    if (s.eraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.fillStyle   = 'rgba(0,0,0,1)';
      ctx.lineWidth   = s.size * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = s.color;
      ctx.fillStyle   = s.color;
      ctx.lineWidth   = s.size;
    }
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
  }

  function drawRawStroke(pts) {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
  }

  function drawSmoothCurve(pts) {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 2) {
      ctx.lineTo(pts[1].x, pts[1].y);
    } else {
      for (var i = 0; i < pts.length - 1; i++) {
        var midX = (pts[i].x + pts[i + 1].x) / 2;
        var midY = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    }
    ctx.stroke();
  }

  // ══════════════════════════════════════════
  //  DRAWING
  // ══════════════════════════════════════════
  function applyBrush() {
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.fillStyle   = 'rgba(0,0,0,1)';
      ctx.lineWidth   = brushSize * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
      ctx.fillStyle   = brushColor;
      ctx.lineWidth   = brushSize;
    }
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
  }

  var lastX = 0, lastY = 0;

  function startDraw(e) {
    if (!inited) { tryInit(); return; }
    var p = getPos(e);
    
    // If an image is ALREADY selected, check for handles or dragging it
    if (selectedImgIdx !== -1) {
      var s = strokes[selectedImgIdx];
      var h = isOverHandle(p, s);
      if (h === 'resize') {
        isResizing = true;
        transformStart = p;
        origTransform = { w: s.w, h: s.h };
        e.preventDefault();
        return;
      }
      if (h === 'delete') {
        pushUndo();
        strokes.splice(selectedImgIdx, 1);
        selectedImgIdx = -1;
        wrap.classList.remove('img-selected');
        redrawAll();
        e.preventDefault();
        return;
      }
      
      // If clicking inside the selected image, allow dragging
      if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h) {
        isDraggingImg = true;
        transformStart = p;
        origTransform = { x: s.x, y: s.y };
        e.preventDefault();
        return;
      }
      
      // If clicking outside the selected image and its handles, deselect it
      selectedImgIdx = -1;
      wrap.classList.remove('img-selected');
      redrawAll();
    }
    
    // Otherwise, start regular drawing
    e.preventDefault();
    isDrawing = true;
    applyBrush();
    lastX = p.x; lastY = p.y;
    currentStroke = { type: 'draw', points: [p], color: brushColor, size: brushSize, eraser: isEraser };
    // Dot for click
    ctx.beginPath();
    ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw(e) {
    var p = getPos(e);
    
    if (isResizing && selectedImgIdx !== -1) {
      var s = strokes[selectedImgIdx];
      var dx = p.x - transformStart.x;
      s.w = Math.max(50, origTransform.w + dx);
      s.h = Math.max(50, origTransform.h + dx * (origTransform.h / origTransform.w)); // maintain aspect ratio
      redrawAll();
      return;
    }
    
    if (isDraggingImg && selectedImgIdx !== -1) {
      var s = strokes[selectedImgIdx];
      s.x = origTransform.x + (p.x - transformStart.x);
      s.y = origTransform.y + (p.y - transformStart.y);
      redrawAll();
      return;
    }

    if (!isDrawing) return;
    e.preventDefault();
    currentStroke.points.push(p);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastX = p.x; lastY = p.y;
  }

  function endDraw() {
    if (isResizing || isDraggingImg) {
      pushUndo(); // save final state of transform
      isResizing = false;
      isDraggingImg = false;
      return;
    }
    if (!isDrawing) return;
    isDrawing = false;
    if (currentStroke && currentStroke.points.length > 0) {
      pushUndo();
      strokes.push(currentStroke);
      // If smooth mode is on, redraw everything so this stroke is also smooth
      if (isSmooth) redrawAll();
    }
    currentStroke = null;
  }

  function handleDblClick(e) {
    var p = getPos(e);
    var hitIdx = getImgAt(p);
    if (hitIdx !== -1) {
      selectedImgIdx = hitIdx;
      wrap.classList.add('img-selected');
      redrawAll();
      e.preventDefault();
    }
  }

  // Mouse events
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);
  canvas.addEventListener('dblclick', handleDblClick);
  // Touch events
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', endDraw);
  canvas.addEventListener('touchcancel', endDraw);

  // ══════════════════════════════════════════
  //  UNDO / REDO (stroke-based)
  // ══════════════════════════════════════════
  document.getElementById('pgUndoBtn').addEventListener('click', function () {
    if (undoStack.length === 0) return;
    redoStack.push(cloneStrokes());
    strokes = undoStack.pop();
    redrawAll();
  });

  document.getElementById('pgRedoBtn').addEventListener('click', function () {
    if (redoStack.length === 0) return;
    undoStack.push(cloneStrokes());
    strokes = redoStack.pop();
    redrawAll();
  });

  // ══════════════════════════════════════════
  //  TOOLBAR CONTROLS
  // ══════════════════════════════════════════

  // Brush size
  document.querySelectorAll('.pg-size-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.pg-size-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      brushSize = parseInt(btn.getAttribute('data-size'));
      if (isEraser) toggleEraser();
    });
  });

  // Brush color
  document.querySelectorAll('.pg-color-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.pg-color-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      brushColor = btn.getAttribute('data-color');
      if (isEraser) toggleEraser();
    });
  });

  // Eraser
  function toggleEraser() {
    isEraser = !isEraser;
    document.getElementById('pgEraserBtn').classList.toggle('active', isEraser);
    wrap.classList.toggle('eraser-on', isEraser);
  }
  document.getElementById('pgEraserBtn').addEventListener('click', toggleEraser);

  // ── SMOOTH TOGGLE ──
  // Toggles smooth mode AND immediately redraws all existing strokes as curves
  document.getElementById('pgSmoothBtn').addEventListener('click', function () {
    isSmooth = !isSmooth;
    this.classList.toggle('active', isSmooth);
    redrawAll(); // instantly re-render all strokes smooth or raw
  });

  // Grid toggle
  document.getElementById('pgGridBtn').addEventListener('click', function () {
    gridOn = !gridOn;
    this.classList.toggle('active', gridOn);
    wrap.classList.toggle('grid-on', gridOn);
  });

  // Clear
  document.getElementById('pgClearBtn').addEventListener('click', function () {
    if (strokes.length === 0) return;
    pushUndo();
    strokes = [];
    ctx.clearRect(0, 0, cw(), ch());
  });

  // ══════════════════════════════════════════
  //  IMPORT IMAGE
  // ══════════════════════════════════════════
  var fileInput = document.getElementById('pgFileInput');
  document.getElementById('pgImportBtn').addEventListener('click', function () { fileInput.click(); });

  fileInput.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        ctx.globalCompositeOperation = 'source-over';
        var canvasW = cw(), canvasH = ch();
        var maxW = canvasW * 0.6, maxH = canvasH * 0.6;
        var scale = Math.min(maxW / img.width, maxH / img.height, 1);
        var drawW = img.width * scale, drawH = img.height * scale;
        var x = (canvasW - drawW) / 2, y = (canvasH - drawH) / 2;
        // Store in strokes
        pushUndo();
        strokes.push({ type: 'image', img: img, x: x, y: y, w: drawW, h: drawH });
        // Draw it
        ctx.drawImage(img, x, y, drawW, drawH);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
  });

  // ══════════════════════════════════════════
  //  SAVE DRAWING
  // ══════════════════════════════════════════
  document.getElementById('pgSaveBtn').addEventListener('click', function () {
    var btn = this;
    var origHTML = btn.innerHTML;
    btn.querySelector('span').textContent = 'Saving...';

    var dpr = window.devicePixelRatio || 1;
    var expCanvas = document.createElement('canvas');
    expCanvas.width  = canvas.width;
    expCanvas.height = canvas.height;
    var expCtx = expCanvas.getContext('2d');

    // Background
    expCtx.fillStyle = '#f8f6f3';
    expCtx.fillRect(0, 0, expCanvas.width, expCanvas.height);

    // Grid
    if (gridOn) {
      expCtx.strokeStyle = 'rgba(180,165,150,0.12)';
      expCtx.lineWidth = 1;
      var step = 24 * dpr;
      for (var gx = 0; gx < expCanvas.width; gx += step) {
        expCtx.beginPath(); expCtx.moveTo(gx, 0); expCtx.lineTo(gx, expCanvas.height); expCtx.stroke();
      }
      for (var gy = 0; gy < expCanvas.height; gy += step) {
        expCtx.beginPath(); expCtx.moveTo(0, gy); expCtx.lineTo(expCanvas.width, gy); expCtx.stroke();
      }
    }

    // Drawing content
    expCtx.drawImage(canvas, 0, 0);

    var a = document.createElement('a');
    a.download = 'saihaj-playground-' + Date.now() + '.png';
    a.href = expCanvas.toDataURL('image/png');
    a.click();

    btn.querySelector('span').textContent = '✓ Saved!';
    setTimeout(function () { btn.innerHTML = origHTML; }, 2500);
  });
})();

