// DOM Elements
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxClose = document.querySelector('#lightbox .lightbox-close');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// Gallery lightbox elements
const galleryLightbox = document.querySelector('.gallery-lightbox');
const galleryLightboxImg = document.querySelector('.lightbox-img');
const galleryLightboxClose = document.querySelector('.gallery-lightbox .lightbox-close');
const galleryLightboxCaption = document.querySelector('.lightbox-caption');

// Gallery state
let currentGallery = [];
let currentImageIndex = 0;
let fastRouteSlider, idealRouteSlider;

// Performance monitoring
let performanceMetrics = {
    imageLoadTimes: [],
    failedImages: [],
    webpSupported: null
};

// Check WebP support
function checkWebPSupport() {
    if (performanceMetrics.webpSupported !== null) {
        return Promise.resolve(performanceMetrics.webpSupported);
    }

    return new Promise((resolve) => {
        const webp = new Image();
        webp.onload = webp.onerror = function () {
            performanceMetrics.webpSupported = (webp.height === 2);
            resolve(performanceMetrics.webpSupported);
        };
        webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeNavigation();
    checkWebPSupport().then(() => {
        initializeOptimizedImageLoading();
    });
    initializeGallery();
    initializeLightbox();
    initializeSliders();
    initializeTabs();
    initializeScrollEffects();

    // Register service worker for caching
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);

                // Request cache cleanup after 5 minutes
                setTimeout(() => {
                    if (registration.active) {
                        registration.active.postMessage({ type: 'CACHE_CLEANUP' });
                    }
                }, 300000);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    // Hamburger menu toggle
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');

            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            scrollToSection(targetId.substring(1));
        });
    });

    // Update active nav link on scroll (throttled for performance)
    window.addEventListener('scroll', throttle(updateActiveNavLink, 16)); // 60fps
}

// Scroll to section
function scrollToSection(sectionId) {
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = targetSection.offsetTop - navbarHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Optimized Image Loading with Intersection Observer
function initializeOptimizedImageLoading() {
    // Create intersection observer for lazy loading
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadImageOptimized(img);
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });

    // Observe all images
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        // Add loading placeholder
        img.classList.add('lazy-loading');
        imageObserver.observe(img);
    });

    // Preload critical images (hero and first gallery section)
    loadCriticalImages();
}

function loadImageOptimized(img) {
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
        // Get responsive image source
        const responsiveSrc = getResponsiveImageSrc(img.src);

        const newImg = new Image();

        newImg.onload = function () {
            const loadTime = performance.now() - startTime;
            performanceMetrics.imageLoadTimes.push(loadTime);

            // Remove loading placeholder
            img.classList.remove('lazy-loading');

            // Optimize image for display size if needed
            const optimizedSrc = shouldOptimizeImage(newImg, img) ?
                optimizeImageForSize(newImg, img) : responsiveSrc;

            // Update src with optimized version
            img.src = optimizedSrc;

            // Add loaded class for animation
            img.classList.add('loaded');
            img.classList.add('performance-optimized');
            resolve();
        };

        newImg.onerror = function () {
            performanceMetrics.failedImages.push(img.src);
            img.classList.remove('lazy-loading');

            // Try fallback to original image
            if (responsiveSrc !== img.src) {
                newImg.src = img.src;
            } else {
                reject();
            }
        };

        // Start loading
        newImg.src = responsiveSrc;
    });
}

// Get responsive image source based on screen size and device capabilities
function getResponsiveImageSrc(originalSrc) {
    const screenWidth = window.innerWidth;
    const pixelRatio = window.devicePixelRatio || 1;
    const connection = navigator.connection;

    // For very slow connections, return original
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
        return originalSrc;
    }

    // Check if WebP is supported and we should use it
    if (performanceMetrics.webpSupported && screenWidth > 768) {
        // For now, return original since we don't have WebP versions
        // In production, this would return a WebP version
        return originalSrc;
    }

    return originalSrc;
}

