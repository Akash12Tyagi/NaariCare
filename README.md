# Naari Care - Women's Wellness Website

![Naari Care](https://img.shields.io/badge/Naari-Care-6366F1)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## About

**Naari Care** is a comprehensive women's health and wellness platform designed to support women through every phase of life - from menstrual cycles to pregnancy and mental wellness.

### Key Features
- **Cycle Tracker** - Smart predictions and personalized insights
- **Pregnancy Care** - Week-by-week guidance and nutrition plans
- **Mental Wellness** - AI-powered emotional support and mindfulness tools
- **Nutrition Guides** - Phase-specific dietary recommendations
- **Naari AI Chatbot** - 24/7 emotional health support

## New Features (v2.0)

### **Advanced Animations & Transitions**
- **AOS (Animate On Scroll)** - Smooth scroll-triggered animations
- **Stagger animations** - Cards appear in sequence
- **Scroll progress indicator** - Visual feedback at page top
- **Enhanced hover effects** - 3D transforms and gradients
- **Page transition** - Smooth fade-in on load
- **Parallax backgrounds** - Dynamic scrolling effects

### **Image Management System**
- **Unsplash Integration** - High-quality stock images
- **UI Avatars API** - Dynamic user profile pictures
- **Lazy Loading** - Images load as you scroll
- **Placeholder System** - Skeleton screens while loading
- **Image Categories** - Organized by content type

### **Enhanced UI Elements**
- **Gradient borders** - Animated card outlines
- **Glow effects** - Interactive hover states
- **Floating animations** - Subtle icon movements
- **Reveal on scroll** - Elements fade in as you scroll
- **Smooth navbar** - Hide on scroll down, show on scroll up

## Design System

### Color Palette
- **Primary**: `#6366F1` (Indigo)
- **Secondary**: `#8B5CF6` (Purple)
- **Accent**: `#06B6D4` (Cyan)
- **Error**: `#DF3F40` (Red)
- **Background**: `#FAFAFA` (Off-white)

### Typography
- **Font Family**: Poppins (sans-serif) + Font Awesome icons
- **Base Size**: 16px
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### Spacing
- **Outer Padding**: 20px
- **Gutter**: 16px
- **Border Radius**: Soft 6px curves

## Project Structure

## 📁 Project Structure

```
Nari care/
│
├── index.html              # Homepage
├── features.html           # Features page
├── nutrition.html          # Nutrition & Health page
├── mental-wellness.html    # Mental Wellness page
├── about.html             # About Us page
├── contact.html           # Contact page
│
├── css/
│   ├── style.css          # Main stylesheet
│   └── animations.css     # Advanced animations & effects
│
├── js/
│   ├── script.js          # Main JavaScript
│   ├── images-config.js   # Image management system
│   ├── mental-wellness.js # Mental wellness features
│   ├── nutrition.js       # Nutrition page functionality
│   ├── contact.js         # Contact form handling
|   ├── community.js       # community
|   ├── config.js 
│
├── images/                # Image assets folder
│
└── README.md              # This file
```

## Dependencies & Libraries

### CDN Libraries (No Installation Required)

**Font Awesome 6.4.0**
- Professional icon library
- Used for: Navigation icons, feature icons, UI elements
- CDN: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`

**AOS (Animate On Scroll) 2.3.1**
- Scroll-triggered animations
- Used for: Card animations, section reveals
- CDN: `https://unpkg.com/aos@2.3.1/dist/aos.css`
- JS: `https://unpkg.com/aos@2.3.1/dist/aos.js`

**Google Fonts - Poppins**
- Primary typography
- CDN: `https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700`

### Image Services

**Unsplash Source API**
- High-quality stock images
- URL: `https://source.unsplash.com`
- Free, no API key required for basic use

**UI Avatars API**
- Dynamic user profile pictures
- URL: `https://ui-avatars.com/api/`
- Generates avatars from names

**Placeholder.com**
- Fallback placeholder images
- URL: `https://via.placeholder.com`

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser!

### Installation

1. **Download the project**
   - Extract all files to a folder on your computer

2. **Open the website**
   - Double-click `index.html` to open in your browser
   - Or right-click → Open with → Your preferred browser

3. **That's it!** The website is now running locally

### Using a Local Server (Optional)

For better performance and to test all features:

**Using Python:**
```powershell
# Python 3
python -m http.server 8000

# Then visit: http://localhost:8000
```

**Using Node.js:**
```powershell
npx serve

# Or install globally
npm install -g serve
serve
```

**Using VS Code Live Server:**
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

```

## Features

### Homepage
- Hero section with gradient background and CTA
- Feature cards with Font Awesome icons
- Animated 3-step guide with connecting lines
- Testimonials with gradient background
- Scroll progress indicator
- Smooth page transitions

### Features Page
- Detailed feature descriptions with AOS animations
- Interactive mockups and charts
- Staggered card animations
- Responsive layouts

### Nutrition & Health
- Searchable food database with live filtering
- Phase-specific tabs (Period, Pregnancy, Postpartum)
- Nutrition cards with hover effects
- Downloadable PDF plans
- Category-based organization
- Animated transitions

### Mental Wellness
- **Naari AI Chatbot** - Interactive chat with AI responses
- **Breathing Exercises** - Animated breathing guide with pulse effect
- **Journaling Prompts** - Rotating daily prompts
- **Meditation Library** - Categorized meditation sessions
- **Mood Tracker** - Emotion logging with localStorage
- **Wellness Articles** - Blog-style content cards

### About Us
- Company story with mission statement
- Animated reason cards
- Team member profiles with hover effects
- Values and vision sections
- Gradient symbol designs

### Contact
- Validated contact form with real-time feedback
- FAQ accordion with smooth expand/collapse
- Social media integration
- Success/error message notifications
- Form field animations

- Meal plan downloads (PDF)

## Dark Mode

The website includes a dark mode toggle:
- Click the moon/sun icon in the navigation
- Preference is saved in browser localStorage
- Automatic theme application on page load

## Responsive Design

Fully responsive across devices:
- **Desktop**: Full 12-column grid layout
- **Tablet**: Adapts to 2-column layouts
- **Mobile**: Single column, optimized touch targets

- Touch-optimized mobile interactions

## Customization

### Colors
Edit CSS variables in `css/style.css`:
```css
:root {
    --primary-color: #6366F1;
    --secondary-color: #8B5CF6;
    /* ... modify as needed */
}
```

### Content
- Edit HTML files directly to change text
- Replace placeholder images with actual assets
- Update team member information in `about.html`

### Functionality
- JavaScript files are modular and well-commented
- Easy to extend with additional features
- All interactive elements have event handlers

```

## Adding Images

Create an `images/` folder and add:
- `hero-illustration.svg` - Homepage hero image
- `user1.jpg`, `user2.jpg`, `user3.jpg` - Testimonial avatars
- Or use the fallback SVG placeholders (already implemented)

```

## Interactive Features

### Mental Wellness
- **Breathing Exercise**: Click "Start Exercise" to begin guided breathing
- **Journal Prompts**: Click "New Prompt" for fresh writing ideas
- **AI Chatbot**: Type messages and get AI responses
- **Quick Replies**: Click emotion buttons for instant chat

### Nutrition
- **Search**: Find foods by name or nutrient
- **Filter**: View by phase (Period, Pregnancy, Postpartum)
- **Favorites**: Star foods to save them
- **PDF Download**: Generate nutrition plans

### Contact
- **Form Validation**: Real-time error checking
- **FAQ Accordion**: Click questions to expand
- **Success Messages**: Visual feedback on submission

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- ✅ Safari (latest)
- Opera (latest)

## License

This project is created for educational and demonstration purposes.

## Credits

**Design Inspiration**: Modern healthcare UX/UI best practices  
**Font**: Poppins from Google Fonts  
**Icons**: Font Awesome for professional iconography

## Contributing

Feel free to customize and extend this project for your needs!

## Support

For questions or issues, visit the contact page or refer to the documentation.

---

**Built with care for women's wellness**

*Naari Care - Your Personal Wellness Companion*
