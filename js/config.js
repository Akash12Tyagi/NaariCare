// config.js - SAFE TO COMMIT
window.appConfig = {
    // API key - set this via environment variable or separate file
    apiKey: "", // Leave empty for safety
    
    // Use mock responses by default (safe and free)
    useMockMode: true,
    
    // Firebase functions URL (if using)
    firebaseFunctionsUrl: "https://us-central1-naari-care.cloudfunctions.net",
    
    // Mock responses
    mockResponses: {
        mentalWellness: [
            "I understand you're feeling stressed. Try taking 5 deep breaths.",
            "It's important to practice self-care. What's one small thing you can do for yourself today?",
            "Remember to be kind to yourself. You're doing the best you can.",
            "Have you tried mindfulness exercises? They can be very helpful.",
            "It's okay to not be okay. Your feelings are valid."
        ],
        general: [
            "I'm here to help. Tell me more about how you're feeling.",
            "Thank you for sharing. Would you like to talk more about this?",
            "That sounds challenging. How can I support you right now?"
        ]
    }
};

console.log("Config loaded - Using mock mode by default for safety");