// Image Configuration with Unsplash API
// This file manages all image placeholders and integrations

const UNSPLASH_CONFIG = {
    accessKey: 'YOUR_UNSPLASH_ACCESS_KEY', // Replace with your key from unsplash.com/developers
    baseUrl: 'https://source.unsplash.com',
    fallbackUrl: 'https://via.placeholder.com'
};

// Image Categories for different sections
const IMAGE_CATEGORIES = {
    hero: {
        query: 'wellness,meditation,woman',
        size: '1200x800',
        fallback: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=800&fit=crop'
    },
    testimonial: {
        query: 'portrait,woman,professional',
        size: '400x400',
        fallback: 'https://ui-avatars.com/api/?size=400&background=6366F1&color=fff'
    },
    pregnancy: {
        query: 'pregnancy,health,care',
        size: '800x600',
        fallback: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=600&fit=crop'
    },
    nutrition: {
        query: 'healthy,food,nutrition',
        size: '600x400',
        fallback: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop'
    },
    mentalHealth: {
        query: 'meditation,mindfulness,peace',
        size: '800x600',
        fallback: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop'
    },
    article: {
        query: 'wellness,health,lifestyle',
        size: '800x500',
        fallback: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=500&fit=crop'
    }
};

// Generate Unsplash URL
function getUnsplashImage(category, index = 0) {
    const config = IMAGE_CATEGORIES[category];
    if (!config) return IMAGE_CATEGORIES.hero.fallback;
    
    return `${UNSPLASH_CONFIG.baseUrl}/${config.size}/?${config.query}&sig=${index}`;
}

// Generate placeholder URL with custom text
function getPlaceholderWithText(width, height, text, bgColor = '6366F1', textColor = 'ffffff') {
    return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
}

// Generate UI Avatars for user profiles
function getAvatarImage(name, size = 200, background = '6366F1', color = 'fff') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=${background}&color=${color}&bold=true&rounded=true`;
}

// Initialize images on page load
function initializeImages() {
    // Replace all image placeholders with data-image-category attribute
    document.querySelectorAll('[data-image-category]').forEach((img, index) => {
        const category = img.getAttribute('data-image-category');
        const imageUrl = getUnsplashImage(category, index);
        
        // Add loading animation
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease-in-out';
        
        // Load image
        const tempImg = new Image();
        tempImg.onload = function() {
            img.src = imageUrl;
            img.style.opacity = '1';
        };
        tempImg.onerror = function() {
            // Use fallback if Unsplash fails
            img.src = IMAGE_CATEGORIES[category].fallback;
            img.style.opacity = '1';
        };
        tempImg.src = imageUrl;
    });
    
    // Replace avatar placeholders
    document.querySelectorAll('[data-avatar-name]').forEach(img => {
        const name = img.getAttribute('data-avatar-name');
        img.src = getAvatarImage(name);
        img.style.transition = 'transform 0.3s ease';
    });
}

// Lazy loading for images
function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-lazy-src');
                
                if (src) {
                    img.src = src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });
    
    document.querySelectorAll('img[data-lazy-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getUnsplashImage,
        getPlaceholderWithText,
        getAvatarImage,
        initializeImages,
        setupLazyLoading
    };
}

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeImages();
    setupLazyLoading();
    console.log('Image system initialized with Unsplash and lazy loading');
});

// Add CSS for image loading states
const imageStyles = document.createElement('style');
imageStyles.textContent = `
    img[data-image-category],
    img[data-avatar-name],
    img[data-lazy-src] {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s ease-in-out infinite;
    }
    
    img.loaded {
        animation: none;
        background: transparent;
    }
    
    @keyframes loading {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }
    
    .image-container {
        position: relative;
        overflow: hidden;
    }
    
    .image-container img {
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .image-container:hover img {
        transform: scale(1.05);
    }
`;
document.head.appendChild(imageStyles);
