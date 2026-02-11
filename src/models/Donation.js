const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Donation', donationSchema);
