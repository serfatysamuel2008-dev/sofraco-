/* SOFRACO — interactions & scroll choreography */
(function () {
  const { gsap, ScrollTrigger, Lenis } = window;
  gsap.registerPlugin(ScrollTrigger);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ---------- Smooth scroll ---------- */
  const lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: !reduceMotion });
  lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeMenu();
    lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  }));

  /* ---------- Loader ---------- */
  const num = $('.loader__num');
  const counter = { v: 0 };
  const loadTl = gsap.timeline();
  loadTl.to(counter, {
    v: 100, duration: reduceMotion ? 0.2 : 2.2, ease: 'power3.inOut',
    onUpdate: () => { num.textContent = Math.round(counter.v); gsap.set('.loader__bar span', { scaleX: counter.v / 100 }); },
  });
  const waitScene = () => new Promise((res) => {
    const t0 = performance.now();
    (function check() { if (window.__sceneReady || performance.now() - t0 > 4000) res(); else requestAnimationFrame(check); })();
  });
  Promise.all([loadTl.then(), waitScene()]).then(intro);

  function intro() {
    window.__introStarted = true;
    document.body.classList.remove('is-loading');
    const tl = gsap.timeline({ onComplete: () => lenis.start() });
    tl.to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' })
      .set('.loader', { display: 'none' })
      .from('.hero__title .word', { yPercent: 120, rotate: 6, duration: 1.4, ease: 'expo.out', stagger: 0.07 }, '-=.55')
      .from('.nav > *', { y: -30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.06 }, '-=1.2')
      .from('.hero__meta > *, .hero__lead, .hero__actions > *, .hero__scroll', { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06 }, '-=1.1');
  }
  gsap.set('.loader', { clipPath: 'inset(0 0 0% 0)' });

  /* ---------- Cursor ---------- */
  const cursor = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('.cursor__label');
  if (!isTouch) {
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }, rp = { ...pos };
    const dx = gsap.quickSetter(dot, 'x', 'px'), dy = gsap.quickSetter(dot, 'y', 'px');
    const rx = gsap.quickSetter(ring, 'x', 'px'), ry = gsap.quickSetter(ring, 'y', 'px');
    window.addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; dx(pos.x); dy(pos.y); }, { passive: true });
    gsap.ticker.add(() => { rp.x += (pos.x - rp.x) * 0.16; rp.y += (pos.y - rp.y) * 0.16; rx(rp.x); ry(rp.y); });
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('is-active'); });
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (!isTouch) $$('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, .4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, .4)' });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.35);
      yTo((e.clientY - r.top - r.height / 2) * 0.45);
    });
    el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });

  /* ---------- Text scramble on nav hover ---------- */
  const glyphs = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  $$('[data-scramble]').forEach((el) => {
    const original = el.textContent; let raf;
    el.addEventListener('mouseenter', () => {
      let frame = 0; cancelAnimationFrame(raf);
      const run = () => {
        el.textContent = original.split('').map((ch, i) => (i < frame / 2 ? ch : glyphs[(Math.random() * glyphs.length) | 0])).join('');
        if (frame++ < original.length * 2) raf = requestAnimationFrame(run); else el.textContent = original;
      };
      run();
    });
  });

  /* ---------- Nav hide on scroll ---------- */
  const nav = $('.nav'); let lastY = 0;
  lenis.on('scroll', ({ scroll }) => {
    nav.classList.toggle('is-scrolled', scroll > 40);
    nav.classList.toggle('is-hidden', scroll > lastY && scroll > 300 && !menu.classList.contains('is-open'));
    lastY = scroll;
  });

  /* ---------- Mobile menu ---------- */
  const burger = $('.nav__burger'), menu = $('.menu');
  function closeMenu() { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true'); }
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    if (open) gsap.from('.menu a', { yPercent: 80, opacity: 0, stagger: 0.06, duration: 0.9, ease: 'expo.out', delay: 0.15 });
  });

  /* ---------- Hero parallax out ---------- */
  gsap.to('.hero__title', { yPercent: -30, opacity: 0.1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__bottom', { y: -80, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

  /* ---------- Marquee (velocity reactive) ---------- */
  const track = $('.marquee__track');
  let mx = 0, vel = 0;
  lenis.on('scroll', ({ velocity }) => { vel = velocity; });
  gsap.ticker.add(() => {
    const half = track.scrollWidth / 2;
    mx -= 1.2 + Math.abs(vel) * 0.6;
    if (mx <= -half) mx += half;
    track.style.transform = `translate3d(${mx}px,0,0) skewX(${gsap.utils.clamp(-12, 12, -vel * 0.4)}deg)`;
  });

  /* ---------- Manifesto word reveal ---------- */
  $$('[data-split]').forEach((el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
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
    };
    walk(el);
    gsap.to($$('.w', el), { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });

  /* ---------- Counters ---------- */
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    const o = { v: end > 1000 ? end - 120 : 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2.2, ease: 'expo.out', onUpdate: () => (el.textContent = pre + Math.round(o.v) + suf) }),
    });
  });
  gsap.from('.stat', { y: 60, opacity: 0, stagger: 0.1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.manifesto__stats', start: 'top 85%' } });

  /* ---------- Horizontal expertise ---------- */
  const xTrack = $('.expertise__track');
  const getDist = () => Math.max(0, xTrack.scrollWidth - window.innerWidth);
  gsap.to(xTrack, {
    x: () => -getDist(), ease: 'none',
    scrollTrigger: {
      trigger: '.expertise', pin: '.expertise__pin', start: 'top top', end: () => '+=' + getDist(), scrub: 1, invalidateOnRefresh: true,
      onUpdate: (self) => gsap.set('.expertise__progress span', { scaleX: self.progress }),
    },
  });
  gsap.from('.card', { y: 120, rotate: 4, opacity: 0, stagger: 0.08, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.expertise', start: 'top 70%' } });

  /* ---------- 3D tilt + spotlight on cards ---------- */
  if (!isTouch) $$('[data-tilt]').forEach((card) => {
    const rX = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
    const rY = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
    gsap.set(card, { transformPerspective: 900 });
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      rY((px - 0.5) * 14); rX((0.5 - py) * 14);
      card.style.setProperty('--mx', px * 100 + '%'); card.style.setProperty('--my', py * 100 + '%');
    });
    card.addEventListener('mouseleave', () => { rX(0); rY(0); });
  });

  /* ---------- Audience rows + floating orb ---------- */
  gsap.from('.audience__list li', { y: 80, opacity: 0, stagger: 0.1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.audience__list', start: 'top 80%' } });
  const float = $('.audience__float');
  if (!isTouch) {
    const fx = gsap.quickTo(float, 'x', { duration: 0.7, ease: 'power3' });
    const fy = gsap.quickTo(float, 'y', { duration: 0.7, ease: 'power3' });
    $('.audience__list').addEventListener('mousemove', (e) => { fx(e.clientX - 130); fy(e.clientY - 130); });
    $('.audience__list').addEventListener('mouseenter', () => float.classList.add('is-on'));
    $('.audience__list').addEventListener('mouseleave', () => float.classList.remove('is-on'));
  }

  /* ---------- Method steps ---------- */
  $$('.step').forEach((s) => {
    gsap.from(s, { y: 100, opacity: 0, scale: 0.94, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 88%' } });
  });

  /* ---------- Section headings ---------- */
  $$('.method__sticky h2, .expertise__head h2').forEach((h) => {
    gsap.from(h, { y: 80, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
  });

  /* ---------- CTA ---------- */
  gsap.from('.cta__title > span', { yPercent: 100, opacity: 0, stagger: 0.12, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.cta', start: 'top 65%' } });
  gsap.from('.cta__form > *', { y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.cta__form', start: 'top 90%' } });

  /* ---------- Footer giant letters ---------- */
  gsap.from('.footer__giant span', { yPercent: 100, stagger: 0.05, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 85%' } });

  /* ---------- Clock & year ---------- */
  $('.year').textContent = new Date().getFullYear();
  const clock = $('.clock');
  const fmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris' });
  const tickClock = () => (clock.textContent = fmt.format(new Date()) + ' — Bordeaux');
  tickClock(); setInterval(tickClock, 1000);

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
