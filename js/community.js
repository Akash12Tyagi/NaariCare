// Community Page JavaScript

// Demo Messages for Different Channels
const channelMessages = {
    general: [
        { name: 'Priya Sharma', message: 'Hello everyone! New to this community. Excited to be here! 💕', time: '10:30 AM', reactions: ['❤️ 12', '👋 8'] },
        { name: 'Ananya Patel', message: 'Welcome! This is such a supportive space. Feel free to ask anything.', time: '10:32 AM', reactions: ['❤️ 5'] },
        { name: 'Sana Khan', message: 'I just started my wellness journey and this app has been amazing! The guided meditations are so helpful.', time: '10:45 AM', reactions: ['🎉 7', '❤️ 15'] },
        { name: 'Riya Verma', message: 'Does anyone have tips for managing stress? Having a tough week 😔', time: '11:00 AM', reactions: ['❤️ 9'] },
        { name: 'Neha Gupta', message: 'Meditation and deep breathing really help me! Try the guided sessions in the app. Also, don\'t forget to take breaks and practice self-care.', time: '11:05 AM', reactions: ['🙏 6', '❤️ 11'] }
    ],
    pregnancy: [
        { name: 'Meera Reddy', message: 'I\'m in my second trimester and experiencing back pain. Any suggestions?', time: '9:15 AM', reactions: ['❤️ 8'] },
        { name: 'Dr. Anjali', message: 'Prenatal yoga can be very helpful! Check with your doctor first though. Also, proper posture and a good pregnancy pillow can make a difference.', time: '9:20 AM', reactions: ['🙏 15', '❤️ 20'] },
        { name: 'Kavya Singh', message: 'Swimming helped me a lot during pregnancy! Very gentle on the body and relaxing too.', time: '9:30 AM', reactions: ['👍 10'] },
        { name: 'Pooja Jain', message: 'Make sure to use a pregnancy pillow for better sleep. Game changer! 🤰', time: '9:45 AM', reactions: ['❤️ 12', '👍 8'] },
        { name: 'Meera Reddy', message: 'Thank you all so much! I\'ll definitely try these suggestions. This community is amazing! 💕', time: '10:00 AM', reactions: ['❤️ 15'] }
    ],
    wellness: [
        { name: 'Simran Kaur', message: 'Just completed a 30-day meditation challenge! Feeling amazing ✨', time: '8:00 AM', reactions: ['🎉 25', '❤️ 30'] },
        { name: 'Tanvi Shah', message: 'That\'s inspiring! I want to start too. Any beginner tips?', time: '8:15 AM', reactions: ['👍 8'] },
        { name: 'Diya Mehta', message: 'Start with just 5 minutes a day. The app has great beginner sessions! Consistency is more important than duration.', time: '8:20 AM', reactions: ['🙏 12', '❤️ 18'] },
        { name: 'Aisha Rahman', message: 'Also, don\'t be hard on yourself if you miss a day. It\'s about progress not perfection 💪', time: '8:25 AM', reactions: ['❤️ 22'] },
        { name: 'Simran Kaur', message: 'Exactly! And the community challenges really helped keep me motivated. Join the next one!', time: '8:30 AM', reactions: ['🎉 15'] }
    ],
    nutrition: [
        { name: 'Isha Patel', message: 'Can someone share healthy breakfast ideas? I\'m running out of options 🍳', time: '7:00 AM', reactions: ['❤️ 10'] },
        { name: 'Nutritionist Maya', message: 'Try overnight oats with fruits and nuts! High in fiber and keeps you full. I can share a recipe if you\'d like.', time: '7:10 AM', reactions: ['🙏 20', '❤️ 25'] },
        { name: 'Ritu Sharma', message: 'Smoothie bowls are my go-to! Blend spinach, banana, berries with almond milk. Top with granola and seeds.', time: '7:20 AM', reactions: ['❤️ 18', '😋 12'] },
        { name: 'Isha Patel', message: 'These sound delicious! Thank you so much ladies! 💕', time: '7:30 AM', reactions: ['❤️ 8'] },
        { name: 'Anjali Desai', message: 'Don\'t forget protein! I add Greek yogurt or protein powder to my breakfast. Keeps energy levels stable.', time: '7:35 AM', reactions: ['👍 15'] }
    ],
    fitness: [
        { name: 'Zara Ali', message: 'Started my fitness journey today! Did a 20-minute home workout. Feeling proud! 💪', time: '6:30 AM', reactions: ['🎉 18', '❤️ 25'] },
        { name: 'Fitness Coach Priya', message: 'Amazing! Consistency is key. Remember to warm up and cool down properly to prevent injuries.', time: '6:45 AM', reactions: ['🙏 12'] },
        { name: 'Nisha Kumar', message: 'Which workout are you following? I need some beginner-friendly recommendations.', time: '7:00 AM', reactions: ['❤️ 6'] },
        { name: 'Zara Ali', message: 'I\'m using the workouts in the app! They have different levels and are easy to follow at home.', time: '7:10 AM', reactions: ['👍 10'] },
        { name: 'Shreya Iyer', message: 'Walking is also great! I do 30 mins daily and it\'s improved my mood and energy so much.', time: '7:20 AM', reactions: ['❤️ 14', '🚶 8'] }
    ],
    'mental-health': [
        { name: 'Tara Menon', message: 'Having an anxious day. Sometimes it feels overwhelming 😔', time: '2:00 PM', reactions: ['❤️ 20'] },
        { name: 'Dr. Sneha', message: 'Take deep breaths. You\'re not alone in this. Try the 4-7-8 breathing technique: breathe in for 4, hold for 7, out for 8.', time: '2:05 PM', reactions: ['🙏 25', '❤️ 30'] },
        { name: 'Pallavi Sen', message: 'Sending you love and strength 💕 Remember, it\'s okay to have difficult days. Be kind to yourself.', time: '2:10 PM', reactions: ['❤️ 28'] },
        { name: 'Rhea Kapoor', message: 'What helps me: taking a walk, journaling, or talking to someone. The crisis helpline feature in the app is also great.', time: '2:15 PM', reactions: ['🙏 15', '❤️ 18'] },
        { name: 'Tara Menon', message: 'Thank you all so much. This community means the world to me 💕', time: '2:25 PM', reactions: ['❤️ 35', '🤗 20'] }
    ]
};

