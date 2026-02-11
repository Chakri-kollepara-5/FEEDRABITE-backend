const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    role: {
        type: String,
        enum: ['donor', 'ngo', 'volunteer', 'admin'],
        default: 'donor'
    },
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    phone: {
        type: String
    },
    address: {
        type: String
    },
    location: {
        // GeoJSON Point
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    },
    profileImage: {
        type: String,
        default: 'no-photo.jpg'
    },
    isVerified: { // For APIs/NGOs to be verified by Admin
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
