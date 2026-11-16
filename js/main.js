/* Site Agnieszka Mulak – animations et interactions (Studio Mel) */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  var root = document.getElementById('am-root');
  var wipe = document.querySelector('.am-wipe');

  /* ---------- Transition entre les pages ---------- */
  // Au clic sur un lien interne : la vague recouvre l'écran, puis on change de page.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || reduce || !wipe) return;
    var href = a.getAttribute('href');
    if (!/^[\w-]+\.html(#.*)?$/.test(href)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    e.preventDefault();
    wipe.style.animation = 'am-wipe-enter .65s cubic-bezier(.77,0,.18,1) forwards';
    setTimeout(function () { window.location.href = href; }, 620);
  });
  // Retour arrière (cache du navigateur) : on retire la vague.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && wipe) wipe.style.animation = 'am-wipe 1s cubic-bezier(.77,0,.18,1) forwards';
  });

  /* ---------- Formulaire de contact (ouvre l'app mail) ---------- */
  var form = document.getElementById('am-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var body = 'Nom : ' + d.get('nom') + '\nTéléphone : ' + (d.get('tel') || '-') + '\n\n' + d.get('message');
      window.location.href = 'mailto:atelieriledescouleurs@gmail.com?subject=' +
        encodeURIComponent('Demande de rendez-vous – site') + '&body=' + encodeURIComponent(body);
    });
  }

  if (!root) return; // la suite ne concerne que l'accueil

  /* ---------- Apparitions au scroll + teinte du fond ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    root.classList.add('am-anim');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        en.target.querySelectorAll('[data-reveal-blob], [data-reveal]').forEach(function (b) { b.classList.add('in'); });
        io.unobserve(en.target);
      });
    }, { threshold: 0.12 });
    root.querySelectorAll('section').forEach(function (el) { io.observe(el); });

    var tintIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          root.style.backgroundColor = en.target.getAttribute(darkMq.matches ? 'data-tint-dark' : 'data-tint');
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    root.querySelectorAll('[data-tint]').forEach(function (el) { tintIo.observe(el); });
  }
  darkMq.addEventListener && darkMq.addEventListener('change', function () { root.style.backgroundColor = ''; });

  /* ---------- Toile qui tourne au scroll ---------- */
  var sphere = document.getElementById('am-sphere');
  if (sphere && !reduce) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        sphere.style.transform = 'rotate(' + (window.scrollY * 0.12) + 'deg)';
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Trace de peinture derrière le curseur (ordi uniquement) ---------- */
  var trail = document.getElementById('am-trail');
  if (trail && !reduce && window.matchMedia('(pointer: fine)').matches) {
    var ctx = trail.getContext('2d');
    var pts = [], k = 0;
    var palette = ['#6B3FA0', '#8E3B76', '#C4543A', '#E59BC0', '#B48AE0'];
    var resize = function () {
      var d = window.devicePixelRatio || 1;
      trail.width = window.innerWidth * d; trail.height = window.innerHeight * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', function (e) {
      k = (k + 1) % palette.length;
      pts.push({ x: e.clientX, y: e.clientY, life: 1, c: palette[k], r: 4 + Math.random() * 5 });
      if (pts.length > 60) pts.shift();
    }, { passive: true });
    (function loop() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (var i = pts.length - 1; i >= 0; i--) {
        var p = pts[i];
        p.life -= 0.025;
        if (p.life <= 0) { pts.splice(i, 1); continue; }
        ctx.globalAlpha = p.life * 0.35;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y + (1 - p.life) * 10, p.r * (2 - p.life), 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Quiz « Qu'est-ce qui vous amène ? » ---------- */
  var results = {
    emotions: { t: 'Art-thérapie adulte', x: 'Une séance individuelle pour déposer ce qui pèse et retrouver un espace à vous.', p: '70 € · 1 h 30', i: 'assets/p_wall.jpg' },
    enfant: { t: 'Art-thérapie enfant ou ado', x: 'Des séances adaptées à son âge pour exprimer ses émotions autrement qu’avec des mots.', p: 'de 50 à 60 €', i: 'assets/p_enfant.jpg' },
    maladie: { t: 'Art-thérapie et cancer', x: 'Au début, pendant ou après les traitements, un temps pour soi, en complément du suivi médical.', p: '70 € · 1 h 30', i: 'assets/p_histoire.jpg' },
    famille: { t: 'Atelier parents ou grands-parents & enfants', x: 'Un moment de création à deux, matériel inclus, pour renforcer les liens.', p: '95 € le duo', i: 'assets/parents.jpg' },
    peindre: { t: 'Cours de peinture', x: 'À l’année ou à la carte, débutants bienvenus, en musique et en couleurs.', p: 'Sur demande', i: 'assets/p_cours.jpg' }
  };
  var resBox = document.getElementById('am-result');
  document.querySelectorAll('.am-quiz-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.am-quiz-btn').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      var r = results[btn.getAttribute('data-quiz')];
      if (!r || !resBox) return;
      document.getElementById('am-r-title').textContent = r.t;
      document.getElementById('am-r-text').textContent = r.x;
      document.getElementById('am-r-price').textContent = r.p;
      document.getElementById('am-r-img').src = r.i;
      resBox.hidden = false;
      resBox.classList.remove('am-result'); void resBox.offsetWidth; resBox.classList.add('am-result');
    });
  });

  /* ---------- Mini atelier de peinture ---------- */
  var paint = document.getElementById('am-paint');
  if (paint) {
    var color = '#6B3FA0', drawing = false, last = null;
    var pctx = paint.getContext('2d');
    var setup = function () {
      var d = window.devicePixelRatio || 1;
      var w = Math.round(paint.clientWidth * d), h = Math.round(paint.clientHeight * d);
      if (paint.width !== w || paint.height !== h) { paint.width = w; paint.height = h; pctx.setTransform(d, 0, 0, d, 0, 0); }
    };
    var pos = function (e) { var r = paint.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    var stroke = function (a, b) {
      pctx.globalAlpha = 0.5; pctx.strokeStyle = color; pctx.lineCap = 'round'; pctx.lineJoin = 'round';
      pctx.lineWidth = 16 + Math.random() * 8;
      pctx.beginPath(); pctx.moveTo(a.x, a.y); pctx.lineTo(b.x + 0.01, b.y); pctx.stroke();
    };
    setup();
    window.addEventListener('resize', setup);
    paint.addEventListener('pointerdown', function (e) { setup(); drawing = true; last = pos(e); stroke(last, last); paint.setPointerCapture(e.pointerId); });
    paint.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pos(e); stroke(last, p); last = p; });
    ['pointerup', 'pointercancel'].forEach(function (ev) { paint.addEventListener(ev, function () { drawing = false; }); });
    document.querySelectorAll('.am-swatch').forEach(function (s) {
      s.addEventListener('click', function () {
        document.querySelectorAll('.am-swatch').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        s.setAttribute('aria-pressed', 'true');
        color = s.getAttribute('data-color');
      });
    });
    var clear = document.getElementById('am-clear');
    if (clear) clear.addEventListener('click', function () { pctx.clearRect(0, 0, paint.width, paint.height); });
  }
})();
