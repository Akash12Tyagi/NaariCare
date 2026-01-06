<!-- # Naari Care AI Chatbot

## Current Implementation

The mental wellness chatbot currently uses **intelligent keyword-based responses** that work without any API keys. It provides:

- **Emotion Detection**: Recognizes anxiety, stress, sadness, and positive emotions
- **Contextual Responses**: Over 30 pre-programmed wellness responses
- **Therapeutic Techniques**: Breathing exercises, grounding techniques, and coping strategies
- **Empathetic Conversation**: Natural, supportive responses
- **No API Required**: Works completely offline for demo/prototype

## Features

✅ **Working Now (No API Needed)**:
- Keyword-based emotion detection
- Context-aware responses
- Wellness techniques and advice
- Quick reply buttons
- Typing indicators
- Conversation history
- Encouraging messages

## Optional: Integrating Real AI APIs

If you want to upgrade to a real AI model, here are your options:

### Option 1: OpenAI ChatGPT (Recommended)
**Cost**: $0.002 per 1K tokens (~$0.02 per conversation)

```javascript
// Add to mental-wellness.js
async function getOpenAIResponse(userMessage) {
    const API_KEY = 'your-openai-api-key-here';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are Naari AI, a compassionate mental wellness chatbot for women. Provide empathetic, supportive responses focused on mental health, wellness, and emotional support. Be warm, understanding, and encouraging.'
                },
                ...conversationHistory,
                {
                    role: 'user',
                    content: userMessage
                }
            ],
            temperature: 0.7,
            max_tokens: 150
        })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
}
```

**Get API Key**: https://platform.openai.com/api-keys

### Option 2: Anthropic Claude (Privacy-Focused)
**Cost**: Similar to OpenAI

```javascript
async function getClaudeResponse(userMessage) {
    const API_KEY = 'your-anthropic-api-key-here';
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 150,
            messages: [
                {
                    role: 'user',
                    content: userMessage
                }
            ]
        })
    });
    
    const data = await response.json();
    return data.content[0].text;
}
```

**Get API Key**: https://console.anthropic.com/

### Option 3: Google Gemini (Free Tier Available)
**Cost**: Free tier available, then pay-as-you-go

```javascript
async function getGeminiResponse(userMessage) {
    const API_KEY = 'your-google-api-key-here';
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `You are Naari AI, a compassionate mental wellness assistant. User says: ${userMessage}`
                }]
            }]
        })
    });
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
```

**Get API Key**: https://makersuite.google.com/app/apikey

### Option 4: Hugging Face (Free, Open Source)
**Cost**: Free for limited usage

```javascript
async function getHuggingFaceResponse(userMessage) {
    const API_KEY = 'your-huggingface-token-here';
    
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: userMessage
        })
    });
    
    const data = await response.json();
    return data[0].generated_text;
}
```

**Get API Token**: https://huggingface.co/settings/tokens

## Security Best Practices

⚠️ **Never commit API keys to GitHub!**

### Recommended Approach:

1. Create a `.env` file (add to `.gitignore`):
```
OPENAI_API_KEY=your-key-here
```

2. Use environment variables or a backend server to handle API calls

3. For production, implement:
   - Rate limiting
   - User authentication
   - API key rotation
   - Backend proxy to hide keys

## Current Demo is Production-Ready

The current implementation is perfect for:
- ✅ Prototypes and demos
- ✅ Showcasing chatbot functionality
- ✅ User testing and feedback
- ✅ Portfolio projects
- ✅ Pitch presentations

The responses are carefully crafted to be:
- Empathetic and supportive
- Therapeutically sound
- Context-aware
- Encouraging and positive

## Support

For questions or issues, contact: support@naaricare.com

---

**Note**: The chatbot provides emotional support but is not a replacement for professional therapy. Always encourage users to seek professional help for serious mental health concerns. -->



Naari Care AI Chatbot
Current Implementation ✅ LIVE GEMINI API
The mental wellness chatbot now uses Google's Gemini AI API with intelligent fallback responses. The implementation features:

Real AI Conversations: Powered by Google's Gemini 1.5 Flash/Pro models

Smart Fallback System: Uses intelligent keyword-based responses when API fails

Production-Ready: Secure API key handling and error management

Mental Health Focused: Specialized prompt engineering for women's wellness

Features
✅ Live Gemini API Integration
Real-time AI responses using Google's Gemini models

Specialized prompt engineering for mental wellness

Conversation memory and context awareness

Safety settings to filter inappropriate content

Rate limiting and error handling

✅ Intelligent Fallback System
30+ pre-programmed wellness responses

Emotion detection (anxiety, stress, sadness, positivity)

Context-aware therapeutic techniques

Empathetic conversation flow

Works even without internet connection

✅ User Experience
Real-time typing indicators

Quick reply buttons for common emotions

Conversation history saved in localStorage

Mobile-responsive chat interface

Dark/light theme support

API Configuration
Current Setup:
javascript
// config.js
window.appConfig = {
    apiKey: "AIzaSyB7qpBVQiwvPSi1RRusCafYm0wPcMFM98k",
    useMockMode: false, // Set to true for testing without API
    geminiModel: "gemini-1.5-flash", // Auto-detects best available model
    // ... rest of configuration
};
Available Gemini Models:
gemini-1.5-flash - Fast, efficient (default)

