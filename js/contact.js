// Contact Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // Validate form
            if (!validateContactForm(name, email, subject, message)) {
                return;
            }
            
            // Submit form (placeholder)
            submitContactForm({ name, email, subject, message });
        });
    }
});

function validateContactForm(name, email, subject, message) {
    // Name validation
    if (name.trim().length < 2) {
        showErrorMessage('Please enter a valid name (at least 2 characters)');
        return false;
    }
    
    // Email validation
    if (!validateEmail(email)) {
        showErrorMessage('Please enter a valid email address');
        return false;
    }
    
    // Subject validation
    if (!subject) {
        showErrorMessage('Please select a subject');
        return false;
    }
    
    // Message validation
    if (message.trim().length < 10) {
        showErrorMessage('Please enter a message (at least 10 characters)');
        return false;
    }
    
    return true;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function submitContactForm(formData) {
    // Show loading state
    const submitBtn = document.querySelector('#contactForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset form
        document.getElementById('contactForm').reset();
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Show success message
        showSuccessMessage('Thank you for contacting us! We\'ll respond within 24 hours.');
        
        // Log form data (in real app, this would be sent to server)
        console.log('Form submitted:', formData);
        
        // Save to localStorage for demo purposes
        saveContactSubmission(formData);
    }, 1500);
}

function saveContactSubmission(formData) {
    const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
    submissions.push({
        ...formData,
        timestamp: new Date().toISOString(),
        status: 'pending'
    });
    localStorage.setItem('contactSubmissions', JSON.stringify(submissions));
}

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
    }, 4000);
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #DF3F40;
        color: white;
        padding: 16px 24px;
        border-radius: 6px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}

// FAQ Accordion functionality
document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', function() {
        // Toggle expanded state
        this.classList.toggle('expanded');
        
        // Add/remove visual indicator
        const h4 = this.querySelector('h4');
        if (this.classList.contains('expanded')) {
            h4.textContent = '▼ ' + h4.textContent.replace('► ', '').replace('▼ ', '');
            this.style.backgroundColor = 'var(--background)';
        } else {
            h4.textContent = '► ' + h4.textContent.replace('► ', '').replace('▼ ', '');
            this.style.backgroundColor = 'var(--card-bg)';
        }
    });
    
    // Add initial arrow
    const h4 = item.querySelector('h4');
    if (!h4.textContent.startsWith('►')) {
        h4.textContent = '► ' + h4.textContent;
    }
});

// Social Media Link Tracking
document.querySelectorAll('.social-links-horizontal a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const platform = this.textContent;
        console.log(`Social link clicked: ${platform}`);
        showSuccessMessage(`Opening ${platform}...`);
    });
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
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
    
    .faq-item {
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .faq-item:hover {
        transform: translateX(5px);
    }
`;
document.head.appendChild(style);

// Contact page functionality
console.log('Contact page features loaded!');
