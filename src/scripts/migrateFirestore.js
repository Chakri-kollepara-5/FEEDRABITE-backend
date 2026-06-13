const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { admin } = require('../config/firebase');
const User = require('../models/User');
const Donation = require('../models/Donation');

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const db = admin.firestore();

        // ----------------------------
        // 0. CLEANUP 
        // ----------------------------
        console.log('Clearing existing MongoDB collections...');
        await User.deleteMany({});
        await Donation.deleteMany({});
        console.log('Collections cleared.');

        // ----------------------------
        // 1. Migrate Users
        // ----------------------------
        console.log('Migrating Users...');
        const usersSnapshot = await db.collection('users').get();
        const userMap = {};

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            const uid = doc.id;
            const email = userData.email ? userData.email.toLowerCase() : `missing_${uid}@example.com`;

            try {
                const user = await User.create({
                    firebaseUid: uid,
                    name: userData.displayName || userData.name || userData.username || 'User',
                    email: email,
                    role: userData.role || 'donor',
                    profileImage: userData.photoURL || userData.profileImage || 'https://via.placeholder.com/150',
                    phone: userData.phoneNumber || userData.phone,
                    location: {
                        type: 'Point',
                        coordinates: [0, 0],
                        formattedAddress: userData.address || userData.location || 'Unknown'
                    },
                    createdAt: userData.createdAt ? (userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt)) : new Date(),
                });
                userMap[uid] = user._id;
            } catch (err) {
                // console.error(`Failed to migrate user ${email}:`, err.message);
            }
        }
        console.log(`Migrated ${Object.keys(userMap).length} users.`);

        // CREATE LEGACY DONOR
        const legacyDonor = await User.create({
            firebaseUid: 'legacy_donor_uid',
            name: 'Legacy Donor',
            email: 'legacy_donor@feedra.com',
            role: 'donor',
            profileImage: 'https://via.placeholder.com/150',
            location: { type: 'Point', coordinates: [0, 0], formattedAddress: 'Feedra History' }
        });
        const legacyDonorId = legacyDonor._id;
        console.log('Created Legacy Donor for missing references.');

        // ----------------------------
        // 2. Migrate Donations
        // ----------------------------
        console.log('Migrating Donations...');
        const donationsSnapshot = await db.collection('donations').get();
        let donationCount = 0;

        for (const doc of donationsSnapshot.docs) {
            const d = doc.data();

            let mongoDonorId = userMap[d.donorId];
            if (!mongoDonorId) {
                mongoDonorId = legacyDonorId;
            }

            let status = 'POSTED';
            const s = d.status ? d.status.toLowerCase() : 'available';

            if (s === 'claimed') status = 'CLAIMED';
            else if (s === 'accepted') status = 'ACCEPTED';
            else if (s === 'picked_up' || s === 'collected') status = 'PICKED_UP';
            else if (s === 'completed' || s === 'delivered') status = 'DELIVERED';
            else if (s === 'expired') status = 'EXPIRED';
            else if (s === 'available' || s === 'posted') status = 'POSTED';

            let locationObj = {
                type: 'Point',
                coordinates: [0, 0],
                formattedAddress: 'Unknown'
            };

            if (d.location) {
                if (typeof d.location === 'string') {
                    locationObj.formattedAddress = d.location;
                } else if (typeof d.location === 'object') {
                    const lat = d.location.latitude || d.location.lat || 0;
                    const lng = d.location.longitude || d.location.long || d.location.lng || 0;
                    locationObj.coordinates = [lng, lat];
                    locationObj.formattedAddress = d.address || d.pickupAddress || 'Map Location';
                }
            }
            if (d.pickupAddress) locationObj.formattedAddress = d.pickupAddress;


            try {
                await Donation.create({
                    donorId: mongoDonorId,
                    title: d.title || d.foodType || d.name || 'Food Donation',
                    description: d.description || d.details || d.instructions || 'No description provided.',
                    items: [{
                        name: d.foodType || d.title || 'Item',
                        quantity: d.quantity || d.amount || '1',
                        category: 'Food'
                    }],
                    images: d.image ? [d.image] : (d.images || []),
                    status: status,
                    location: locationObj,
                    expiryTime: d.expiryDate ? (d.expiryDate.toDate ? d.expiryDate.toDate() : new Date(d.expiryDate)) : new Date(Date.now() + 86400000),
                    createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)) : new Date(),
                });
                donationCount++;
            } catch (err) {
                console.error(`Failed to migrate donation ${doc.id}:`, err.message);
            }
        }

        console.log(`Successfully Migrated ${donationCount} donations.`);
        process.exit();
    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
};

migrate();