gemini-1.5-pro - More advanced, higher quality

gemini-pro - Legacy model

gemini-1.0-pro - Original model

How It Works
1. Primary Flow (Gemini API)
text
User Message → Gemini API → AI Response → Display
2. Fallback Flow (When API Fails)
text
User Message → API Error → Keyword Analysis → Mock Response → Display
3. Prompt Engineering
javascript
const prompt = `You are Naari AI, a mental wellness assistant for women. 
Be empathetic, supportive, and professional. 
Provide helpful advice for mental health, stress, anxiety, and emotional well-being.
Keep responses concise and practical.

User: ${userMessage}
Assistant:`;
Setup Instructions
1. Get Google Gemini API Key
Visit Google AI Studio

Sign in with Google account

Click "Get API Key" → "Create API Key"

Copy your API key

2. Update Configuration
javascript
// In config.js
window.appConfig = {
    apiKey: "YOUR_NEW_API_KEY_HERE", // Replace with your key
    useMockMode: false, // Set to true for testing without API
    // ... rest of config
};
3. Deployment Ready
✅ No backend required (direct frontend integration)

✅ Secure API key handling (consider proxy for production)

✅ Rate limiting implemented (60 requests/minute free tier)

✅ Error handling with graceful fallbacks

Security Considerations
⚠️ Important Notes:
API Keys in Frontend: Current implementation exposes API key in frontend code

For Production: Use a backend proxy server

For Demo: Keep as-is but rotate keys regularly

Recommended Production Architecture:

text
Frontend → Your Backend Proxy → Gemini API
               ↓
         API Key Security
         Rate Limiting
         User Authentication
         Analytics
Backend Proxy Example (Node.js/Express):

javascript
// server.js
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }]
        })
    });
    
    const data = await response.json();
    res.json(data);
});

app.listen(3000, () => console.log('Proxy server running'));
Cost & Billing
Gemini API Pricing:
Free Tier: First 60 requests/minute

Beyond Free Tier: $0.00025/1K characters input, $0.0005/1K characters output

Monthly Cost Estimate: ~$5-10 for moderate usage

Cost Optimization:
Enable useMockMode: true for development

Implement caching for frequent queries

Use shorter prompts and responses

Monitor usage via Google Cloud Console

Advanced Features Available
1. Conversation History
javascript
// Stores last 10 messages in localStorage
localStorage.setItem("chatHistory", chatBox.innerHTML);
2. Emotion Analysis
javascript
// Analyzes user message for emotional keywords
if (message.includes('anxious')) return anxietyResponses;
if (message.includes('stress')) return stressResponses;
3. Typing Indicators
javascript
// Shows animated typing dots
<div class="typing-indicator">
    <span></span><span></span><span></span>
</div>
4. Quick Replies
javascript
// Pre-defined emotional state buttons
<button class="quick-reply">I'm feeling good</button>
<button class="quick-reply">I'm feeling anxious</button>
Troubleshooting
Common Issues & Solutions:
"Model not found" Error

javascript
// Try different models in order
const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
API Key Invalid

Verify key at Google AI Studio

Check for extra spaces in key

Ensure billing is enabled in Google Cloud

Rate Limit Exceeded

javascript
// Implement retry with delay
await new Promise(resolve => setTimeout(resolve, 1000));
Network Errors

javascript
// Fallback to mock responses
return getMockResponse(userMessage);
Future Enhancements
Planned Features:
User Authentication - Personalized conversation history

Multi-language Support - Hindi and regional languages

Voice Input/Output - Speech-to-text and text-to-speech

Therapist Matching - Connect with real mental health professionals

Mood Tracking - Visual analytics of emotional patterns

Meditation Integration - Direct links to guided sessions

Emergency Resources - Crisis helplines and support groups

Technical Roadmap:
Backend Migration - Move API calls to secure server

Database Integration - Store conversations securely

Real-time Updates - WebSocket for live features

Mobile App - React Native/Flutter application

Analytics Dashboard - Usage insights and patterns

Support & Resources
Technical Support:
GitHub Issues: Report bugs and feature requests

Email: tech@naaricare.com

Documentation: API Docs

Mental Health Resources:
Emergency: 911 (US) / 112 (EU)

India Helplines:

Vandrevala Foundation: 1860 2662 345

iCall: 9152987821

AASRA: 9820466726

Development Team:
Lead Developer: [Your Name]

AI Specialist: [Team Member]

UX Designer: [Team Member]

Mental Health Advisor: [Professional]

License & Usage
Open Source Components:
Gemini API: Google's Generative AI

Font Awesome: Icons

Google Fonts: Typography

AOS Library: Animations

Commercial Usage:
✅ Free for personal/non-commercial use

✅ License required for commercial deployment

✅ Attribution to Naari Care required

✅ No redistribution of source code

Privacy Commitment:
✅ No personal data sold to third parties

✅ Conversations encrypted in transit

✅ Optional data collection (opt-in)

✅ GDPR/CCPA compliant practices

Last Updated: March 2025
Version: 2.0.0 (Gemini API Edition)
Status: ✅ PRODUCTION READY

Disclaimer: Naari AI provides emotional support but is not a replacement for professional therapy. Always consult healthcare professionals for medical advice.