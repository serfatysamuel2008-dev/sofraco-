/* Groupe Sofraco — interactions & animations */
(function () {
  const { gsap, ScrollTrigger, Lenis } = window;
  gsap.registerPlugin(ScrollTrigger);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ---------- Smooth scroll ---------- */
  const lenis = new Lenis({ duration: 1.15, smoothWheel: !reduce });
  lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ---------- Split helpers ---------- */
  // Headings: split on <br> into masked lines
  $$('.reveal-lines').forEach((el) => {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map((p) => `<span class="l"><span>${p.trim()}</span></span>`).join('');
  });
  // Paragraphs: wrap each word
  function splitWords(el) {
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.append(part);
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.append(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    return $$('.w', el);
  }

  /* ---------- Loader & intro ---------- */
  const marks = $$('.loader__mark path');
  const intro = gsap.timeline({ paused: true, onComplete: () => { lenis.start(); document.body.classList.remove('is-loading'); } });
  if (reduce) {
    gsap.set('.loader', { display: 'none' });
    document.body.classList.remove('is-loading');
    lenis.start();
  } else {
    gsap.set(marks, { opacity: 0, x: (i) => (i % 2 ? 24 : -24) });
    gsap.set('.header', { y: -30, opacity: 0 });
    intro
      .to(marks, { opacity: 1, x: 0, duration: 0.55, ease: 'expo.out', stagger: 0.05 })
      .to('.loader', { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, '+=.05')
      .set('.loader', { display: 'none' })
      .from('.hero__title .line > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.09 }, '-=.45')
      .to('.header', { y: 0, opacity: 1, duration: 1, ease: 'expo.out', clearProps: 'transform,opacity' }, '<')
      .from('.hero .reveal-up', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, '-=.9')
      .fromTo('.hero__img', { clipPath: 'inset(100% 0 0 0 round 32px)' }, { clipPath: 'inset(0% 0 0 0 round 32px)', duration: 1.4, ease: 'expo.inOut' }, '-=1.3')
      .to('.hero__img img', { scale: 1, duration: 1.8, ease: 'expo.out' }, '<.3')
      .from('.chip', { y: 40, opacity: 0, scale: 0.9, duration: 1, ease: 'back.out(1.6)', stagger: 0.12 }, '-=1.1');
    const go = () => intro.play();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
    setTimeout(go, 1500); // safety
  }

  /* ---------- Header ---------- */
  const header = $('.header');
  let lastY = 0;
  lenis.on('scroll', ({ scroll }) => {
    header.classList.toggle('is-scrolled', scroll > 30);
    header.classList.toggle('is-hidden', scroll > lastY && scroll > 500 && !menu.classList.contains('is-open'));
    lastY = scroll;
  });

  /* ---------- Mobile menu ---------- */
  const burger = $('.burger'), menu = $('.mobile-menu');
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.setAttribute('aria-hidden', String(!open));
    open ? lenis.stop() : lenis.start();
    if (open && !reduce) gsap.from('.mobile-menu > a, .mobile-menu__foot', { y: 30, opacity: 0, stagger: 0.04, duration: 0.8, ease: 'expo.out', delay: 0.2 });
  });

  /* ---------- Scroll progress ---------- */
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

  if (reduce) return finishStatic();

  /* ---------- Generic reveals ---------- */
  $$('.reveal-lines').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from($$('.l > span', el), { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('.reveal-up').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from(el, { y: 36, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  /* ---------- Word-by-word reading ---------- */
  $$('[data-words]').forEach((el) => {
    gsap.to(splitWords(el), { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true } });
  });
  $$('[data-words-color]').forEach((el) => {
    const words = splitWords(el);
    const accent = /expertise|indépendance/i;
    gsap.to(words, {
      color: (i, w) => (accent.test(w.textContent) ? '#ee7203' : '#1d1d1b'),
      stagger: 0.06, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true },
    });
  });

  /* ---------- Counters ---------- */
  const fmt = (n, el) => (el.dataset.prefix || '') + (el.dataset.format === 'space' ? Math.round(n).toLocaleString('fr-FR') : Math.round(n));
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const o = { v: +(el.dataset.from || 0) };
    el.textContent = fmt(o.v, el);
    const run = () => gsap.to(o, { v: end, duration: 2.2, ease: 'expo.out', onUpdate: () => (el.textContent = fmt(o.v, el)) });
    if (el.closest('.hero')) intro.call(run, null, '-=0.6');
    else ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: run });
  });

  /* ---------- Hero parallax ---------- */
  gsap.to('.hero__bgmark', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__visual', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.chip--a', { y: -14, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.chip--b', { y: 12, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.chip--c', { y: -10, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  if (fine) {
    const hero = $('.hero');
    const layers = [['.hero__img', 10], ['.chip--a', 26], ['.chip--b', 34], ['.chip--c', 20], ['.hero__bgmark', -18]].map(([s, d]) => ({
      x: gsap.quickTo(s, 'x', { duration: 1, ease: 'power3' }), d,
      rot: s === '.hero__img' ? gsap.quickTo(s, 'rotationY', { duration: 1, ease: 'power3' }) : null,
    }));
    gsap.set('.hero__visual', { perspective: 1200 });
    hero.addEventListener('mousemove', (e) => {
      const px = e.clientX / innerWidth - 0.5;
      layers.forEach((l) => { l.x(px * l.d); if (l.rot) l.rot(px * 6); });
    });
    hero.addEventListener('mouseleave', () => layers.forEach((l) => { l.x(0); if (l.rot) l.rot(0); }));
  }

  /* ---------- Marquee (reacts to scroll speed) ---------- */
  const track = $('.marquee__track');
  let mx = 0, vel = 0;
  lenis.on('scroll', ({ velocity }) => { vel = velocity; });
  gsap.ticker.add(() => {
    const half = track.scrollWidth / 2;
    mx -= 0.8 + Math.min(Math.abs(vel) * 0.4, 12);
    if (mx <= -half) mx += half;
    track.style.transform = `translate3d(${mx}px,0,0)`;
  });

  /* ---------- Stats ---------- */
  gsap.from('.stat', { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.stats', start: 'top 88%' } });

  /* ---------- Quote mark ---------- */
  gsap.from('.quote__mark', { y: 30, opacity: 0, rotate: -20, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.quote', start: 'top 75%' } });

  /* ---------- Solutions tabs ---------- */
  const tabs = $$('.tabs button'), pill = $('.tabs__pill');
  const placePill = (btn) => { pill.style.width = btn.offsetWidth + 'px'; pill.style.transform = `translateX(${btn.offsetLeft - 5}px)`; };
  const activeTab = () => tabs.find((t) => t.getAttribute('aria-selected') === 'true');
  placePill(activeTab());
  window.addEventListener('resize', () => placePill(activeTab()));
  tabs.forEach((btn) => btn.addEventListener('click', () => {
    if (btn.getAttribute('aria-selected') === 'true') return;
    const key = btn.dataset.tab;
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t === btn)));
    placePill(btn);
    const bodies = $$('.pillar__body ul, .solutions__intro');
    gsap.to(bodies, {
      opacity: 0, y: 10, duration: 0.25, ease: 'power2.in',
      onComplete: () => {
        $$('[data-list]').forEach((ul) => (ul.hidden = ul.dataset.list !== key));
        $$('[data-panel-text]').forEach((p) => (p.hidden = p.dataset.panelText !== key));
        $$('.pillar .link').forEach((a) => (a.href = a.dataset['href' + (key === 'dirigeant' ? 'Dirigeant' : 'Collectif')]));
        gsap.fromTo($$('.pillar__body ul:not([hidden]), .solutions__intro:not([hidden])'), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05 });
        ScrollTrigger.refresh();
      },
    });
    gsap.fromTo('.pillar__img img', { scale: 1.12 }, { scale: 1, duration: 1.2, ease: 'expo.out', stagger: 0.05 });
  }));
  gsap.from('.pillar', { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.pillars', start: 'top 85%' } });

  /* ---------- Method ---------- */
  gsap.to('.method__line span', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 70%', end: 'bottom 60%', scrub: true } });
  $$('.step').forEach((s) => {
    gsap.from(s, { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 88%' } });
    gsap.from($('.step__n', s), { scale: 0, rotate: -90, duration: 1, ease: 'back.out(2)', scrollTrigger: { trigger: s, start: 'top 85%' } });
  });

  /* ---------- Join ---------- */
  gsap.from('.join__list li', { x: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.join__list', start: 'top 80%' } });

  /* ---------- Partner image parallax ---------- */
  $$('.parallax').forEach((img) => {
    gsap.fromTo(img, { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.from('.partner__img', { clipPath: 'inset(20% 20% 20% 20% round 28px)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.partner__img', start: 'top 80%' } });

  /* ---------- France map pins ---------- */
  // [lon, lat] of a sample of regional hubs; projected onto the map image
  const cities = [[-0.58, 44.84], [2.35, 48.86], [4.84, 45.76], [5.37, 43.3], [1.44, 43.6], [-1.55, 47.22], [-1.68, 48.11], [3.06, 50.63], [7.75, 48.57], [3.88, 43.61], [7.26, 43.7], [-1.47, 43.49], [0.34, 46.58], [1.9, 47.9], [5.04, 47.32], [6.18, 48.69], [3.09, 45.78], [-0.37, 49.18], [1.1, 49.44], [5.72, 45.19], [2.3, 49.9], [-4.49, 48.39], [1.6, 42.98], [4.36, 43.84], [0.69, 47.39]];
  const pins = $('.finder__pins');
  // calibrated on the map image bounds (1024px): Brest tip x=42, Lauterbourg x=962, Dunkerque y=34, Corse sud y=988
  const proj = ([lon, lat]) => [((42 + ((lon + 4.8) / 13.03) * 920) / 1024) * 100, ((34 + ((51.09 - lat) / 9.72) * 954) / 1024) * 100];
  cities.forEach((c, i) => {
    const [x, y] = proj(c);
    const p = document.createElement('span');
    p.className = 'pin';
    p.style.left = x + '%'; p.style.top = y + '%';
    p.style.setProperty('--d', (i % 6) * 0.4 + 's');
    pins.append(p);
  });
  gsap.from('.finder__map img', { scale: 0.9, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.finder', start: 'top 75%' } });
  gsap.from('.pin', { scale: 0, duration: 0.6, ease: 'back.out(3)', stagger: { each: 0.05, from: 'random' }, scrollTrigger: { trigger: '.finder', start: 'top 60%' } });

  /* ---------- News & RSE ---------- */
  gsap.from('.post', { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.news__grid', start: 'top 85%' } });
  gsap.from('.rse__card', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.rse__grid', start: 'top 88%' } });

  /* ---------- CTA ---------- */
  gsap.from('.cta h2', { y: 60, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.cta', start: 'top 75%' } });
  gsap.fromTo('.cta__mark', { yPercent: -40, rotate: -6 }, { yPercent: -60, rotate: 0, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- Magnetic buttons (desktop) ---------- */
  if (fine) $$('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.2);
      yTo((e.clientY - r.top - r.height / 2) * 0.3);
    });
    el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });

  finishStatic();
  window.addEventListener('load', () => ScrollTrigger.refresh());

  function finishStatic() {
    $('.year').textContent = new Date().getFullYear();
    if (reduce) {
      $$('[data-count]').forEach((el) => (el.textContent = fmtStatic(el)));
      $$('.about__big .w').forEach((w) => (w.style.opacity = 1));
    }
  }
  function fmtStatic(el) { const n = +el.dataset.count; return (el.dataset.prefix || '') + (el.dataset.format === 'space' ? n.toLocaleString('fr-FR') : n); }
})();