// Determine if an image should be optimized based on size and connection
function shouldOptimizeImage(sourceImg, targetImg) {
    const rect = targetImg.getBoundingClientRect();
    const displayWidth = rect.width || 400;
    const connection = navigator.connection;

    // Don't optimize if image is small
    if (displayWidth < 200) return false;

    // Don't optimize on slow connections
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
        return false;
    }

    // Optimize if source image is significantly larger than display size
    return sourceImg.naturalWidth > displayWidth * 1.5;
}

function optimizeImageForSize(sourceImg, targetImg) {
    // Get the display size of the target image
    const rect = targetImg.getBoundingClientRect();
    const displayWidth = rect.width || 400;
    const displayHeight = rect.height || 300;

    // Create canvas for resizing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Calculate optimal size (2x for retina displays, but capped)
    const maxWidth = Math.min(displayWidth * 2, 800);
    const maxHeight = Math.min(displayHeight * 2, 600);

    // Set canvas size to optimal size
    canvas.width = maxWidth;
    canvas.height = maxHeight;

    // Draw and compress image
    ctx.drawImage(sourceImg, 0, 0, maxWidth, maxHeight);

    // Return compressed image as data URL with reduced quality
    return canvas.toDataURL('image/jpeg', 0.8);
}

function loadCriticalImages() {
    // Load hero background image first
    const heroImg = new Image();
    heroImg.src = 'images/first_block_bg/IMG_8507.JPG';

    // Load first few gallery images
    const criticalImages = [
        'images/whitecapel/IMG_8423.JPG',
        'images/whitecapel/IMG_8441.JPG',
        'images/canal/IMG_8567.JPG',
        'images/canal/IMG_8569.JPG'
    ];

    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Update active navigation link
function updateActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    const navbarHeight = document.querySelector('.navbar').offsetHeight;

    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - navbarHeight - 100;
        const sectionHeight = section.offsetHeight;

        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Gallery initialization
function initializeGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach((item, index) => {
        // Single click handler that manages both title and lightbox
        item.addEventListener('click', function (e) {
            e.preventDefault();

            // Toggle title visibility
            const wasVisible = this.classList.contains('title-visible');

            // Hide all other titles first
            galleryItems.forEach(otherItem => {
                otherItem.classList.remove('title-visible');
            });

            // If title wasn't visible, show it; if it was visible, open lightbox
            if (!wasVisible) {
                this.classList.add('title-visible');
            } else {
                // Open lightbox when title is already visible (second click)
                const gallery = this.closest('.gallery');
                const galleryType = gallery.classList.contains('superhighway-gallery') ? 'superhighway' : 'canal';
                const galleryItems = gallery.querySelectorAll('.gallery-item');
                const itemIndex = Array.from(galleryItems).indexOf(this);
                openLightbox(this.dataset.image, galleryType, itemIndex);
            }
        });

        // Title show on hover (desktop)
        item.addEventListener('mouseenter', function () {
            if (window.innerWidth > 768) { // Only on desktop
                this.classList.add('title-visible');
            }
        });

        // Title hide on mouse leave (desktop)
        item.addEventListener('mouseleave', function () {
            if (window.innerWidth > 768) { // Only on desktop
                this.classList.remove('title-visible');
            }
        });

        // Add loading effect
        const img = item.querySelector('img');
        if (img) {
            img.addEventListener('load', function () {
                item.classList.add('loaded');
            });
        }
    });

    // Hide titles when clicking outside gallery
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.gallery-item')) {
            galleryItems.forEach(item => {
                item.classList.remove('title-visible');
            });
        }
    });
}

