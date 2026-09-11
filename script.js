// eta4.org front-end behaviour. No frameworks. Every network call goes to the
// small Bun server in server.ts (same origin).

// ---------- Site constants (single source of truth for dates) ----------
const APPLICATIONS_OPEN = new Date('2026-11-02T08:00:00-08:00'); // Nov 2, 2026, 8am Pacific

// ---------- Mobile navigation ----------
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');
const nav = document.getElementById('nav');

function closeMenu() {
    navToggle.classList.remove('active');
    navMenu.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
}

navToggle.setAttribute('aria-expanded', 'false');
navToggle.setAttribute('aria-controls', 'navMenu');
navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('active');
    navToggle.classList.toggle('active', open);
    navToggle.setAttribute('aria-expanded', String(open));
    if (open) {
        setTimeout(() => {
            const firstLink = navMenu.querySelector('.nav-link');
            if (firstLink) firstLink.focus();
        }, 300);
    }
});

navLinks.forEach(link => link.addEventListener('click', closeMenu));

document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) closeMenu();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        closeMenu();
        navToggle.focus();
    }
});

// ---------- Navbar scroll state + section highlighting (one rAF-throttled listener) ----------
const sectionsWithId = Array.from(document.querySelectorAll('section[id]'));
const navLinksArray = Array.from(navLinks);
let ticking = false;

function onScroll() {
    const y = window.pageYOffset;
    nav.classList.toggle('scrolled', y > 100);

    const navHeight = nav.offsetHeight;
    let current = '';
    for (const section of sectionsWithId) {
        if (y >= section.offsetTop - navHeight - 100) current = section.id;
    }
    for (const link of navLinksArray) {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    }
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
    }
}, { passive: true });

// ---------- Map ----------
function initMap() {
    if (typeof L === 'undefined') return;
    const map = L.map('map', { scrollWheelZoom: false }).setView([16.0, 107.0], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(map);

    const locations = [
        { name: 'Hue, Vietnam', coords: [16.4637, 107.5909], description: 'Our home since 2009. We return here in July 2027.', color: '#FF6B6B' },
        { name: 'Da Lat, Vietnam', coords: [11.9404, 108.4583], description: 'Program location in 2011', color: '#4ECDC4' },
        { name: 'Bien Hoa, Vietnam', coords: [10.9447, 106.8226], description: 'Program location in 2010', color: '#4ECDC4' },
        { name: 'Duc Linh, Phan Thiet Province', coords: [11.1833, 107.9667], description: 'Program location 2013 to 2015', color: '#4ECDC4' },
        { name: 'Taitung, Taiwan', coords: [22.7583, 121.1444], description: 'Program location 2010 to 2011', color: '#FFE66D' }
    ];

    locations.forEach(location => {
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color:${location.color};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.3);"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        L.marker(location.coords, { icon }).addTo(map).bindPopup(
            `<div style="font-family:'Inter',sans-serif;padding:10px;">
                <h3 style="margin:0 0 8px 0;color:#1A1A2E;font-size:16px;font-weight:700;">${location.name}</h3>
                <p style="margin:0;color:#4A5568;font-size:14px;line-height:1.5;">${location.description}</p>
            </div>`
        );
    });
}

if (document.getElementById('map')) initMap();

// ---------- Helpers ----------
function setStatus(el, message, kind) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove('is-error', 'is-success');
    if (kind) el.classList.add(kind === 'error' ? 'is-error' : 'is-success');
}

async function postJSON(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    let data = {};
    try { data = await res.json(); } catch (_) { /* no body */ }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
}

function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ---------- Volunteer interest form ----------
const volunteerForm = document.getElementById('volunteerForm');
const volunteerStatus = document.getElementById('volunteerStatus');

if (volunteerForm) {
    volunteerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = volunteerForm.querySelector('button[type="submit"]');
        const payload = {
            name: volunteerForm.name.value.trim(),
            email: volunteerForm.email.value.trim(),
            country: volunteerForm.country.value.trim(),
            summer: volunteerForm.summer.value,
            message: volunteerForm.message.value.trim()
        };
        if (!payload.name) return setStatus(volunteerStatus, 'Please add your name.', 'error');
        if (!isEmail(payload.email)) return setStatus(volunteerStatus, 'That email address does not look right.', 'error');

        button.disabled = true;
        setStatus(volunteerStatus, 'Sending...');
        try {
            await postJSON('/api/volunteer', payload);
            volunteerForm.reset();
            setStatus(volunteerStatus, 'You are on the list. We will email the info pack and a reminder when applications open on November 2, 2026.', 'success');
        } catch (err) {
            setStatus(volunteerStatus, `We could not save that. ${err.message}. You can also email info@eta4.org.`, 'error');
        } finally {
            button.disabled = false;
        }
    });
}

// ---------- Newsletter ----------
const newsletterForm = document.getElementById('newsletterForm');
const newsletterStatus = document.getElementById('newsletterStatus');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = newsletterForm.email.value.trim();
        if (!isEmail(email)) return setStatus(newsletterStatus, 'Please enter a valid email.', 'error');
        const button = newsletterForm.querySelector('button');
        button.disabled = true;
        try {
            await postJSON('/api/newsletter', { email });
            newsletterForm.reset();
            setStatus(newsletterStatus, 'Subscribed. Thank you.', 'success');
        } catch (err) {
            setStatus(newsletterStatus, `Could not subscribe: ${err.message}`, 'error');
        } finally {
            button.disabled = false;
        }
    });
}

