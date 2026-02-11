const app = require('./app');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    const PORT = process.env.PORT || 5000;

    // Listen on 0.0.0.0 to avoid IPv4/IPv6 loopback issues
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`Address: http://0.0.0.0:${PORT}`);
    });

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (err, promise) => {
      console.log(`Error: ${err.message}`);
      // Close server & exit process
      // server.close(() => process.exit(1));
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();