// Lightbox functionality
function initializeLightbox() {
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', showPrevImage);
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', showNextImage);
    }

    // Gallery lightbox events
    if (galleryLightboxClose) {
        galleryLightboxClose.addEventListener('click', closeGalleryLightbox);
    }

    // Close on background click
    if (lightbox) {
        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    if (galleryLightbox) {
        galleryLightbox.addEventListener('click', function (e) {
            if (e.target === galleryLightbox) {
                closeGalleryLightbox();
            }
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
        if (lightbox && lightbox.style.display === 'block') {
            switch (e.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    showPrevImage();
                    break;
                case 'ArrowRight':
                    showNextImage();
                    break;
            }
        }
        if (galleryLightbox && galleryLightbox.style.display === 'block') {
            if (e.key === 'Escape') {
                closeGalleryLightbox();
            }
        }
    });
}

// Open main lightbox
function openLightbox(imageSrc, galleryType, imageIndex) {
    if (!lightbox || !lightboxImage) return;

    // Set current gallery
    currentGallery = generateGalleryArray(galleryType);
    currentImageIndex = imageIndex;

    // Show lightbox
    lightboxImage.src = imageSrc;
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Add fade-in animation
    setTimeout(() => {
        lightbox.style.opacity = '1';
    }, 10);
}

// Close main lightbox
function closeLightbox() {
    if (!lightbox) return;

    lightbox.style.opacity = '0';
    setTimeout(() => {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

// Close gallery lightbox
function closeGalleryLightbox() {
    if (!galleryLightbox) return;

    galleryLightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Generate gallery array
function generateGalleryArray(galleryType) {
    const gallery = [];
    if (galleryType === 'superhighway') {
        // Use all 13 real photos for superhighway
        const realPhotos = [
            'images/whitecapel/IMG_8423.JPG',
            'images/whitecapel/IMG_8441.JPG',
            'images/whitecapel/IMG_8462.JPG',
            'images/whitecapel/IMG_8517.JPG',
            'images/whitecapel/IMG_8527.JPG',
            'images/whitecapel/IMG_8531.JPG',
            'images/whitecapel/IMG_8535.JPG',
            'images/whitecapel/IMG_8549.JPG',
            'images/whitecapel/IMG_8731.JPG',
            'images/whitecapel/IMG_8744.JPG',
            'images/whitecapel/IMG_8755.JPG',
            'images/whitecapel/IMG_8757.JPG',
            'images/whitecapel/IMG_8762.JPG'
        ];
        gallery.push(...realPhotos);
    } else if (galleryType === 'canal') {
        // Use all 8 real photos for canal
        const canalPhotos = [
            'images/canal/IMG_8567.JPG',
            'images/canal/IMG_8569.JPG',
            'images/canal/IMG_8573.JPG',
            'images/canal/IMG_8610.JPG',
            'images/canal/IMG_8630.JPG',
            'images/canal/IMG_8633.JPG',
            'images/canal/IMG_8661.JPG',
            'images/canal/IMG_8664.JPG'
        ];
        gallery.push(...canalPhotos);
    } else {
        // Use placeholders for other gallery types
        for (let i = 1; i <= 9; i++) {
            gallery.push(`https://placehold.co/600x400?text=${galleryType.charAt(0).toUpperCase() + galleryType.slice(1)}+${i}`);
        }
    }
    return gallery;
}

// Show previous image
function showPrevImage() {
    currentImageIndex = (currentImageIndex - 1 + currentGallery.length) % currentGallery.length;
    updateLightboxImage();
}

// Show next image
function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % currentGallery.length;
    updateLightboxImage();
}

// Update lightbox image
function updateLightboxImage() {
    if (!lightboxImage) return;

    lightboxImage.style.opacity = '0';
    setTimeout(() => {
        lightboxImage.src = currentGallery[currentImageIndex];
        lightboxImage.style.opacity = '1';
    }, 150);
}

// Initialize Swiper sliders
function initializeSliders() {
    // Check if Swiper is available
    if (typeof Swiper === 'undefined') {
        console.warn('Swiper library not loaded');
        return;
    }

    // Initialize Fast Route Slider
    const fastRouteElement = document.querySelector('.fast-route-slider');
    if (fastRouteElement) {
        fastRouteSlider = new Swiper('.fast-route-slider', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            pagination: {
                el: '.fast-route-slider .swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.fast-route-slider .swiper-button-next',
                prevEl: '.fast-route-slider .swiper-button-prev',
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            // Performance optimizations
            updateOnWindowResize: true,
            observer: true,
            observeParents: true,
            lazy: {
                loadPrevNext: true,
                loadPrevNextAmount: 1,
            },
            preloadImages: false,
            watchSlidesProgress: true,
            watchSlidesVisibility: true
        });
    }

    // Initialize Ideal Route Slider
    const idealRouteElement = document.querySelector('.ideal-route-slider');
    if (idealRouteElement) {
        idealRouteSlider = new Swiper('.ideal-route-slider', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            pagination: {
                el: '.ideal-route-slider .swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.ideal-route-slider .swiper-button-next',
                prevEl: '.ideal-route-slider .swiper-button-prev',
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            // Performance optimizations
            updateOnWindowResize: true,
            observer: true,
            observeParents: true,
            lazy: {
                loadPrevNext: true,
                loadPrevNextAmount: 1,
            },
            preloadImages: false,
            watchSlidesProgress: true,
            watchSlidesVisibility: true
        });
    }

    // Initialize Photography Gallery Slider
    const photographyElement = document.querySelector('.photography-swiper');
    if (photographyElement) {
        new Swiper('.photography-swiper', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            pagination: {
                el: '.photography-swiper .swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.photography-swiper .swiper-button-next',
                prevEl: '.photography-swiper .swiper-button-prev',
            },
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            breakpoints: {
                768: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                }
            }
        });
    }

    // Add click events to gallery images in sliders
    const galleryImgs = document.querySelectorAll('.gallery-img');
    const swiperSlides = document.querySelectorAll('.swiper-slide');

    // Handle slider image clicks
    galleryImgs.forEach(img => {
        img.addEventListener('click', function () {
            if (galleryLightboxImg && galleryLightboxCaption && galleryLightbox) {
                galleryLightboxImg.src = this.src;
                galleryLightboxCaption.textContent = this.alt;
                galleryLightbox.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Handle slider title functionality
    swiperSlides.forEach(slide => {
        // Show title on hover (desktop)
        slide.addEventListener('mouseenter', function () {
            if (window.innerWidth > 768) {
                this.classList.add('title-visible');
            }
        });

        // Hide title on mouse leave (desktop)
        slide.addEventListener('mouseleave', function () {
            if (window.innerWidth > 768) {
                this.classList.remove('title-visible');
            }
        });

        // Toggle title on click (mobile)
        slide.addEventListener('click', function (e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                const wasVisible = this.classList.contains('title-visible');

                // Hide all other slide titles
                swiperSlides.forEach(otherSlide => {
                    otherSlide.classList.remove('title-visible');
                });

                // Toggle current slide title
                if (!wasVisible) {
                    this.classList.add('title-visible');
                }
            }
        });
    });
}

// Tab switching functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const gallerySliders = document.querySelectorAll('.gallery-slider');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Remove active class from all buttons and sliders
            tabButtons.forEach(btn => btn.classList.remove('active'));
            gallerySliders.forEach(slider => slider.classList.remove('active'));

            // Add active class to current button and corresponding slider
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            const targetSlider = document.getElementById(tabId);
            if (targetSlider) {
                targetSlider.classList.add('active');
            }

            // Update the sliders to ensure proper rendering after display change
            setTimeout(() => {
                if (fastRouteSlider) fastRouteSlider.update();
                if (idealRouteSlider) idealRouteSlider.update();
            }, 100);
        });
    });
}

// Scroll effects
function initializeScrollEffects() {
    // Navbar background opacity
    window.addEventListener('scroll', debounce(function () {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            const scrolled = window.pageYOffset;
            const scrollPercentage = Math.min(scrolled / 100, 1);
            navbar.style.background = `rgba(255, 255, 255, ${0.9 + scrollPercentage * 0.1})`;
        }
    }, 10));

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe gallery items, sections, methodology cards, and engagement section
    const animatedElements = document.querySelectorAll('.gallery-item, .section-header, .methodology-card, .research-engagement');
    animatedElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(element);
    });
}

