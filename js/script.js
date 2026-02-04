// Main JavaScript for Naari Care Website

// import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
// import{getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
// import{getFirestore, getDoc, doc} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


// const firebaseConfig = {
// apiKey: "AIzaSyCVutoli-cy6PTeEqvzTk07SBI66r9YZfs",
// authDomain: "naari-care.firebaseapp.com",
// projectId: "naari-care",
// storageBucket: "naari-care.firebasestorage.app",
// messagingSenderId: "180168956250",
// appId: "1:180168956250:web:a2b95960983be7587fbb63"
// };

// const Auth= getAuth();
// const db= getFirestore();

// onAuthStateChanged(auth, (user)=>{
//     const loggedInUserId=localStorage.getItem('loggedInUserId');
//     if(loggedInUserId){
//         const docRef= doc(db, "users", loggedInUserId);
//         getDoc(docRef)
//         .then((docSnap)=>{
//             if(docSnap.exists()){
//                 const userData=docSnap.data();
//                 document.getElementById('loggedUserfullname').innerText=userData.fullname;
//                 document.getElementById('loggedUserEmail').innerText=userData.email;

//             }
//             else{
//                 console.log("No document found matching id")
//             }
//         })
//         .catch((error)=>{
//             console.log('error getting document');
//         })
//     }
//     else{
//         console.log("User id not found in localstorage");
//     }
// })

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);














// Create Scroll Progress Indicator
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.prepend(progressBar);

// Update scroll progress
window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercentage = (scrollTop / scrollHeight) * 100;
    progressBar.style.transform = `scaleX(${scrollPercentage / 100})`;
});

// Initialize AOS (Animate On Scroll)
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS with custom settings
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 100,
            delay: 100,
            disable: 'mobile'
        });
        
        // Refresh AOS on dynamic content changes
        setTimeout(() => AOS.refresh(), 500);
    }
    
    // Page transition effect
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in-out';
    
    window.addEventListener('load', function() {
        document.body.style.opacity = '1';
    });
});

// Theme Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    
    // Check for saved theme preference or default to 'light'
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-mode', currentTheme === 'dark');
    updateThemeIcon(currentTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            
            const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
            updateThemeIcon(theme);
        });
    }
    
    function updateThemeIcon(theme) {
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    }
});

// Smooth Scroll for Navigation Links with offset for fixed navbar
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // Skip if href is just "#" or empty
        if (!href || href === '#' || href.length <= 1) {
            e.preventDefault();
            return;
        }
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar Scroll Effect with advanced transitions
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        navbar.style.backdropFilter = 'blur(10px)';
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    } else {
        navbar.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        navbar.style.backdropFilter = 'none';
        navbar.style.backgroundColor = 'var(--card-bg)';
    }
    
    // Hide navbar on scroll down, show on scroll up
    if (currentScroll > lastScroll && currentScroll > 100) {
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll;
});

// Animation on Scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.card, .feature-card, .testimonial-card, .activity-card, .article-card, .nutrition-card');
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
});

// Button Click Effects
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple effect styles dynamically
const style = document.createElement('style');
style.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Mobile Menu Toggle (for future implementation)
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// Form Validation Helper
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Success Message Display
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        color: white;
        padding: 16px 24px;
        border-radius: 6px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

// Add animation styles
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(animationStyle);

// Quick Replies for Chatbot
if (document.querySelectorAll('.quick-reply').length > 0) {
    document.querySelectorAll('.quick-reply').forEach(button => {
        button.addEventListener('click', function() {
            const message = this.textContent;
            console.log('Quick reply clicked:', message);
            // Here you would implement actual chatbot interaction
            showSuccessMessage('Message sent to Naari AI!');
        });
    });
}


// CTA Button Actions
// document.querySelectorAll('.btn-primary, .btn-login').forEach(button => {
//     if (button.textContent.includes('Get Started') || 
//         button.textContent.includes('Download App') || 
//         button.textContent.includes('Login')) {
//         button.addEventListener('click', function(e) {
//             if (!this.getAttribute('type') || this.getAttribute('type') !== 'submit') {
//                 e.preventDefault();
//                 showSuccessMessage('Coming soon! Stay tuned for our app launch.');
//             }
//         });
//     }
// });



console.log('Naari Care website loaded successfully!');

