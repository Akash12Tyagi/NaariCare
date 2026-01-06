// Nutrition Page JavaScript

// Search Functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('nutritionSearch');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const nutritionCards = document.querySelectorAll('.nutrition-card');
    const nutritionCategories = document.querySelectorAll('.nutrition-category');
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            nutritionCards.forEach(card => {
                const text = card.textContent.toLowerCase();
                const shouldShow = text.includes(searchTerm);
                card.style.display = shouldShow ? 'block' : 'none';
            });
        });
    }
    
    // Filter functionality
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const phase = this.getAttribute('data-phase');
            
            // Show/hide categories
            nutritionCategories.forEach(category => {
                const categoryPhase = category.getAttribute('data-category');
                
                if (phase === 'all') {
                    category.style.display = 'block';
                } else {
                    category.style.display = categoryPhase === phase ? 'block' : 'none';
                }
            });
        });
    });
    
    // Download PDF functionality
    const downloadBtn = document.querySelector('.section-actions .btn-outline');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            generateNutritionPDF();
        });
    }
});

// Generate PDF (placeholder function)
function generateNutritionPDF() {
    // In a real application, you would use a library like jsPDF
    const activeFilter = document.querySelector('.filter-tab.active');
    const phase = activeFilter ? activeFilter.getAttribute('data-phase') : 'all';
    
    showSuccessMessage(`Generating nutrition plan for ${phase === 'all' ? 'all phases' : phase}...`);
    
    // Simulate PDF generation
    setTimeout(() => {
        showSuccessMessage('Your nutrition plan is ready! Check your downloads.');
    }, 2000);
}

// Nutrition Card Interactions
document.querySelectorAll('.nutrition-card').forEach(card => {
    card.addEventListener('click', function() {
        const foodName = this.querySelector('h4').textContent;
        showNutritionDetail(foodName, this);
    });
});

function showNutritionDetail(foodName, cardElement) {
    // Add highlight effect
    document.querySelectorAll('.nutrition-card').forEach(c => c.style.borderColor = 'var(--border-color)');
    cardElement.style.borderColor = 'var(--primary-color)';
    cardElement.style.borderWidth = '2px';
    
    console.log('Selected food:', foodName);
}

// Nutrient Tag Filtering
const nutrientTags = document.querySelectorAll('.nutrient-tag');
nutrientTags.forEach(tag => {
    tag.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent card click
        const nutrient = this.textContent;
        filterByNutrient(nutrient);
    });
});

function filterByNutrient(nutrient) {
    const searchInput = document.getElementById('nutritionSearch');
    if (searchInput) {
        searchInput.value = nutrient;
        searchInput.dispatchEvent(new Event('input'));
    }
    
    showSuccessMessage(`Showing foods rich in ${nutrient}`);
}

// Favorite Foods (using localStorage)
const favoriteIcon = '⭐';
const unfavoriteIcon = '☆';

function toggleFavorite(foodName) {
    const favorites = JSON.parse(localStorage.getItem('favoriteFoods') || '[]');
    const index = favorites.indexOf(foodName);
    
    if (index > -1) {
        favorites.splice(index, 1);
        showSuccessMessage(`${foodName} removed from favorites`);
    } else {
        favorites.push(foodName);
        showSuccessMessage(`${foodName} added to favorites`);
    }
    
    localStorage.setItem('favoriteFoods', JSON.stringify(favorites));
}

// Add favorite buttons to cards
document.querySelectorAll('.nutrition-card .card-header').forEach(header => {
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'favorite-btn';
    favoriteBtn.innerHTML = '<i class="far fa-star"></i>';
    favoriteBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        margin-left: auto;
        color: var(--primary-color);
        transition: all 0.3s ease;
    `;
    
    const foodName = header.querySelector('h4').textContent;
    const favorites = JSON.parse(localStorage.getItem('favoriteFoods') || '[]');
    
    if (favorites.includes(foodName)) {
        favoriteBtn.textContent = favoriteIcon;
    }
    
    favoriteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleFavorite(foodName);
        if (this.textContent === favoriteIcon) {
            this.innerHTML = '<i class="far fa-star"></i>';
        } else {
            this.textContent = favoriteIcon;
        }
    });
    
    header.appendChild(favoriteBtn);
});

// Serving Size Calculator
function calculateServing(baseServing, multiplier) {
    // Parse serving size (e.g., "2-3 cups" or "1-2 eggs")
    const match = baseServing.match(/(\d+)-?(\d+)?/);
    if (match) {
        const min = parseInt(match[1]) * multiplier;
        const max = match[2] ? parseInt(match[2]) * multiplier : min;
        return max > min ? `${min}-${max}` : `${min}`;
    }
    return baseServing;
}

// Tips Card Interactions
document.querySelectorAll('.tip-card').forEach(card => {
    card.addEventListener('click', function() {
        const tipTitle = this.querySelector('h4').textContent;
        const tipContent = this.querySelector('p').textContent;
        showTipDetail(tipTitle, tipContent);
    });
});

function showTipDetail(title, content) {
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `<i class="fas fa-lightbulb"></i> <strong>${title}:</strong> ${content}`;
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

// Helper function
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
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

// Nutrition page functionality
console.log('Nutrition features loaded!');