// Performance optimization: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance optimization: Throttle function  
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Intelligent image preloading - only load when user is likely to see them
function preloadImages() {
    // Only preload if user has been on site for more than 3 seconds
    // and has sufficient bandwidth
    if (navigator.connection && navigator.connection.effectiveType === 'slow-2g') {
        return; // Skip preloading on very slow connections
    }

    const imageUrls = [];

    // Add visible section images based on current scroll position
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    // Only preload images for sections near current view
    if (scrollY < windowHeight * 2) {
        // User is near top, preload superhighway images
        const whitecapelPhotos = [
            'images/whitecapel/IMG_8423.JPG',
            'images/whitecapel/IMG_8441.JPG',
            'images/whitecapel/IMG_8462.JPG',
            'images/whitecapel/IMG_8517.JPG',
            'images/whitecapel/IMG_8527.JPG'
        ];
        imageUrls.push(...whitecapelPhotos);
    }

    if (scrollY > windowHeight && scrollY < windowHeight * 4) {
        // User has scrolled down, preload canal images
        const canalPhotos = [
            'images/canal/IMG_8567.JPG',
            'images/canal/IMG_8569.JPG',
            'images/canal/IMG_8573.JPG',
            'images/canal/IMG_8610.JPG'
        ];
        imageUrls.push(...canalPhotos);
    }

    // Preload images with throttling
    imageUrls.forEach((url, index) => {
        setTimeout(() => {
            const img = new Image();
            img.src = url;
        }, index * 100); // Stagger loading
    });
}

