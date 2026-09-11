// eta4 story pieces: the Kite Field (home) and A Day at Camp (programs).
// Plain JS, canvas 2D, no libraries. Respects prefers-reduced-motion.
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  // =====================================================================
  // KITE FIELD
  // =====================================================================
  const kf = $('#kitefield');
  if (kf) {
    const lang = document.documentElement.lang === 'vi' ? 'vi' : 'en';
    const fmt = (n) => n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
    const YEARS = [
      { y: 2009, n: 350, cities: 'Hue', en: 'One school in Hue. Three hundred and fifty kids, a handful of volunteers, and no idea it would last ten summers.', vi: 'Một trường ở Huế. 350 học sinh, vài tình nguyện viên, và chưa ai biết sẽ kéo dài mười mùa hè.' },
      { y: 2010, n: 1100, cities: 'Hue, Bien Hoa, Taitung', en: 'Three cities in two countries. The camp learns to travel.', vi: 'Ba thành phố, hai quốc gia. Trại hè học cách đi xa.' },
      { y: 2011, n: 1300, cities: 'Hue, Da Lat, Taitung', en: 'Da Lat joins. Volunteers start coming back for a second summer.', vi: 'Đà Lạt tham gia. Tình nguyện viên bắt đầu quay lại mùa hè thứ hai.' },
      { y: 2012, n: 1100, cities: 'Hue', en: 'Back to one city, on purpose. Depth over breadth, for the first time.', vi: 'Quay về một thành phố, có chủ đích. Sâu hơn thay vì rộng hơn.' },
      { y: 2013, n: 2000, cities: 'Hue, Duc Linh', en: 'A record year, and the summer Linh was a student. She runs the Hue program now.', vi: 'Năm kỷ lục, và là mùa hè Linh còn là học sinh. Giờ Linh điều phối chương trình ở Huế.' },
      { y: 2014, n: 2300, cities: 'Hue, Duc Linh', en: 'Two thousand three hundred students. The showcase needs a bigger courtyard.', vi: '2.300 học sinh. Buổi biểu diễn cần một sân trường lớn hơn.' },
      { y: 2015, n: 2500, cities: 'Hue, Duc Linh', en: 'The peak. Two and a half thousand kites in one summer.', vi: 'Đỉnh cao. Hai nghìn rưỡi cánh diều trong một mùa hè.' },
      { y: 2016, n: 1000, cities: 'Hue', en: 'Smaller, steadier. A thousand a year, and local volunteers teaching year-round.', vi: 'Nhỏ hơn, vững hơn. Một nghìn em mỗi năm, tình nguyện viên địa phương dạy quanh năm.' },
      { y: 2017, n: 1000, cities: 'Hue', en: 'The eighth summer.', vi: 'Mùa hè thứ tám.' },
      { y: 2018, n: 1000, cities: 'Hue', en: 'The ninth.', vi: 'Mùa hè thứ chín.' },
      { y: 2019, n: 600, cities: 'Hue', en: 'The last summer before the pause. Nobody knew.', vi: 'Mùa hè cuối trước khi tạm dừng. Không ai biết trước.' },
    ];
    const TOTAL = YEARS.reduce((s, y) => s + y.n, 0);
    const T = lang === 'vi' ? {
      introYear: '2009 đến 2027', introTitle: 'Tiếng Anh mở cánh cửa. Chúng tôi giữ cửa mở.',
      introLine: 'Mỗi cánh diều trên bầu trời này là một học sinh đã học tiếng Anh ở trại hè eta4. Cuộn xuống để bay qua các năm.',
      pauseYear: '2020 đến 2026', pauseTitle: 'Bầu trời lặng đi.', pauseLine: 'COVID đóng biên giới. Rồi cuộc sống cuốn đi. Sáu mùa hè không có trại.',
      returnYear: '2027', returnTitle: 'Chúng tôi bay trở lại.', returnLine: 'Huế, 5 tháng 7 đến 6 tháng 8, 2027. Năm mươi tình nguyện viên, giáo viên Việt Nam ở mỗi lớp, và tất cả những cánh diều phía sau họ.',
      kites: 'cánh diều. Mỗi cánh diều là một học sinh.', students: 'học sinh', live: 'cánh diều mới kể từ khi công bố trở lại', eyebrowYear: (c) => c,
    } : {
      introYear: '2009 to 2027', introTitle: 'English opens doors. We hold them open.',
      introLine: 'Every kite in this sky is one student who learned English at an eta4 summer camp. Scroll to fly through the years.',
      pauseYear: '2020 to 2026', pauseTitle: 'The sky went quiet.', pauseLine: 'COVID closed the borders. Then life happened. Six summers without a camp.',
      returnYear: '2027', returnTitle: 'We fly again.', returnLine: 'Hue, July 5 to August 6, 2027. Fifty volunteers, local co-teachers in every class, and every kite you see behind them.',
      kites: 'kites. One per student.', students: 'students', live: 'new kites since we announced the return', eyebrowYear: (c) => c,
    };

    const canvas = $('.kf-canvas', kf), sticky = $('.kf-sticky', kf);
    const ui = { eyebrow: $('#kfEyebrow'), year: $('#kfYear'), title: $('#kfTitle'), line: $('#kfLine'), count: $('#kfCount'), countLabel: $('#kfCountLabel'), cta: $('#kfCta'), live: $('#kfLive'), bar: $('#kfBar') };
    const CHAPTERS = 1 + YEARS.length + 2; // intro, years, pause, return
    const ctx = canvas.getContext('2d', { alpha: false });
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const COLORS = [['#8A2B3A', '#1D4E5F', '#E9B44C', '#F5F1E8'], ['#E9B44C', '#8A2B3A', '#F5F1E8', '#1D4E5F'], ['#F5F1E8', '#E9B44C', '#8A2B3A', '#1D4E5F'], ['#1D4E5F', '#F5F1E8', '#E9B44C', '#8A2B3A']];
    let W = 0, H = 0, kites = [], sprites = [], staticLayer = null, bakedUpTo = -1, named = [], liveExtra = 0, returnKites = [];
    let currentChapter = -1, running = false, raf = 0, lastP = -1;

    function makeSprite(colors, size) {
      const s = Math.ceil(size * DPR), c = document.createElement('canvas'); c.width = s; c.height = Math.ceil(s * 1.45);
      const g = c.getContext('2d'); const w = s, h = s * 1.3, cx = w / 2, cy = h * 0.45;
      const tri = (a, b, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy); g.lineTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.closePath(); g.fill(); };
      const top = [cx, 0], right = [w, cy], bottom = [cx, h], left = [0, cy];
      tri(top, right, colors[0]); tri(right, bottom, colors[1]); tri(bottom, left, colors[2]); tri(left, top, colors[3]);
      g.strokeStyle = colors[0]; g.lineWidth = Math.max(1, s * 0.08); g.beginPath(); g.moveTo(cx, h); g.quadraticCurveTo(cx + s * 0.15, h + s * 0.08, cx - s * 0.05, c.height); g.stroke();
      return c;
    }

    function layout() {
      const r = sticky.getBoundingClientRect(); W = Math.max(320, Math.round(r.width)); H = Math.max(400, Math.round(r.height));
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      const area = W * H * 0.78, per = area / (TOTAL + 60);
      const base = clamp(Math.sqrt(per) * 0.62, 2.2, 9);
      sprites = COLORS.map(c => makeSprite(c, base * 1.6));
      // Positions: uniform over the sky, keeping the lower-left copy block clearer on wide screens
      const rand = mulberry32(20090705);
      kites = [];
      YEARS.forEach((yr, yi) => {
        for (let i = 0; i < yr.n; i++) {
          const x = rand() * W, y = 0.04 * H + rand() * 0.86 * H;
          kites.push({ x, y, s: base * (0.75 + rand() * 0.7), c: (rand() * 4) | 0, ph: rand() * 6.283, yi, sp: 0.4 + rand() * 0.8 });
        }
      });
      const rr = mulberry32(2027);
      returnKites = Array.from({ length: 50 }, () => ({ x: rr() * W, y: 0.1 * H + rr() * 0.7 * H, s: base * 2.4, c: 1, ph: rr() * 6.283, sp: 1 }));
      staticLayer = document.createElement('canvas'); staticLayer.width = canvas.width; staticLayer.height = canvas.height;
      bakedUpTo = -1;
      kf.style.height = `${Math.round(CHAPTERS * 0.5 + 1) * 100}vh`;
      if (reduceMotion) kf.style.height = '100vh';
      lastP = -1;
    }

    function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

    function drawKite(g, k, x, y, alpha, scale) {
      const sp = sprites[k.c]; const w = k.s * (scale || 1), h = w * 1.45;
      g.globalAlpha = alpha; g.drawImage(sp, (x - w / 2) * DPR, (y - h * 0.45) * DPR, w * DPR, h * DPR);
    }

    function bake(upTo) {
      // Draw all kites of years <= upTo onto the static layer at rest positions.
      const g = staticLayer.getContext('2d');
      if (upTo < bakedUpTo) { g.clearRect(0, 0, staticLayer.width, staticLayer.height); bakedUpTo = -1; }
      for (let yi = bakedUpTo + 1; yi <= upTo; yi++) {
        for (const k of kites) if (k.yi === yi) drawKite(g, k, k.x, k.y, 1, 1);
      }
      g.globalAlpha = 1; bakedUpTo = upTo;
    }

    function sky(t) {
      ctx.globalAlpha = 1; ctx.fillStyle = '#143A47'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      // faint horizon glow
      const gr = ctx.createRadialGradient(canvas.width * 0.7, canvas.height * 1.05, 10, canvas.width * 0.7, canvas.height * 1.05, canvas.height * 0.9);
      gr.addColorStop(0, 'rgba(233,180,76,0.18)'); gr.addColorStop(1, 'rgba(233,180,76,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function setCopy(ch) {
      if (ch === currentChapter) return; currentChapter = ch;
      ui.cta.hidden = true; ui.live.hidden = true; ui.count.parentElement.hidden = false;
      if (ch === 0) { ui.eyebrow.textContent = 'Hue, Vietnam'; ui.year.textContent = T.introYear; ui.title.textContent = T.introTitle; ui.line.textContent = T.introLine; ui.count.textContent = fmt(TOTAL); ui.countLabel.textContent = T.kites; }
      else if (ch <= YEARS.length) { const y = YEARS[ch - 1]; const cum = YEARS.slice(0, ch).reduce((s, q) => s + q.n, 0); ui.eyebrow.textContent = y.cities; ui.year.textContent = String(y.y); ui.title.textContent = `${fmt(y.n)} ${T.students}.`; ui.line.textContent = y[lang]; ui.count.textContent = fmt(cum); ui.countLabel.textContent = T.kites; }
      else if (ch === YEARS.length + 1) { ui.eyebrow.textContent = ''; ui.year.textContent = T.pauseYear; ui.title.textContent = T.pauseTitle; ui.line.textContent = T.pauseLine; ui.count.textContent = fmt(TOTAL); ui.countLabel.textContent = T.kites; }
      else { ui.eyebrow.textContent = 'Hue, Vietnam'; ui.year.textContent = T.returnYear; ui.title.textContent = T.returnTitle; ui.line.textContent = T.returnLine; ui.count.textContent = fmt(TOTAL + 50 + liveExtra); ui.countLabel.textContent = T.kites; ui.cta.hidden = false; if (liveExtra > 0 || named.length) { ui.live.hidden = false; ui.live.innerHTML = `<b>${fmt(liveExtra + named.length)}</b> ${T.live}`; } }
      kf.dataset.chapter = String(ch);
    }

    function frame(now) {
      raf = 0;
      const rect = kf.getBoundingClientRect(); const vh = window.innerHeight;
      const total = rect.height - vh; const p = reduceMotion ? 1 : clamp(-rect.top / Math.max(1, total), 0, 1);
      const cf = p * (CHAPTERS - 1); const ch = Math.min(CHAPTERS - 1, Math.floor(cf)); const t = cf - ch;
      setCopy(ch); if (ui.bar) ui.bar.style.transform = `scaleX(${p})`;
      const time = now / 1000; const swayX = Math.sin(time * 0.5) * 3, swayY = Math.cos(time * 0.37) * 2;
      sky(time);
      const lastYear = YEARS.length; // chapter index of 2019
      if (ch === 0) {
        // intro: the whole field, softly
        bake(lastYear - 1); ctx.globalAlpha = 0.9; ctx.drawImage(staticLayer, swayX * DPR, swayY * DPR);
      } else if (ch <= lastYear) {
        const yi = ch - 1; bake(yi - 1);
        ctx.globalAlpha = 1; ctx.drawImage(staticLayer, swayX * DPR, swayY * DPR);
        if (ch === 1 && t < 0.35) {
          // dissolve the full intro field while 2009 rises
          const full = document.createElement('canvas'); full.width = 1; full.height = 1; // placeholder to keep types simple
          ctx.globalAlpha = 0.9 * (1 - t / 0.35);
          for (const k of kites) if (k.yi > 0 && (k.ph * 1000 | 0) % 3 === 0) drawKite(ctx, k, k.x, k.y - t * 60, ctx.globalAlpha, 1);
        }
        // current year rising in
        const cur = kites.filter(k => k.yi === yi); const n = cur.length;
        for (let i = 0; i < n; i++) {
          const k = cur[i]; const kt = clamp((t * 1.15 - (i / n) * 0.55) / 0.45, 0, 1); if (kt <= 0) continue;
          const e = ease(kt); const y = k.y + (1 - e) * (H * 0.35 + 40) + Math.sin(time * k.sp + k.ph) * 2 * (1 - e * 0.5);
          const x = k.x + Math.sin(time * 0.8 + k.ph) * 3 * (1 - e);
          drawKite(ctx, k, x, y, Math.min(1, kt * 1.4), 1 + (1 - e) * 0.6);
        }
      } else if (ch === lastYear + 1) {
        bake(lastYear - 1); const a = 1 - 0.7 * ease(t); ctx.globalAlpha = a; ctx.drawImage(staticLayer, swayX * DPR, (swayY - t * 90) * DPR);
      } else {
        bake(lastYear - 1); ctx.globalAlpha = 0.34; ctx.drawImage(staticLayer, swayX * DPR, (swayY - 90) * DPR);
        // 50 volunteer kites + live kites rise
        const all = returnKites.concat(named.map(nk => nk.k)); const n = all.length;
        for (let i = 0; i < n; i++) {
          const k = all[i]; const kt = clamp((t * 1.2 - (i / n) * 0.5) / 0.5, 0, 1); if (kt <= 0) continue; const e = ease(kt);
          const y = k.y + (1 - e) * (H * 0.4) + Math.sin(time * k.sp + k.ph) * 4; const x = k.x + Math.sin(time * 0.6 + k.ph) * 5;
          drawKite(ctx, k, x, y, Math.min(1, kt * 1.5), 1);
          const nk = named[i - returnKites.length]; if (nk && e > 0.9) { ctx.globalAlpha = 0.9; ctx.fillStyle = '#F5F1E8'; ctx.font = `${Math.round(12 * DPR)}px "Be Vietnam Pro", sans-serif`; ctx.fillText(nk.label, (x + k.s * 0.9) * DPR, (y + 4) * DPR); }
        }
      }
      ctx.globalAlpha = 1;
      if (running && !reduceMotion) raf = requestAnimationFrame(frame);
    }

    function start() { if (!raf) raf = requestAnimationFrame(frame); }
    const io = new IntersectionObserver(entries => { running = entries.some(e => e.isIntersecting); if (running) start(); }, { threshold: 0 });
    io.observe(kf);
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); start(); }, 150); });
    layout(); start();

    // Live kites: approved alumni (named) + signups since the return was announced
    fetch('/api/stats').then(r => r.json()).then(d => {
      liveExtra = (d.volunteer_interest || 0) + (d.newsletter || 0);
      const rr = mulberry32(99);
      named = (d.alumni || []).slice(0, 60).map(a => ({ label: `${a.name}, ${a.year}`, k: { x: 0.1 * W + rr() * 0.8 * W, y: 0.12 * H + rr() * 0.6 * H, s: 14, c: 2, ph: rr() * 6.283, sp: 0.7 } }));
      currentChapter = -1; start();
    }).catch(() => {});
  }

  // =====================================================================
  // A DAY AT CAMP
  // =====================================================================
  const day = $('#day');
  if (day) {
    const frames = $$('.day-frames img', day), steps = $$('.day-step', day), clock = $('#dayTime'), track = $('.day-steps', day);
    const times = steps.map(s => { const [h, m] = s.dataset.time.split(':').map(Number); return h * 60 + m; });
    const pad = (n) => String(n).padStart(2, '0');
    const show = (i) => { frames.forEach((f, j) => f.classList.toggle('on', j === Number(steps[i].dataset.frame))); steps.forEach((s, j) => s.classList.toggle('on', j === i)); };
    let active = 0; show(0);
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { active = steps.indexOf(e.target); show(active); } });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(s => io.observe(s));
    const tick = () => {
      if (!clock) return;
      const vh = window.innerHeight; const i = active; const r = steps[i].getBoundingClientRect();
      const f = clamp((vh * 0.55 - r.top) / Math.max(1, r.height), 0, 1);
      const next = Math.min(times.length - 1, i + 1);
      const mins = Math.round(times[i] + (times[next] - times[i]) * f * 0.9);
      clock.textContent = `${Math.floor(mins / 60)}:${pad(mins % 60)}`;
    };
    if (!reduceMotion) { window.addEventListener('scroll', tick, { passive: true }); tick(); } else if (clock) clock.textContent = '7:30';
  }
})();
