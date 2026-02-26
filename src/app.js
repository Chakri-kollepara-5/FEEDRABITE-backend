const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const connectDB = require('./config/db'); // Will be called in server.js or here

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

const { errorHandler } = require('./middlewares/errorMiddleware');

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/impact', require('./routes/impactRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));


app.get('/', (req, res) => {
    res.send('Feedra API is running...');
});

// Error Handling Middleware
// Error Handling Middleware
app.use(errorHandler);

module.exports = app;
