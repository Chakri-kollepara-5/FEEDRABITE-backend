const mongoose = require('mongoose');

const communityEventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    organizer: {
        type: String,
        required: true
    },
    attendees: [{
        type: String // userIds
    }],
    maxAttendees: {
        type: Number,
        default: 50
    },
    type: {
        type: String,
        enum: ['distribution', 'awareness', 'pickup', 'cleanup', 'other'],
        default: 'other'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CommunityEvent', communityEventSchema);
