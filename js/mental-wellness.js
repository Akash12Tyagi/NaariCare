// Mental Wellness Page JavaScript - Fixed version


console.log("Mental Wellness Chatbot Initializing...");
console.log("Config available?", !!window.appConfig);
console.log("API Key present?", !!window.appConfig?.apiKey);
console.log("Use Mock Mode?", window.appConfig?.useMockMode);

// Get DOM elements
const chatBox = document.getElementById('chatMessages');
const userInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('send-btn');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded");
    
    // Check if elements exist
    if (!chatBox) {
        console.error("❌ chatMessages element not found!");
        return;
    }
    if (!userInput) {
        console.error("❌ chatInput element not found!");
        return;
    }
    if (!sendBtn) {
        console.error("❌ send-btn element not found!");
        return;
    }
    
    console.log("✅ All chat elements found");
    
    // Add welcome message if chat is empty
    if (chatBox.querySelectorAll('.message').length === 0) {
        addMessage("Hello! I'm Naari AI, your personal wellness companion. How are you feeling today?", "bot");
    }
    
    // Set up quick reply buttons
    setupQuickReplies();
});

// Function to add message with proper styling
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    if (sender === 'bot') {
        messageDiv.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <p>${text}</p>
                <span class="message-time">${getCurrentTime()}</span>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${text}</p>
                <span class="message-time">${getCurrentTime()}</span>
            </div>
            <div class="message-avatar"><i class="fas fa-user"></i></div>
        `;
    }
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to get current time in HH:MM format
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Function to show typing indicator
function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing';
    typingDiv.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return typingDiv;
}

// Function to remove typing indicator
function removeTyping(typingDiv) {
    if (typingDiv && typingDiv.parentNode) {
        typingDiv.remove();
    }
}

// Function to get bot reply (using mock responses since API is failing)
async function getBotReply(userMessage) {
    // Mock responses for when API fails
    const mockResponses = [
        "I understand you're feeling that way. Remember, it's okay to have these feelings.",
        "Thank you for sharing that with me. How has this been affecting your day?",
        "That sounds challenging. Have you tried any relaxation techniques?",
        "I'm here to listen. Would you like to talk more about this?",
        "Many women experience similar feelings. You're not alone in this journey.",
        "Let's explore some coping strategies that might help. Would you like to try a breathing exercise?",
        "Your feelings are valid. Take a moment to breathe deeply with me.",
        "I appreciate you opening up. What's one small thing that might help you feel better?",
        "Sometimes just expressing how we feel can be therapeutic. Thank you for trusting me.",
        "Let's focus on one step at a time. What's one thing you can do right now to care for yourself?"
    ];
    
    // Only try API if we have a valid key AND mock mode is false
    const useAPI = window.appConfig?.apiKey && 
                   !window.appConfig?.useMockMode &&
                   window.appConfig?.apiKey !== "" &&
                   window.appConfig?.apiKey !== "YOUR_API_KEY_HERE";
    
    if (useAPI) {
        // Try to use API first, fall back to mock responses
        try {
            const apiKey = window.appConfig.apiKey;
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
            
            console.log("Attempting API call...");
            
            const response = await fetch(url, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    contents: [{
                        parts: [{text: `You are a compassionate mental wellness chatbot for women. A user says: "${userMessage}". Respond with empathy and support, keeping your response under 100 words.`}]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 200,
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            const apiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (apiResponse && apiResponse.length > 10) {
                console.log("✅ API response received");
                return apiResponse;
            } else {
                throw new Error("Empty API response");
            }
            
        } catch(error) {
            console.log("❌ API failed, using mock response:", error.message);
            // Fall through to mock response
        }
    } else {
        console.log("ℹ️ Using mock mode (safe default)");
    }
    
    // Use mock response
    function getRandomMockResponse() {
        return mockResponses[Math.floor(Math.random() * mockResponses.length)];
    }
    
    return getRandomMockResponse();
}

// Send button click handler
sendBtn.onclick = async () => {
    const message = userInput.value.trim();
    if (message === "") return;
    
    // Add user message
    addMessage(message, "user");
    userInput.value = "";
    
    // Show typing indicator
    const typingDiv = showTyping();
    
    try {
        // Get bot reply
        const botReply = await getBotReply(message);
        
        // Remove typing indicator
        removeTyping(typingDiv);
        
        // Add bot response
        addMessage(botReply, "bot");
        
        // Save chat history
        saveChatHistory();
        
    } catch (error) {
        console.error("Error in chat:", error);
        removeTyping(typingDiv);
        addMessage("Sorry, I encountered an error. Please try again.", "bot");
    }
};

// Send message on Enter key
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendBtn.click();
    }
});

// Set up quick reply buttons
function setupQuickReplies() {
    document.querySelectorAll('.quick-reply').forEach(button => {
        button.addEventListener('click', function() {
            // Remove emoji and trim to get clean text
            const message = this.textContent.replace(/[^\w\s]/g, '').trim();
            userInput.value = message;
            sendBtn.click();
        });
    });
}

// Save chat history to localStorage
function saveChatHistory() {
    const messages = chatBox.innerHTML;
    localStorage.setItem("chatHistory", messages);
}

// Load chat history from localStorage
function loadChatHistory() {
    const savedChat = localStorage.getItem("chatHistory");
    if (savedChat) {
        chatBox.innerHTML = savedChat;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Breathing exercise function
function startBreathing() {
    const breathCircle = document.getElementById('breathCircle');
    const breathText = document.getElementById('breathText');
    
    if (!breathCircle || !breathText) return;
    
    let isBreathingIn = true;
    let breathCount = 0;
    
    breathText.textContent = "Breathe In";
    breathCircle.style.animation = "breathe 4s ease-in-out infinite";
    
    // Change text based on breathing cycle
    const interval = setInterval(() => {
        if (isBreathingIn) {
            breathText.textContent = "Breathe Out";
            isBreathingIn = false;
        } else {
            breathText.textContent = "Breathe In";
            isBreathingIn = true;
            breathCount++;
            
            if (breathCount >= 3) {
                clearInterval(interval);
                setTimeout(() => {
                    breathCircle.style.animation = "none";
                    breathText.textContent = "Breathe In";
                    showSuccessMessage("Great job! 3 breathing cycles completed.");
                }, 4000);
            }
        }
    }, 4000);
}

// Journaling prompt function
const journalPrompts = [
    "What made you smile today?",
    "What are you grateful for right now?",
    "What's one challenge you overcame recently?",
    "How are you really feeling today?",
    "What's something you're looking forward to?",
    "What's a small win you had this week?",
    "What's your favorite way to practice self-care?",
    "What's a positive affirmation for yourself today?"
];

function newPrompt() {
    const promptElement = document.getElementById('journalPrompt');
    if (promptElement) {
        const currentPrompt = promptElement.textContent;
        let newPrompt;
        
        // Make sure we get a different prompt
        do {
            newPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
        } while (newPrompt === currentPrompt && journalPrompts.length > 1);
        
        promptElement.textContent = newPrompt;
    }
}

// Meditation Audio Controls (placeholder)
const meditationItems = document.querySelectorAll('.meditation-item');
meditationItems.forEach(item => {
    item.addEventListener('click', function() {
        const meditationType = this.textContent.trim().split('\n')[0];
        showSuccessMessage(`Starting ${meditationType} meditation...`);
        // Here you would implement actual audio playback
    });
});

// Mood Tracker
const moodOptions = document.querySelectorAll('.mood-option');
moodOptions.forEach(option => {
    option.addEventListener('click', function() {
        const mood = this.querySelector('i').className;
        
        // Visual feedback
        moodOptions.forEach(opt => opt.style.transform = 'scale(1)');
        this.style.transform = 'scale(1.3)';
        this.style.transition = 'transform 0.3s ease';
        
        // Save mood
        saveMood(mood);
        showSuccessMessage('Mood logged successfully!');
    });
});

function saveMood(mood) {
    const today = new Date().toISOString().split('T')[0];
    const moods = JSON.parse(localStorage.getItem('moods') || '{}');
    moods[today] = mood;
    localStorage.setItem('moods', JSON.stringify(moods));
}

// Helper function to show success messages
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

// Add CSS for animations if not already present
if (!document.querySelector('#chat-animations')) {
    const style = document.createElement('style');
    style.id = 'chat-animations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
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
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .message {
            animation: slideIn 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
}

console.log('Mental Wellness features loaded!');