// Reveal on Scroll for elements
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// Parallax effect for backgrounds
window.addEventListener('scroll', function() {
    const parallaxElements = document.querySelectorAll('.parallax-bg');
    parallaxElements.forEach(el => {
        const speed = el.dataset.speed || 0.5;
        const yPos = -(window.pageYOffset * speed);
        el.style.backgroundPosition = `center ${yPos}px`;
    });
});

// Add stagger animation classes to cards
document.addEventListener('DOMContentLoaded', function() {
    const cardContainers = document.querySelectorAll('.feature-cards, .cards-grid, .team-grid, .articles-grid');
    cardContainers.forEach(container => {
        const cards = container.children;
        Array.from(cards).forEach((card, index) => {
            card.classList.add('stagger-item');
            card.style.animationDelay = `${index * 0.1}s`;
        });
    });
});

// ===================================
// MODAL FUNCTIONALITY
// ===================================

// Modal Management
const modalManager = {
    communityModal: null,
    loginModal: null,
    downloadModal: null,
    
    init() {
        this.communityModal = document.getElementById('communityModal');
        this.loginModal = document.getElementById('loginModal');
        this.downloadModal = document.getElementById('downloadModal');
        
        // Setup button event listeners
        this.setupButtons();
        
        // Setup close buttons
        this.setupCloseButtons();
        
        // Close on outside click
        this.setupOutsideClick();
        
        // Setup community chat functionality
        this.setupCommunityChat();

        
    },
    
    setupButtons() {
    // Get Started button -> Login Modal
    const getStartedBtn = document.querySelector('.hero-buttons .btn-primary');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal(this.loginModal);
        });
    }
    
    // Learn More button -> Smooth scroll to features
    const learnMoreBtn = document.querySelector('.hero-buttons .btn-outline');
    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const featuresSection = document.getElementById('features');
            if (featuresSection) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = featuresSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // ============================================
    // REMOVE OR COMMENT OUT THIS SECTION
    // Login / Sign Up button in navbar -> Login Modal
    // This is now handled by firebaseauth.js
    // ============================================
    // const loginBtn = document.querySelector('.btn-login');
    // if (loginBtn) {
    //     loginBtn.addEventListener('click', (e) => {
    //         e.preventDefault();
    //         this.openModal(this.loginModal);
    //     });
    // }
    // ============================================
    
    // Join Community buttons are handled by the separate event listener below
    // to ensure they open the community modal properly
    
    // Download App button -> Download Modal
    const downloadBtns = document.querySelectorAll('.btn-outline');
    downloadBtns.forEach(btn => {
        if (btn.textContent.trim() === 'Download App') {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal(this.downloadModal);
            });
        }
    });