// ---------- Donations (Stripe Checkout via /api/checkout) ----------
const amountButtons = document.querySelectorAll('.amount-btn');
const customAmountDiv = document.getElementById('customAmount');
const customAmountInput = document.getElementById('customAmountInput');
const donateBtn = document.getElementById('donateBtn');
const donateStatus = document.getElementById('donateStatus');
const oneTimeBtn = document.getElementById('oneTimeBtn');
const monthlyBtn = document.getElementById('monthlyBtn');
const recurringMessage = document.getElementById('recurringMessage');
let selectedAmount = null;
let donationType = 'one-time';

amountButtons.forEach(button => {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
        amountButtons.forEach(btn => { btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false'); });
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
        const amount = button.dataset.amount;
        if (amount === 'custom') {
            customAmountDiv.style.display = 'block';
            selectedAmount = Number(customAmountInput.value) || null;
            customAmountInput.focus();
        } else {
            customAmountDiv.style.display = 'none';
            selectedAmount = Number(amount);
        }
        setStatus(donateStatus, '');
    });
});

if (customAmountInput) {
    customAmountInput.addEventListener('input', (e) => {
        selectedAmount = Number(e.target.value) || null;
    });
}

function setDonationType(type) {
    donationType = type;
    const monthly = type === 'monthly';
    monthlyBtn.classList.toggle('active', monthly);
    oneTimeBtn.classList.toggle('active', !monthly);
    monthlyBtn.setAttribute('aria-pressed', String(monthly));
    oneTimeBtn.setAttribute('aria-pressed', String(!monthly));
    recurringMessage.style.display = monthly ? 'block' : 'none';
    donateBtn.textContent = monthly ? 'Give monthly with card' : 'Donate with card';
}

if (oneTimeBtn && monthlyBtn) {
    oneTimeBtn.addEventListener('click', () => setDonationType('one-time'));
    monthlyBtn.addEventListener('click', () => setDonationType('monthly'));
    setDonationType('one-time');
}

if (donateBtn) {
    donateBtn.addEventListener('click', async () => {
        if (!selectedAmount || selectedAmount < 1) {
            return setStatus(donateStatus, 'Choose an amount first.', 'error');
        }
        if (selectedAmount > 999999) {
            return setStatus(donateStatus, 'For gifts above $999,999 please email info@eta4.org and we will arrange it personally.', 'error');
        }
        donateBtn.disabled = true;
        setStatus(donateStatus, 'Opening secure checkout...');
        try {
            const data = await postJSON('/api/checkout', {
                amount: Math.round(selectedAmount * 100),
                interval: donationType === 'monthly' ? 'month' : null
            });
            window.location.href = data.url;
        } catch (err) {
            setStatus(donateStatus, `${err.message}`, 'error');
            donateBtn.disabled = false;
        }
    });
}

// ---------- Scroll-in animation (starts visible; only adds motion when supported) ----------
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.story-card, .program-card, .pillar').forEach((el, index) => {
        el.style.transitionDelay = `${(index % 4) * 0.1}s`;
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// ---------- Smooth scroll for in-page anchors ----------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.pageYOffset - nav.offsetHeight;
        window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        history.replaceState(null, '', href);
    });
});

// ---------- Hero stat counters ----------
function animateCounter(element, target, duration = 1600) {
    if (prefersReducedMotion) {
        element.textContent = target.toLocaleString('en-US') + (element.textContent.includes('+') ? '+' : '');
        return;
    }
    const hasPlus = element.textContent.includes('+');
    const startTime = performance.now();
    function frame(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = Math.floor(target * eased);
        element.textContent = value.toLocaleString('en-US') + (t === 1 && hasPlus ? '+' : '');
        if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            const statNumber = entry.target.querySelector('.stat-number');
            const num = parseInt(statNumber.dataset.count, 10);
            if (!isNaN(num)) animateCounter(statNumber, num);
            entry.target.dataset.animated = 'true';
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => statsObserver.observe(stat));

// ---------- Announcement banner ----------
const urgencyBanner = document.getElementById('urgencyBanner');
const urgencyClose = document.querySelector('.urgency-close');

function hideBanner() {
    urgencyBanner.classList.add('hidden');
    nav.style.top = '0';
}

if (urgencyClose) {
    urgencyClose.addEventListener('click', () => {
        hideBanner();
        try { localStorage.setItem('bannerClosed:2027', 'true'); } catch (_) { /* private mode */ }
    });
}

try {
    if (localStorage.getItem('bannerClosed:2027') === 'true') hideBanner();
} catch (_) { /* private mode */ }

// ---------- FAQ accordion ----------
document.querySelectorAll('.faq-question').forEach(question => {
    question.setAttribute('aria-expanded', 'false');
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        const isActive = faqItem.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
            item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });
        if (!isActive) {
            faqItem.classList.add('active');
            question.setAttribute('aria-expanded', 'true');
        }
    });
});

// ---------- Countdown to application opening ----------
function initCountdown() {
    const countdown = document.getElementById('countdown');
    const label = document.getElementById('countdownLabel');
    const ids = ['days', 'hours', 'minutes', 'seconds'];

    function update() {
        const distance = APPLICATIONS_OPEN.getTime() - Date.now();
        if (distance <= 0) {
            label.textContent = 'Applications are open';
            countdown.innerHTML = '<a href="mailto:info@eta4.org?subject=Summer%202027%20volunteer%20application" class="btn btn-primary">Apply for Summer 2027</a>';
            return false;
        }
        const values = [
            Math.floor(distance / 86400000),
            Math.floor((distance % 86400000) / 3600000),
            Math.floor((distance % 3600000) / 60000),
            Math.floor((distance % 60000) / 1000)
        ];
        ids.forEach((id, i) => { document.getElementById(id).textContent = String(values[i]); });
        return true;
    }

    if (update()) {
        const timer = setInterval(() => { if (!update()) clearInterval(timer); }, 1000);
    }
}

if (document.getElementById('countdown')) initCountdown();

// ---------- Footer year ----------
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
