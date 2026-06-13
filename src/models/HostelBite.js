const mongoose = require('mongoose');

const hostelBiteSchema = new mongoose.Schema({
    foodType: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'assigned', 'completed', 'cancelled'],
        default: 'available'
    },
    createdBy: {
        type: String, // UID or ObjectId
        required: true
    },
    assignedTo: {
        type: String // UID or ObjectId
    },
    assignedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('HostelBite', hostelBiteSchema);
