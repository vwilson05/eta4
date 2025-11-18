// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Navbar scroll effect
const nav = document.getElementById('nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Interactive Map with Leaflet
function initMap() {
    // Center on Vietnam
    const map = L.map('map').setView([16.0, 107.0], 6);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(map);

    // Define locations with coordinates based on actual program history
    const locations = [
        {
            name: 'Hue, Vietnam',
            coords: [16.4637, 107.5909],
            description: 'Our primary location since 2009. Planning to restart here in 2026!',
            color: '#FF6B6B'
        },
        {
            name: 'Da Lat, Vietnam',
            coords: [11.9404, 108.4583],
            description: 'Program location in 2011',
            color: '#4ECDC4'
        },
        {
            name: 'Bien Hoa, Vietnam',
            coords: [10.9447, 106.8226],
            description: 'Program location in 2010',
            color: '#4ECDC4'
        },
        {
            name: 'Duc Linh, Phan Thiet Province',
            coords: [11.1833, 107.9667],
            description: 'Program location 2013-2015 (town in Phan Thiet Province)',
            color: '#4ECDC4'
        },
        {
            name: 'Taitung, Taiwan',
            coords: [22.7583, 121.1444],
            description: 'Program location 2010-2011',
            color: '#FFE66D'
        }
    ];

    // Add markers for each location
    locations.forEach(location => {
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background-color: ${location.color};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
            "></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const marker = L.marker(location.coords, { icon: customIcon }).addTo(map);
        marker.bindPopup(`
            <div style="font-family: 'Inter', sans-serif; padding: 10px;">
                <h3 style="margin: 0 0 8px 0; color: #1A1A2E; font-size: 16px; font-weight: 700;">${location.name}</h3>
                <p style="margin: 0; color: #4A5568; font-size: 14px; line-height: 1.5;">${location.description}</p>
            </div>
        `);
    });

    // Add CSS for marker pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Initialize map when DOM is loaded
if (document.getElementById('map')) {
    initMap();
}

// Volunteer Form Handling
const volunteerForm = document.getElementById('volunteerForm');

volunteerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        country: document.getElementById('country').value,
        summer: document.getElementById('summer').value,
        message: document.getElementById('message').value
    };

    // Here you would typically send this to a backend
    console.log('Volunteer form submitted:', formData);

    // Show success message
    alert('Thank you for your interest in volunteering! We will contact you soon with more information.');

    // Reset form
    volunteerForm.reset();
});

// Donation Amount Selection
const amountButtons = document.querySelectorAll('.amount-btn');
const customAmountDiv = document.getElementById('customAmount');
const customAmountInput = document.getElementById('customAmountInput');
const donateBtn = document.getElementById('donateBtn');
let selectedAmount = null;

amountButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        amountButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        button.classList.add('active');

        const amount = button.dataset.amount;

        if (amount === 'custom') {
            customAmountDiv.style.display = 'block';
            selectedAmount = null;
            customAmountInput.focus();
        } else {
            customAmountDiv.style.display = 'none';
            selectedAmount = amount;
        }
    });
});

customAmountInput.addEventListener('input', (e) => {
    selectedAmount = e.target.value;
});

donateBtn.addEventListener('click', () => {
    if (!selectedAmount || selectedAmount <= 0) {
        alert('Please select or enter a donation amount');
        return;
    }

    // Here you would typically integrate with a payment processor
    console.log('Donation amount:', selectedAmount);
    alert(`Thank you for your generous donation of $${selectedAmount}! You will be redirected to our secure payment processor.`);

    // In a real implementation, redirect to payment processor
    // window.location.href = `payment-processor-url?amount=${selectedAmount}`;
});

// Newsletter Form
const newsletterForm = document.querySelector('.newsletter-form');

newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = e.target.querySelector('input[type="email"]').value;

    // Here you would typically send this to a backend
    console.log('Newsletter signup:', email);

    alert('Thank you for subscribing to our newsletter!');
    newsletterForm.reset();
});

// Scroll Animations (Intersection Observer)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all sections for fade-in animations
const sections = document.querySelectorAll('section');
sections.forEach(section => {
    section.classList.add('fade-in');
    observer.observe(section);
});

// Observe story cards individually for staggered animation
const storyCards = document.querySelectorAll('.story-card');
storyCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
    card.classList.add('fade-in');
    observer.observe(card);
});

// Observe program cards
const programCards = document.querySelectorAll('.program-card');
programCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
    card.classList.add('fade-in');
    observer.observe(card);
});

// Observe pillars
const pillars = document.querySelectorAll('.pillar');
pillars.forEach((pillar, index) => {
    pillar.style.transitionDelay = `${index * 0.1}s`;
    pillar.classList.add('fade-in');
    observer.observe(pillar);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Don't prevent default for empty href or just "#"
        if (href === '#' || href === '') return;

        e.preventDefault();

        const target = document.querySelector(href);
        if (target) {
            const navHeight = nav.offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Counter animation for hero stats
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;
    const originalText = element.textContent;
    const hasPlus = originalText.includes('+');

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            // Format final number with commas
            const formatted = target.toLocaleString('en-US');
            element.textContent = hasPlus ? formatted + '+' : formatted;
            clearInterval(timer);
        } else {
            // Format intermediate numbers with commas
            element.textContent = Math.floor(current).toLocaleString('en-US');
        }
    }, 16);
}

// Animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            const statNumber = entry.target.querySelector('.stat-number');

            // Use data-count attribute for the actual number
            const count = statNumber.dataset.count;
            const num = parseInt(count);

            if (!isNaN(num)) {
                animateCounter(statNumber, num);
            }

            entry.target.dataset.animated = 'true';
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => {
    statsObserver.observe(stat);
});

// Add loading state to forms
function addFormLoadingState(form, button) {
    form.addEventListener('submit', () => {
        button.disabled = true;
        button.textContent = 'Processing...';

        // Re-enable after a delay (in real app, this would happen after server response)
        setTimeout(() => {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Submit';
        }, 1000);
    });
}

// Store original button text
const submitButtons = document.querySelectorAll('button[type="submit"]');
submitButtons.forEach(button => {
    button.dataset.originalText = button.textContent;
});

// Parallax effect for hero section (optional, subtle effect)
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero-background');

    if (heroBackground && scrolled < window.innerHeight) {
        heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Add active state to nav links based on scroll position
const navLinksArray = Array.from(navLinks);

window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section[id]');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        const navHeight = nav.offsetHeight;

        if (window.pageYOffset >= (sectionTop - navHeight - 100)) {
            current = section.getAttribute('id');
        }
    });

    navLinksArray.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Add hover effect to images (optional enhancement)
const storyImages = document.querySelectorAll('.story-image');
storyImages.forEach(image => {
    image.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.transition = 'transform 0.3s ease';
    });

    image.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// Console welcome message
console.log('%c Welcome to eta4.org! ', 'background: #FF6B6B; color: white; font-size: 20px; padding: 10px; border-radius: 5px;');
console.log('Interested in the tech behind this site? We welcome contributions! Visit our GitHub or reach out to learn more.');

// Performance: Lazy load images (if you add more images later)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            }
        });
    });

    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Accessibility: Focus management for mobile menu
navToggle.addEventListener('click', () => {
    if (navMenu.classList.contains('active')) {
        // Focus first link when menu opens
        setTimeout(() => {
            const firstLink = navMenu.querySelector('.nav-link');
            if (firstLink) firstLink.focus();
        }, 300);
    }
});

// Keyboard navigation for mobile menu
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        navToggle.focus();
    }
});

console.log('Website initialized successfully!');