const channelDescriptions = {
    general: 'A place for general conversations and introductions',
    pregnancy: 'Support and tips for expecting mothers',
    wellness: 'Share your wellness journey and tips',
    nutrition: 'Healthy recipes and nutrition advice',
    fitness: 'Fitness goals, workouts, and motivation',
    'mental-health': 'A safe space to discuss mental health and wellbeing'
};

const channelIcons = {
    general: 'fas fa-hashtag',
    pregnancy: 'fas fa-baby',
    wellness: 'fas fa-spa',
    nutrition: 'fas fa-apple-alt',
    fitness: 'fas fa-dumbbell',
    'mental-health': 'fas fa-brain'
};

// Current active channel
let currentChannel = 'general';

// Initialize Community Page
document.addEventListener('DOMContentLoaded', function() {
    loadChannelMessages(currentChannel);
    setupChannelSwitching();
    setupMessageSending();
});

// Load messages for a specific channel
function loadChannelMessages(channel) {
    const messagesContainer = document.getElementById('communityMessages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = '';
    
    const messages = channelMessages[channel] || channelMessages.general;
    messages.forEach(msg => {
        addMessageToChat(msg.name, msg.message, msg.time, msg.reactions, false);
    });
    
    // Update channel header
    updateChannelHeader(channel);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add a message to the chat
function addMessageToChat(name, message, time, reactions = [], isOwn = false) {
    const messagesContainer = document.getElementById('communityMessages');
    if (!messagesContainer) return;
    
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
    
    const reactionsHTML = reactions.length > 0 ? `
        <div class="message-reactions">
            ${reactions.map(r => `<span class="reaction-btn">${r}</span>`).join('')}
        </div>
    ` : '';
    
    const messageHTML = `
        <div class="community-message">
            <div class="message-header">
                <div class="message-avatar">${initials}</div>
                <span class="message-name">${name}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content ${isOwn ? 'own-message' : ''}">${message}</div>
            ${reactionsHTML}
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Update channel header
function updateChannelHeader(channel) {
    const channelNameEl = document.getElementById('currentChannelName');
    const channelDescEl = document.getElementById('currentChannelDesc');
    
    if (channelNameEl && channelDescEl) {
        const icon = channelIcons[channel] || 'fas fa-hashtag';
        const name = channel.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        channelNameEl.innerHTML = `<i class="${icon}"></i> ${name}`;
        channelDescEl.textContent = channelDescriptions[channel] || 'Welcome to this channel';
    }
}

// Setup channel switching
function setupChannelSwitching() {
    const channelButtons = document.querySelectorAll('.channel-item');
    
    channelButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            channelButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get channel name
            const channel = this.dataset.channel;
            currentChannel = channel;
            
            // Load messages for this channel
            loadChannelMessages(channel);
        });
    });
}

// Setup message sending
function setupMessageSending() {
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    
    if (!sendBtn || !messageInput) return;
    
    const sendMessage = () => {
        const message = messageInput.value.trim();
        if (message) {
            const currentTime = new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            addMessageToChat('You', message, currentTime, [], true);
            messageInput.value = '';
            
            // Simulate a response after 2 seconds
            setTimeout(() => {
                const responses = getChannelResponses(currentChannel);
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                const responseTime = new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                addMessageToChat(randomResponse.name, randomResponse.message, responseTime, ['❤️ 3']);
            }, 2000);
        }
    };
    
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Get appropriate responses based on channel
function getChannelResponses(channel) {
    const responses = {
        general: [
            { name: 'Priya Sharma', message: 'That\'s a great point! Thanks for sharing.' },
            { name: 'Ananya Patel', message: 'I completely agree with you!' },
            { name: 'Sana Khan', message: 'Thanks for your input! Very helpful.' },
            { name: 'Community Member', message: 'Interesting perspective! 💕' }
        ],
        pregnancy: [
            { name: 'Dr. Anjali', message: 'That\'s a good question. Always consult your doctor for personalized advice.' },
            { name: 'Meera Reddy', message: 'Thanks for sharing your experience! 🤰' },
            { name: 'Kavya Singh', message: 'I found that helpful too! Best wishes on your journey.' }
        ],
        wellness: [
            { name: 'Simran Kaur', message: 'Keep up the great work! You\'re doing amazing! ✨' },
            { name: 'Diya Mehta', message: 'That\'s inspiring! Thank you for sharing.' },
            { name: 'Aisha Rahman', message: 'Love this! We\'re all in this together 💪' }
        ],
        nutrition: [
            { name: 'Nutritionist Maya', message: 'Great choice! Remember to stay hydrated too.' },
            { name: 'Ritu Sharma', message: 'Yum! I need to try that recipe! 😋' },
            { name: 'Anjali Desai', message: 'Balance is key! Sounds delicious and nutritious.' }
        ],
        fitness: [
            { name: 'Fitness Coach Priya', message: 'Excellent! Keep pushing yourself!' },
            { name: 'Zara Ali', message: 'You\'ve got this! 💪 Stay consistent!' },
            { name: 'Shreya Iyer', message: 'That\'s awesome! Every step counts!' }
        ],
        'mental-health': [
            { name: 'Dr. Sneha', message: 'Thank you for being vulnerable. You\'re not alone. 💕' },
            { name: 'Pallavi Sen', message: 'Sending you love and strength. Take care of yourself.' },
            { name: 'Rhea Kapoor', message: 'We\'re here for you. Remember to practice self-compassion.' }
        ]
    };
    
    return responses[channel] || responses.general;
}

console.log('Community page loaded successfully!');
