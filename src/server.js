require("dotenv").config();
const validateEnv = require("./utils/validateEnv");
const { initRedis } = require("./services/cacheService");

// 1. Run critical env checks before importing other resources
validateEnv();

const app = require("./app");
const connectDB = require("./config/db");

const startServer = async () => {
    try {
        // Connect to Database first
        await connectDB();

        // Initialize Redis cache connection
        await initRedis();

        const PORT = process.env.PORT || 5001;
        app.listen(PORT, () => {
            console.log(`🚀 Feedra backend running on port ${PORT}`);
            // Log registered routes for debugging
            const routes = [];
            if (app._router && app._router.stack) {
              app._router.stack.forEach(r => {
                if (r.handle && r.handle.stack) {
                  r.handle.stack.forEach(layer => {
                    if (layer.route) {
                      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
                      routes.push(`  ${methods} ${r.regexp.source.replace('\\/?(?=\\/|$)', '').replace(/\\\//g,'/')} ${layer.route.path}`);
                    }
                  });
                }
              });
            }
            if (routes.length) {
              console.log('📋 Registered API routes:\n' + routes.join('\n'));
            }
        });
    } catch (error) {
        console.error('🔥 Server failed to start:', error);
        process.exit(1);
    }
};

startServer();