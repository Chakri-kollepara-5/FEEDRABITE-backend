const validateEnv = () => {
    const required = ['MONGO_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];
    const missing = [];

    for (const key of required) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        console.error('🔥 CRITICAL ERROR: Required Environment Variables Missing:', missing.join(', '));
        console.error('The application will now exit to prevent unexpected runtime crashes.');
        process.exit(1);
    }

    // Optional variables warnings
    const optional = ['REDIS_URL', 'GROQ_API_KEY'];
    for (const key of optional) {
        if (!process.env[key]) {
            console.warn(`⚠️ Warning: Optional environment variable [${key}] is missing. Some integrations may run in fallback/mock mode.`);
        }
    }
};

module.exports = validateEnv;
