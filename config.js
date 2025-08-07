// Google Calendar API Configuration
const GOOGLE_CONFIG = {
    API_KEY: 'YOUR_GOOGLE_API_KEY', // Ganti dengan API Key Anda
    CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com', // Ganti dengan Client ID Anda
    DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    SCOPES: 'https://www.googleapis.com/auth/calendar'
};

// AI Configuration (untuk future expansion)
const AI_CONFIG = {
    // Bisa ditambahkan OpenAI API key atau AI service lainnya
    ENABLE_ADVANCED_AI: false,
    OPENAI_API_KEY: '', // Optional: untuk AI yang lebih advanced
};

// App Configuration
const APP_CONFIG = {
    VERSION: '1.0.0',
    DEBUG_MODE: true,
    AUTO_SAVE: true,
    VOICE_LANGUAGE: 'id-ID',
    DEFAULT_PRIORITY: 'sedang',
    NOTIFICATION_DURATION: 4000
};