const joinCommunityBtns = document.querySelectorAll('.btn-primary');
joinCommunityBtns.forEach(btn => {
    if (btn.textContent.trim() === 'Join Community') {
        // Remove any existing click handlers
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add new handler to redirect to community.html
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'community.html';
        });
    }
});
},
    
    setupCloseButtons() {
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
    },
    
    setupOutsideClick() {
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    },
    
    openModal(modal) {
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    
    closeAllModals() {
        [this.communityModal, this.loginModal, this.downloadModal].forEach(modal => {
            if (modal) {
                modal.classList.remove('active');
            }
        });
        document.body.style.overflow = '';
    },
    
    setupCommunityChat() {
        // Tab switching
        const tabs = document.querySelectorAll('.community-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const channel = tab.dataset.channel;
                this.loadCommunityMessages(channel);
            });
        });
        
        // Send message functionality
        const sendBtn = document.getElementById('sendMessage');
        const chatInput = document.getElementById('chatInput');
        
        if (sendBtn && chatInput) {
            const sendMessage = () => {
                const message = chatInput.value.trim();
                if (message) {
                    this.addChatMessage('You', message, true);
                    chatInput.value = '';
                    
                    // Simulate a response after 1.5 seconds
                    setTimeout(() => {
                        // Get current active tab to provide contextual response
                        const activeTab = document.querySelector('.community-tab.active');
                        const currentChannel = activeTab ? activeTab.dataset.channel : 'general';
                        
                        const responses = {
                            general: [
                                { name: 'Priya Sharma', message: "That's a great point! Thanks for sharing. 💕" },
                                { name: 'Ananya Patel', message: "I completely agree with you! This community is amazing." },
                                { name: 'Sana Khan', message: "Thanks for your input! Very helpful." },
                                { name: 'Neha Gupta', message: "Interesting perspective! Love this discussion. ✨" }
                            ],
                            pregnancy: [
                                { name: 'Dr. Anjali', message: "Great question! Remember to always consult your doctor for personalized advice. 🤰" },
                                { name: 'Meera Reddy', message: "Thanks for sharing! This is so helpful for expecting moms." },
                                { name: 'Kavya Singh', message: "I experienced something similar! You're not alone in this journey. 💕" }
                            ],
                            wellness: [
                                { name: 'Simran Kaur', message: "That's wonderful! Keep up the great work! ✨" },
                                { name: 'Diya Mehta', message: "Love your positive energy! We're all growing together. 🌸" },
                                { name: 'Aisha Rahman', message: "Progress over perfection! You're doing amazing! 💪" }
                            ]
                        };
                        
                        const channelResponses = responses[currentChannel] || responses.general;
                        const randomResponse = channelResponses[Math.floor(Math.random() * channelResponses.length)];
                        this.addChatMessage(randomResponse.name, randomResponse.message, false);
                    }, 1500);
                }
            };
            
            sendBtn.addEventListener('click', sendMessage);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
    },
    
    loadCommunityMessages(channel) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        messagesContainer.innerHTML = '';
        
        const demoMessages = {
            general: [
                { name: 'Priya Sharma', message: 'Hello everyone! 👋 New to this community. So excited to be here and connect with you all! 💕', time: '10:30 AM' },
                { name: 'Ananya Patel', message: 'Welcome Priya! 🌸 This is such a supportive and caring space. Feel free to ask anything - we\'re all here to help each other.', time: '10:32 AM' },
                { name: 'Sana Khan', message: 'I just started my wellness journey last month and this app has been absolutely amazing! The guided meditations and daily tips are life-changing. 🧘‍♀️', time: '10:45 AM' },
                { name: 'Riya Verma', message: 'Does anyone have tips for managing work stress? Having a particularly tough week and could use some advice 😔', time: '11:00 AM' },
                { name: 'Neha Gupta', message: 'Meditation and deep breathing really help me during stressful times! Try the guided sessions in the app. Also, taking short walks and staying hydrated makes a huge difference. You\'ve got this! 💪', time: '11:05 AM' },
                { name: 'Riya Verma', message: 'Thank you so much Neha! 🙏 I\'ll try those techniques today. This community is truly wonderful!', time: '11:08 AM' }
            ],
            pregnancy: [
                { name: 'Meera Reddy', message: 'Good morning lovely mamas! 🌅 I\'m in my second trimester and experiencing some lower back pain. Any suggestions or remedies that worked for you?', time: '9:15 AM' },
                { name: 'Dr. Anjali', message: 'Hi Meera! Prenatal yoga can be very helpful for back pain. Also try a warm compress and make sure you\'re wearing supportive shoes. Always check with your doctor first though! 👩‍⚕️', time: '9:20 AM' },
                { name: 'Kavya Singh', message: 'Swimming helped me SO much during my pregnancy! It\'s very gentle on the body and the water takes pressure off your back. Highly recommend! 🏊‍♀️', time: '9:30 AM' },
                { name: 'Pooja Jain', message: 'A good pregnancy pillow was an absolute game changer for me! Also, try sleeping on your left side with the pillow between your knees. Sweet dreams! 🤰💤', time: '9:45 AM' },
                { name: 'Meera Reddy', message: 'You all are angels! 😇 Thank you so much for these wonderful suggestions. I\'ll definitely try them. This community gives me so much comfort! ❤️', time: '10:00 AM' }
            ],
            wellness: [
                { name: 'Simran Kaur', message: 'Just completed a 30-day meditation challenge! 🎉 Feeling absolutely amazing and so proud of myself. My stress levels have decreased significantly! ✨', time: '8:00 AM' },
                { name: 'Tanvi Shah', message: 'That\'s so inspiring Simran! 🌟 I really want to start meditating but don\'t know where to begin. Any beginner tips?', time: '8:15 AM' },
                { name: 'Diya Mehta', message: 'Start with just 5 minutes a day, Tanvi! The app has amazing beginner-friendly guided sessions. Consistency is way more important than duration. You\'ve got this! 🧘‍♀️', time: '8:20 AM' },
                { name: 'Aisha Rahman', message: 'Also, don\'t be hard on yourself if you miss a day. It\'s about progress, not perfection! Be kind to yourself on this journey. 💕💪', time: '8:25 AM' },
                { name: 'Simran Kaur', message: 'Yes! And the community challenges really kept me motivated. Join the next one - we\'re stronger together! 🌺', time: '8:30 AM' },
                { name: 'Tanvi Shah', message: 'Thank you all! 🙏 Starting today with a 5-minute session. Here\'s to new beginnings! ✨', time: '8:35 AM' }
            ]
        };
        
        const messages = demoMessages[channel] || demoMessages.general;
        messages.forEach(msg => {
            this.addChatMessage(msg.name, msg.message, false, msg.time);
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    
    addChatMessage(name, message, isOwn = false, time = null) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        const displayTime = time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
        
        const messageHTML = `
            <div class="chat-message">
                <div class="message-header">
                    <div class="message-avatar">${initials}</div>
                    <span class="message-name">${name}</span>
                    <span class="message-time">${displayTime}</span>
                </div>
                <div class="message-text ${isOwn ? 'own-message' : ''}">${message}</div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
};

// Initialize modals when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    modalManager.init();
});

// Login Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (validateEmail(email) && password.length >= 6) {
                showSuccessMessage('Login feature coming soon! Stay tuned for our app launch.');
                modalManager.closeAllModals();
                loginForm.reset();
            } else {
                showSuccessMessage('Please enter valid credentials (password min 6 characters)');
            }
        });
    }
});

// Download Notification Form
document.addEventListener('DOMContentLoaded', () => {
    const notifyForm = document.getElementById('notifyForm');
    if (notifyForm) {
        notifyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('notifyEmail').value;
            
            if (validateEmail(email)) {
                showSuccessMessage('Thank you! We\'ll notify you when the app launches. 🎉');
                notifyForm.reset();
            } else {
                showSuccessMessage('Please enter a valid email address');
            }
        });
    }
});

// Auth Form Switching (Login/Signup)
document.addEventListener('DOMContentLoaded', () => {
    const switchAuthBtn = document.getElementById('switchAuth');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const switchText = document.getElementById('switchText');
    
    let isLoginMode = true;
    
    if (switchAuthBtn && loginForm && signupForm) {
        switchAuthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (isLoginMode) {
                // Switch to signup
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
                authTitle.textContent = 'Create Your Account';
                authSubtitle.textContent = 'Start your wellness journey with Naari Care today';
                switchText.textContent = 'Already have an account?';
                switchAuthBtn.textContent = 'Sign in';
                isLoginMode = false;
            } else {
                // Switch to login
                signupForm.style.display = 'none';
                loginForm.style.display = 'block';
                authTitle.textContent = 'Welcome to Naari Care';
                authSubtitle.textContent = 'Join thousands of women on their wellness journey';
                switchText.textContent = 'Don\'t have an account?';
                switchAuthBtn.textContent = 'Sign up';
                isLoginMode = true;
            }
        });
    }
});

// Signup Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            
            if (!validateEmail(email)) {
                showSuccessMessage('Please enter a valid email address');
                return;
            }
            
            if (password.length < 6) {
                showSuccessMessage('Password must be at least 6 characters');
                return;
            }
            
            if (password !== confirmPassword) {
                showSuccessMessage('Passwords do not match');
                return;
            }
            
            // Store user info in sessionStorage
            sessionStorage.setItem('userName', name);
            sessionStorage.setItem('userEmail', email);
            
            showSuccessMessage('Account created successfully! Redirecting to community... 🎉');
            
            // Redirect to community page after 1 seconds
            setTimeout(() => {
                window.location.href = 'community.html';
            }, 1000);
        });
    }
});

// Update Join Community Button to open community modal
document.addEventListener('DOMContentLoaded', () => {
    const joinCommunityBtns = document.querySelectorAll('.btn-primary, .btn-secondary');
    joinCommunityBtns.forEach(btn => {
        if (btn.textContent.trim() === 'Join Community') {
            // Remove any existing event listeners by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Add redirect to community.html
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'community.html';
            });
        }
    });
});



