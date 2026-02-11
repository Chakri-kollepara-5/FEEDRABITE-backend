const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['DONATION_NEARBY', 'PICKUP_ACCEPTED', 'DELIVERY_COMPLETED', 'MESSAGE_RECEIVED', 'SYSTEM'],
        default: 'SYSTEM'
    },
    read: {
        type: Boolean,
        default: false
    },
    relatedId: { // Could be Donation ID or Conversation ID
        type: mongoose.Schema.Types.ObjectId
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 30 // Auto delete after 30 days
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