// Start preloading images after initial load
window.addEventListener('load', function () {
    setTimeout(preloadImages, 1000);
});

// Error handling for missing images
document.addEventListener('error', function (e) {
    if (e.target.tagName === 'IMG') {
        console.warn('Failed to load image:', e.target.src);
        e.target.style.display = 'none';
        const parent = e.target.closest('.gallery-item');
        if (parent) {
            parent.style.display = 'none';
        }
    }
}, true);

// Performance monitoring and reporting
function createPerformanceMonitor() {
    const indicator = document.createElement('div');
    indicator.className = 'performance-indicator';
    indicator.id = 'performance-monitor';
    document.body.appendChild(indicator);

    return indicator;
}

function updatePerformanceMetrics() {
    const monitor = document.getElementById('performance-monitor') || createPerformanceMonitor();

    if (performanceMetrics.imageLoadTimes.length > 0) {
        const avgLoadTime = performanceMetrics.imageLoadTimes.reduce((a, b) => a + b, 0) / performanceMetrics.imageLoadTimes.length;
        const connection = navigator.connection ? navigator.connection.effectiveType : 'unknown';

        let status = 'Good';
        if (avgLoadTime > 2000) status = 'Slow';
        else if (avgLoadTime > 1000) status = 'Fair';

        monitor.textContent = `Images: ${status} (${Math.round(avgLoadTime)}ms avg) | Connection: ${connection}`;

        // Show indicator temporarily
        monitor.classList.add('show');
        setTimeout(() => monitor.classList.remove('show'), 3000);
    }
}

// Adaptive quality loading based on performance
function adjustImageQuality() {
    const connection = navigator.connection;
    const images = document.querySelectorAll('img:not(.loaded)');

    if (!connection) return;

    let qualityClass = 'image-quality-high';

    switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
            qualityClass = 'image-quality-low';
            break;
        case '3g':
            qualityClass = 'image-quality-medium';
            break;
        default:
            qualityClass = 'image-quality-high';
    }

    images.forEach(img => {
        img.classList.remove('image-quality-low', 'image-quality-medium', 'image-quality-high');
        img.classList.add(qualityClass);
    });
}

// Initialize performance monitoring
window.addEventListener('load', function () {
    setTimeout(updatePerformanceMetrics, 2000);

    // Monitor connection changes
    if (navigator.connection) {
        navigator.connection.addEventListener('change', adjustImageQuality);
        adjustImageQuality();
    }

    // Update metrics periodically
    setInterval(() => {
        if (performanceMetrics.imageLoadTimes.length > 0) {
            updatePerformanceMetrics();
        }
    }, 10000);
});

// Throttled scroll handler for better performance
let scrollTimeout;
window.addEventListener('scroll', function () {
    if (scrollTimeout) clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
        // Update navigation highlighting
        updateActiveNavLink();

        // Check if we should preload more images
        preloadImages();
    }, 16); // ~60fps
});

// Memory cleanup for better performance
window.addEventListener('beforeunload', function () {
    // Clear any pending timeouts
    if (scrollTimeout) clearTimeout(scrollTimeout);

    // Clear performance metrics
    performanceMetrics.imageLoadTimes = [];
    performanceMetrics.failedImages = [];
});