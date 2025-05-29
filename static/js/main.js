document.addEventListener('DOMContentLoaded', () => {
    // Initialize various components
    initNavigation();
    initProjectImages();
    initScrollReveal();
    initTypingEffect();
    initParticlesBackground();
    initSkillBars();
});

// Smooth scrolling for anchor links
function initNavigation() {
    const header = document.querySelector('header');
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    // Handle scroll events for hiding/showing navigation
    window.addEventListener('scroll', () => {
        lastScrollY = window.scrollY;
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (lastScrollY > 100) {
                    header.classList.add('nav-scrolled');
                    
                    // Hide nav on scroll down, show on scroll up
                    if (lastScrollY > 500 && lastScrollY > lastScrollTop) {
                        header.classList.add('nav-hidden');
                    } else {
                        header.classList.remove('nav-hidden');
                    }
                } else {
                    header.classList.remove('nav-scrolled');
                }
                
                lastScrollTop = lastScrollY;
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = header.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = targetPosition - headerOffset;
                
                window.scrollBy({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Project image handling
function initProjectImages() {
    // Set background images for project cards
    const projectImages = document.querySelectorAll('.project-image-custom');
    projectImages.forEach(function(image) {
        const imageUrl = image.getAttribute('data-image');
        if (imageUrl) {
            // Set the background image using the data attribute
            image.style.backgroundImage = `url('/static/images/${imageUrl}')`;
        }
    });
}

// Scroll reveal animation
function initScrollReveal() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                // Unobserve after animation has been triggered
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Typing effect for hero section
function initTypingEffect() {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;
    
    const phrases = JSON.parse(typingElement.getAttribute('data-phrases'));
    let currentPhraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    
    function type() {
        const currentPhrase = phrases[currentPhraseIndex];
        
        if (isDeleting) {
            // Remove a character
            typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50; // Faster when deleting
        } else {
            // Add a character
            typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 150; // Slower when typing
        }
        
        // If word is complete
        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typingSpeed = 1500; // Pause at end of word
        }
        
        // If word is deleted
        if (isDeleting && charIndex === 0) {
            isDeleting = false;
            currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
            typingSpeed = 500; // Pause before typing next word
        }
        
        setTimeout(type, typingSpeed);
    }
    
    // Start the typing animation
    setTimeout(type, 1000);
}

// Simple particle background for hero section
function initParticlesBackground() {
    const particlesContainer = document.querySelector('.particles-container');
    if (!particlesContainer) return;
    
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random position, size, and animation duration
        const size = Math.random() * 10 + 3;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const duration = Math.random() * 30 + 10;
        const delay = Math.random() * 5;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Animate skill bars on scroll
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-level');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.width = entry.target.getAttribute('data-width');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    skillBars.forEach(bar => {
        // Initially set width to 0
        const targetWidth = bar.style.width;
        bar.style.width = '0';
        bar.setAttribute('data-width', targetWidth);
        
        observer.observe(bar);
    });
}

// Detect OS and Browser for Tech section
function detectSystemInfo() {
    const osElement = document.querySelector('.system-os');
    const browserElement = document.querySelector('.system-browser');
    
    if (osElement) {
        let osName = 'Unknown OS';
        if (navigator.userAgent.indexOf('Win') !== -1) osName = 'Windows';
        if (navigator.userAgent.indexOf('Mac') !== -1) osName = 'MacOS';
        if (navigator.userAgent.indexOf('Linux') !== -1) osName = 'Linux';
        if (navigator.userAgent.indexOf('Android') !== -1) osName = 'Android';
        if (navigator.userAgent.indexOf('iOS') !== -1) osName = 'iOS';
        
        osElement.textContent = osName;
    }
    
    if (browserElement) {
        let browserName = 'Unknown Browser';
        if (navigator.userAgent.indexOf('Chrome') !== -1) browserName = 'Chrome';
        if (navigator.userAgent.indexOf('Firefox') !== -1) browserName = 'Firefox';
        if (navigator.userAgent.indexOf('Safari') !== -1) browserName = 'Safari';
        if (navigator.userAgent.indexOf('Edge') !== -1) browserName = 'Edge';
        if (navigator.userAgent.indexOf('Opera') !== -1) browserName = 'Opera';
        
        browserElement.textContent = browserName;
    }
}
