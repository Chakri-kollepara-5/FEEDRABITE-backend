require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const startServer = async () => {
    try {
        // Connect to Database first
        await connectDB();

        const PORT = process.env.PORT || 5001;
        app.listen(PORT, () => {
            console.log(`🚀 Feedra backend running on port ${PORT}`);
        });
    } catch (error) {
        console.error('🔥 Server failed to start:', error);
        process.exit(1);
    }
};

startServer();