const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [50, 'Title can not be more than 50 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description can not be more than 500 characters']
    },
    quantity: {
        type: Number,
        required: [true, 'Please add quantity (kg)'],
        min: 1
    },
    items: [{
        name: String,
        quantity: String,
        category: String
    }],
    images: [{
        type: String // URL to Firebase Storage
    }],
    status: {
        type: String,
        enum: ['POSTED', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'EXPIRED', 'CANCELLED', 'CLAIMED'],
        default: 'POSTED',
        index: true
    },
    location: {
        // GeoJSON Point
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true,
            index: '2dsphere'
        },
        formattedAddress: String
    },
    expiryTime: {
        type: Date,
        required: true
    },
    claimedBy: { // NGO or Volunteer who accepted it
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pickedUpAt: Date,
    deliveredAt: Date,

    // --- AI Freshness Analysis Fields ---
    preparationTime: {
        type: Number, // hours ago
        default: 0
    },
    storageMethod: {
        type: String,
        enum: ['Room Temperature', 'Refrigerated', 'Frozen', 'Hot Held'],
        default: 'Room Temperature'
    },
    freshnessScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null
    },
    imageScore: {
        type: Number,
        default: null
    },
    foodCondition: {
        type: String,
        enum: ['Excellent', 'Good', 'Needs Immediate Pickup', 'High Risk', 'Unsafe', 'Pending Analysis'],
        default: 'Pending Analysis'
    },
    safeConsumptionHours: {
        type: Number,
        default: null
    },
    recommendedRadius: {
        type: Number, // km
        default: null
    },
    confidenceScore: {
        type: Number,
        default: null
    },
    aiNotes: {
        type: String,
        default: ''
    },
    analyzedAt: {
        type: Date,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

donationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
