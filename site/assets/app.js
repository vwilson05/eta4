// eta4.org front-end. No frameworks. All network calls hit the Bun server on the same origin.
(function () {
  'use strict';
  const APPLICATIONS_OPEN = new Date('2026-11-02T08:00:00-08:00');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Header state
  const header = $('#siteHeader');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Current nav item
  const path = location.pathname.replace(/\/$/, '') || '/';
  $$('.nav a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/$/, '');
    if (href !== '/' && path.startsWith(href.replace(/^\/vi/, '')) || href === path) a.setAttribute('aria-current', 'page');
  });

  // Mobile menu
  const menuBtn = $('#menuBtn'), menu = $('#mobileMenu');
  if (menuBtn && menu) {
    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    };
    menuBtn.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }

  // Footer year
  const y = $('#year'); if (y) y.textContent = String(new Date().getFullYear());

  // Reveal on scroll. Content is visible by default; motion is layered on only for
  // elements below the first screen, with a safety timer so nothing can stay hidden.
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const below = $$('.reveal').filter(el => el.getBoundingClientRect().top > window.innerHeight * 0.9);
    below.forEach((el, i) => { el.classList.add('pending'); el.style.transitionDelay = `${(i % 4) * 70}ms`; });
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.05, rootMargin: '0px 0px 10% 0px' });
    below.forEach(el => io.observe(el));
    setTimeout(() => below.forEach(el => el.classList.add('in')), 2500);
  }

  // Chart grow
  const chart = $('.chart');
  if (chart) {
    if (reduceMotion || !('IntersectionObserver' in window)) chart.classList.add('grown');
    else {
      const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { chart.classList.add('grown'); io.disconnect(); } }, { threshold: 0.3 });
      io.observe(chart);
    }
  }

  // Counters
  const counters = $$('[data-count]');
  if (counters.length) {
    const run = (el) => {
      const target = Number(el.dataset.count); const suffix = el.dataset.suffix || '';
      if (reduceMotion) { el.textContent = target.toLocaleString('en-US') + suffix; return; }
      const t0 = performance.now(), dur = 1400;
      const frame = (now) => {
        const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * e).toLocaleString('en-US') + (t === 1 ? suffix : '');
        if (t < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting && !e.target.dataset.done) { e.target.dataset.done = '1'; run(e.target); } }); }, { threshold: 0.5 });
    counters.forEach(c => io.observe(c));
  }

  // Video: swap poster for the embed on click
  $$('.video').forEach(v => {
    const btn = $('.play', v); const id = v.dataset.video;
    if (!btn || !id) return;
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
      f.title = btn.getAttribute('aria-label') || 'eta4 video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      v.innerHTML = ''; v.appendChild(f);
    });
  });

  // Countdown
  const cd = $('#countdown');
  if (cd) {
    const label = $('#countdownLabel');
    const tick = () => {
      const d = APPLICATIONS_OPEN.getTime() - Date.now();
      if (d <= 0) {
        if (label) label.textContent = cd.dataset.openLabel || 'Applications are open';
        cd.innerHTML = `<a class="btn btn-summer" href="mailto:info@eta4.org?subject=Summer%202027%20volunteer%20application">${cd.dataset.openCta || 'Apply now'}</a>`;
        return false;
      }
      const days = Math.floor(d / 864e5), hours = Math.floor(d % 864e5 / 36e5), mins = Math.floor(d % 36e5 / 6e4);
      $('[data-u="d"]', cd).textContent = String(days);
      $('[data-u="h"]', cd).textContent = String(hours);
      $('[data-u="m"]', cd).textContent = String(mins);
      return true;
    };
    if (tick()) setInterval(tick, 30000);
  }

  // Forms
  const setStatus = (el, msg, kind) => { if (!el) return; el.textContent = msg; el.classList.remove('ok', 'err'); if (kind) el.classList.add(kind); };
  const postJSON = async (url, body) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let data = {}; try { data = await r.json(); } catch (_) {}
    if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
    return data;
  };
  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const t = (form, key, fallback) => form.dataset[key] || fallback;

  const vf = $('#volunteerForm');
  if (vf) {
    vf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const st = $('#volunteerStatus'), btn = $('button[type="submit"]', vf);
      const payload = { name: vf.name.value.trim(), email: vf.email.value.trim(), country: (vf.country ? vf.country.value : '').trim(), summer: vf.summer ? vf.summer.value : '2027', message: (vf.message ? vf.message.value : '').trim() };
      if (!payload.name) return setStatus(st, t(vf, 'msgName', 'Please add your name.'), 'err');
      if (!isEmail(payload.email)) return setStatus(st, t(vf, 'msgEmail', 'That email address does not look right.'), 'err');
      btn.disabled = true; setStatus(st, t(vf, 'msgSending', 'Sending...'));
      try { await postJSON('/api/volunteer', payload); vf.reset(); setStatus(st, t(vf, 'msgOk', 'You are on the list. We will email you the info pack and a reminder when applications open on November 2, 2026.'), 'ok'); }
      catch (err) { setStatus(st, `${t(vf, 'msgFail', 'We could not save that.')} ${err.message}. info@eta4.org`, 'err'); }
      finally { btn.disabled = false; }
    });
  }

  const ef = $('#enrollForm');
  if (ef) {
    ef.addEventListener('submit', async (e) => {
      e.preventDefault();
      const st = $('#enrollStatus'), btn = $('button[type="submit"]', ef);
      const payload = { name: ef.name.value.trim(), email: ef.email.value.trim(), country: 'Vietnam', summer: '2027', message: `[FAMILY ENROLLMENT INTEREST] phone/zalo: ${ef.phone.value.trim()} | student age: ${ef.age.value.trim()} | ${ef.message.value.trim()}` };
      if (!payload.name) return setStatus(st, t(ef, 'msgName', 'Vui lòng nhập tên.'), 'err');
      if (!isEmail(payload.email)) return setStatus(st, t(ef, 'msgEmail', 'Email chưa đúng.'), 'err');
      btn.disabled = true; setStatus(st, t(ef, 'msgSending', 'Đang gửi...'));
      try { await postJSON('/api/volunteer', payload); ef.reset(); setStatus(st, t(ef, 'msgOk', 'Đã nhận. Chúng tôi sẽ liên hệ khi mở đăng ký.'), 'ok'); }
      catch (err) { setStatus(st, `${t(ef, 'msgFail', 'Gửi không thành công.')} ${err.message}. info@eta4.org`, 'err'); }
      finally { btn.disabled = false; }
    });
  }

  const nf = $('#newsletterForm');
  if (nf) {
    nf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const st = $('#newsletterStatus'), email = nf.email.value.trim(), btn = $('button', nf);
      if (!isEmail(email)) return setStatus(st, 'Please enter a valid email.', 'err');
      btn.disabled = true;
      try { await postJSON('/api/newsletter', { email }); nf.reset(); setStatus(st, 'Subscribed. Thank you.', 'ok'); }
      catch (err) { setStatus(st, `Could not subscribe: ${err.message}`, 'err'); }
      finally { btn.disabled = false; }
    });
  }

  // Donate widget
  const give = $('#give');
  if (give) {
    const seg = $$('.seg button', give), amounts = $$('.amounts button', give), custom = $('.custom', give), customInput = $('.custom input', give);
    const impact = $('.impact-line', give), status = $('#donateStatus'), btn = $('#donateBtn');
    let interval = null, amount = 50;
    const impactFor = (a) => {
      if (!a) return '';
      if (a >= 6000) return 'Funds an entire five-week camp.';
      if (a >= 1000) return `Trains ${Math.floor(a / 250)} local volunteers for a summer.`;
      if (a >= 250) return 'Supports a classroom of 20 students for a week.';
      if (a >= 50) return `Provides materials for ${Math.max(1, Math.floor(a / 50))} student${a >= 100 ? 's' : ''} for the full program.`;
      return 'Every dollar goes to the classroom in Hue.';
    };
    const render = () => {
      seg.forEach(b => b.setAttribute('aria-pressed', String((b.dataset.interval || null) === interval)));
      amounts.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.amount === (custom.classList.contains('show') ? 'custom' : String(amount)))));
      impact.textContent = impactFor(amount) + (interval ? ' Every month.' : '');
      btn.textContent = interval ? `Give $${amount || ''} monthly` : `Give $${amount || ''} once`;
    };
    seg.forEach(b => b.addEventListener('click', () => { interval = b.dataset.interval || null; render(); }));
    amounts.forEach(b => b.addEventListener('click', () => {
      if (b.dataset.amount === 'custom') { custom.classList.add('show'); amount = Number(customInput.value) || 0; customInput.focus(); }
      else { custom.classList.remove('show'); amount = Number(b.dataset.amount); }
      setStatus(status, ''); render();
    }));
    customInput.addEventListener('input', () => { amount = Number(customInput.value) || 0; render(); });
    btn.addEventListener('click', async () => {
      if (!amount || amount < 1) return setStatus(status, 'Choose an amount first.', 'err');
      if (amount > 999999) return setStatus(status, 'For gifts above $999,999, please email info@eta4.org.', 'err');
      btn.disabled = true; setStatus(status, 'Opening secure checkout...');
      try { const d = await postJSON('/api/checkout', { amount: Math.round(amount * 100), interval }); location.href = d.url; }
      catch (err) { setStatus(status, err.message, 'err'); btn.disabled = false; }
    });
    render();
  }

  // Map (impact page)
  const mapEl = $('#map');
  if (mapEl && window.L) {
    const map = L.map('map', { scrollWheelZoom: false }).setView([15.2, 108.5], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 18 }).addTo(map);
    const places = [
      ['Hue, Vietnam', 16.4637, 107.5909, 'Home since 2009. Every summer 2009 to 2019. We return here July 2027.', '#8A2B3A'],
      ['Bien Hoa, Vietnam', 10.9447, 106.8226, '2010', '#1D4E5F'],
      ['Da Lat, Vietnam', 11.9404, 108.4583, '2011', '#1D4E5F'],
      ['Duc Linh, Phan Thiet Province', 11.1833, 107.9667, '2013 to 2015', '#1D4E5F'],
      ['Taitung, Taiwan', 22.7583, 121.1444, '2010 to 2011', '#E9B44C']
    ];
    places.forEach(([name, lat, lng, desc, color]) => {
      L.circleMarker([lat, lng], { radius: name.startsWith('Hue') ? 12 : 8, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }).addTo(map)
        .bindPopup(`<strong style="font-family:Bricolage Grotesque,sans-serif">${name}</strong><br>${desc}`);
    });
  }
})();
