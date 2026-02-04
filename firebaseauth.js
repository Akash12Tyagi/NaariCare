// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { 
    getFirestore, 
    setDoc, 
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCVutoli-cy6PTeEqvzTk07SBI66r9YZfs",
    authDomain: "naari-care.firebaseapp.com",
    projectId: "naari-care",
    storageBucket: "naari-care.firebasestorage.app",
    messagingSenderId: "180168956250",
    appId: "1:180168956250:web:a2b95960983be7587fbb63"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Function to show messages
function showMessage(message, divId){
    var messageDiv = document.getElementById(divId);
    if (messageDiv) {
        messageDiv.style.display = "block";
        messageDiv.innerHTML = message;
        messageDiv.style.opacity = 1;
        setTimeout(function(){
            messageDiv.style.opacity = 0;
        },5000);
    }
}

// Function to close all modals
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

// Function to open login modal
function openLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Function to set up close button for login modal
function setupLoginModalCloseButton() {
    const closeLoginBtn = document.getElementById('closeLogin');
    if (closeLoginBtn) {
        // Remove any existing event listeners
        const newCloseBtn = closeLoginBtn.cloneNode(true);
        closeLoginBtn.parentNode.replaceChild(newCloseBtn, closeLoginBtn);
        
        // Add new event listener
        document.getElementById('closeLogin').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeAllModals();
        });
    }
}

// Function to update UI based on auth state
function updateUI(user) {
    const loginBtn = document.querySelector('.btn-login');
    const loginModal = document.getElementById('loginModal');
    
    if (user) {
        // User is logged in - get user data from Firestore
        const db = getFirestore();
        const userRef = doc(db, "users", user.uid);
        
        getDoc(userRef).then((docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const userName = userData.fullname || user.email.split('@')[0];
                
                // Update login button to show user info
                loginBtn.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-user-circle" style="font-size: 1.2em;"></i>
                        <span>${userName}</span>
                        <i class="fas fa-chevron-down" style="font-size: 0.8em;"></i>
                    </div>
                `;
                
                // Add click event for user dropdown
                loginBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    showUserDropdown();
                };
                
                // Close login modal if open
                if (loginModal && loginModal.classList.contains('active')) {
                    closeAllModals();
                }
            }
        }).catch((error) => {
            console.error("Error getting user document:", error);
        });
        
    } else {
        // User is logged out
        loginBtn.innerHTML = 'Login / Sign Up';
        
        // Set click event to open login modal
        loginBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openLoginModal();
        };
    }
}

// Function to show user dropdown
function showUserDropdown() {
    // Close any existing dropdowns
    const existingDropdown = document.querySelector('.user-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
        return;
    }
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
        <div class="dropdown-item" id="viewProfile">
            <i class="fas fa-user"></i> My Profile
        </div>
        <div class="dropdown-item" id="logoutBtn">
            <i class="fas fa-sign-out-alt"></i> Logout
        </div>
    `;
    
    // Style dropdown
    dropdown.style.cssText = `
        position: absolute;
        top: 50px;
        right: 0;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        min-width: 180px;
        overflow: hidden;
    `;
    
    // Add dropdown to DOM
    const loginBtn = document.querySelector('.btn-login');
    const parent = loginBtn.parentElement;
    parent.style.position = 'relative';
    parent.appendChild(dropdown);
    
    // Add logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        const auth = getAuth();
        signOut(auth).then(() => {
            dropdown.remove();
            showSuccessMessage('Logged out successfully');
        }).catch((error) => {
            console.error('Sign out error:', error);
        });
    });
    
    // Add profile functionality
    document.getElementById('viewProfile').addEventListener('click', function() {
        dropdown.remove();
        window.location.href = 'community.html';
    });
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!parent.contains(e.target)) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 10);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    const auth = getAuth();
    
    // Set up close button for login modal
    setupLoginModalCloseButton();
    
    // Set up close button for community modal if it exists
    const closeCommunityBtn = document.getElementById('closeCommunity');
    if (closeCommunityBtn) {
        closeCommunityBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeAllModals();
        });
    }
    
    // Set up close button for download modal if it exists
    const closeDownloadBtn = document.getElementById('closeDownload');
    if (closeDownloadBtn) {
        closeDownloadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeAllModals();
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        updateUI(user);
    });
    
    // Also handle Get Started button to open login modal
    const getStartedBtn = document.querySelector('.hero-buttons .btn-primary');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openLoginModal();
        });
    }
    
    // Also handle the Join Community button in CTA section
    const joinCommunityBtn = document.querySelector('.cta .btn-secondary');
    if (joinCommunityBtn && joinCommunityBtn.textContent.trim() === 'Join Community') {
        joinCommunityBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openLoginModal();
        });
    }
});

// Signup functionality
const signUp = document.getElementById("submitSignUp");
if (signUp) {
    signUp.addEventListener('click', (event) => {
        event.preventDefault();

        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const fullname = document.getElementById('signupName').value;
        const auth = getAuth();
        const db = getFirestore();

        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userData = {
                email: email,
                fullname: fullname,
                createdAt: new Date().toISOString()
            };
            showMessage('Account created successfully', 'signUpMessage');
            const docRef = doc(db, "users", user.uid);
            setDoc(docRef, userData)
            .then(() => {
                closeAllModals();
            })
            .catch((error) => {
                console.error("Error writing document", error);
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            if (errorCode == 'auth/email-already-in-use') {
                showMessage('Email Address already exists!', 'signUpMessage');
            } else {
                showMessage('Unable to create user', 'signUpMessage');
            }
        });
    });
}

// Signin functionality
const signIn = document.getElementById('submitSignIn');
if (signIn) {
    signIn.addEventListener('click', (event) => {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const auth = getAuth();

        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            showMessage('Login successful', 'signInMessage');
            closeAllModals();
        })
        .catch((error) => {
            const errorCode = error.code;
            if (errorCode === 'auth/invalid-credential') {
                showMessage('Incorrect email or password', 'signInMessage');
            } else {
                showMessage('Account does not exist', 'signInMessage');
            }
        });
    });
}

// Auth form switching (Login/Signup)
document.addEventListener('DOMContentLoaded', function() {
    const switchAuthBtn = document.getElementById('switchAuth');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const switchText = document.getElementById('switchText');
    
    if (switchAuthBtn && loginForm && signupForm) {
        switchAuthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (loginForm.style.display !== 'none') {
                // Switch to signup
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
                if (authTitle) authTitle.textContent = 'Create Your Account';
                if (authSubtitle) authSubtitle.textContent = 'Start your wellness journey with Naari Care today';
                if (switchText) switchText.textContent = 'Already have an account?';
                switchAuthBtn.textContent = 'Sign in';
            } else {
                // Switch to login
                signupForm.style.display = 'none';
                loginForm.style.display = 'block';
                if (authTitle) authTitle.textContent = 'Welcome to Naari Care';
                if (authSubtitle) authSubtitle.textContent = 'Join thousands of women on their wellness journey';
                if (switchText) switchText.textContent = 'Don\'t have an account?';
                switchAuthBtn.textContent = 'Sign up';
            }
        });
    }
});

// Success message function
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