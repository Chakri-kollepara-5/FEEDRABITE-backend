const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({
    userId: {
        type: String, // Firebase UID or Mongoose ObjectId
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user'
    },
    content: {
        type: String,
        required: [true, 'Please add content']
    },
    images: [{
        type: String // URL
    }],
    likes: [{
        type: String // userIds
    }],
    comments: [{
        userId: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feed', feedSchema);
