const mongoose = require('mongoose');
const User = require('../models/User');
const Donation = require('../models/Donation');
const { db: firestore } = require('./firebase');

// ─────────────────────────────────────────────────────
// USER'S FIREBASE UID (owner of the 6 personal donations)
// ─────────────────────────────────────────────────────
const USER_FIREBASE_UID = 'cSex4DXYe5Xbhf28bPClPJIHEF12';
const USER_EMAIL        = 'vschakravarthi7@gmail.com';
const USER_NAME         = 'Chakravarthi';

const seedOriginalDonations = async () => {
    try {
        const count = await Donation.countDocuments();
        if (count >= 9) {
            console.log(`📋 Database already has ${count} donation(s) (≥9). Skipping seed.`);
            return;
        }

        // Clear any partial/old seed before inserting full original set
        if (count > 0) {
            console.log(`⚠️  Found ${count} incomplete donation(s). Clearing to reseed all 9 originals...`);
            await Donation.deleteMany({});
            // Also clear Firestore donations
            try {
                const fsSnap = await firestore.collection('donations').get();
                for (const doc of fsSnap.docs) { await doc.ref.delete(); }
                console.log('✅ Firestore donations cleared for fresh seed.');
            } catch (fsErr) {
                console.warn('⚠️ Firestore clear skipped:', fsErr.message);
            }
        }

        console.log('🌱 Seeding original 9 donations into MongoDB & Firestore...');

        // ── Seed Donors ──────────────────────────────────────────────
        const seedUsersData = [
            { firebaseUid: 'seed-donor-1', email: 'currypoint@feedra.org',  name: 'Curry Point Kitchen', role: 'donor' },
            { firebaseUid: 'seed-donor-2', email: 'bitesized@feedra.org',   name: 'Bite Sized Cafe',    role: 'donor' },
            { firebaseUid: 'seed-donor-3', email: 'superfresh@feedra.org',  name: 'Super Fresh Mart',   role: 'donor' },
            { firebaseUid: USER_FIREBASE_UID, email: USER_EMAIL,            name: USER_NAME,             role: 'donor' },
        ];

        const donorIds = {};
        for (const data of seedUsersData) {
            let user = await User.findOne({ firebaseUid: data.firebaseUid });
            if (!user) {
                user = await User.create(data);
            }
            donorIds[data.firebaseUid] = user._id;
        }

        const curryId    = donorIds['seed-donor-1'];
        const biteId     = donorIds['seed-donor-2'];
        const freshId    = donorIds['seed-donor-3'];
        const userId     = donorIds[USER_FIREBASE_UID];

        // ── Images ───────────────────────────────────────────────────
        const riceImg    = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop';
        const sandwichImg= 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=600';
        const fruitImg   = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2670&auto=format&fit=crop';
        const snackImg   = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2670&auto=format&fit=crop';

        // ── Donations ────────────────────────────────────────────────
        // Times relative to session start (Jun 12 ~10 AM IST = 04:30 UTC)
        const sessionStart = new Date('2026-06-12T04:30:00Z');

        const donationsData = [
            // ── 3 Community (Seeded) ────────────────────────────────
            {
                donorId:    curryId,
                title:      'Surplus Rice & Dal thali',
                description:'Freshly prepared rice and yellow dal, packed in hygienic containers.',
                quantity:   15,
                location: { type: 'Point', coordinates: [78.3908, 17.4842], formattedAddress: 'KPHB Phase 3, Hyderabad' },
                expiryTime: new Date(sessionStart.getTime() + 8  * 3600000),
                createdAt:  new Date(sessionStart.getTime() - 3600000),
                status:     'POSTED',
                urgency:    'high',
                images:     [riceImg],
            },
            {
                donorId:    biteId,
                title:      'Fresh Veggie Sandwiches',
                description:'Cucumber, tomato, and cheese sandwiches, individually wrapped.',
                quantity:   8,
                location: { type: 'Point', coordinates: [78.3489, 17.4483], formattedAddress: 'Gachibowli, Hyderabad' },
                expiryTime: new Date(sessionStart.getTime() + 4  * 3600000),
                createdAt:  new Date(sessionStart.getTime() - 1800000),
                status:     'POSTED',
                urgency:    'medium',
                images:     [sandwichImg],
            },
            {
                donorId:    freshId,
                title:      'Mixed Fruits Basket',
                description:'Apples, bananas, and oranges in good condition.',
                quantity:   10,
                location: { type: 'Point', coordinates: [78.3814, 17.4416], formattedAddress: 'Madhapur, Hyderabad' },
                expiryTime: new Date(sessionStart.getTime() + 24 * 3600000),
                createdAt:  new Date(sessionStart.getTime() - 7200000),
                status:     'POSTED',
                urgency:    'low',
                images:     [fruitImg],
            },

            // ── 6 Personal (User's own, all expired/claimed) ─────────
            {
                donorId:    userId,
                title:      'best one',
                description:'best one',
                quantity:   1,
                location: { type: 'Point', coordinates: [81.7337, 16.5288], formattedAddress: 'palakollu' },
                expiryTime: new Date('2025-12-23T04:36:00Z'),
                createdAt:  new Date('2025-12-23T00:36:00Z'),
                status:     'CLAIMED',
                urgency:    'medium',
                images:     [snackImg],
            },
            {
                donorId:    userId,
                title:      'Fresh apples and bananas',
                description:'Fresh apples and bananas',
                quantity:   10,
                location: { type: 'Point', coordinates: [81.7948, 17.8449], formattedAddress: 'tagarapuvalasa' },
                expiryTime: new Date('2025-12-23T04:07:00Z'),
                createdAt:  new Date('2025-12-23T00:07:00Z'),
                status:     'EXPIRED',
                urgency:    'medium',
                images:     [fruitImg],
            },
            {
                donorId:    userId,
                title:      'snacks with good energy',
                description:'snacks with good energy',
                quantity:   1,
                location: { type: 'Point', coordinates: [81.7948, 17.8449], formattedAddress: 'tagarapuvalasa' },
                expiryTime: new Date('2025-12-17T23:57:00Z'),
                createdAt:  new Date('2025-12-17T19:57:00Z'),
                status:     'CLAIMED',
                urgency:    'medium',
                images:     [snackImg],
            },
            {
                donorId:    userId,
                title:      'hostel food with full meals',
                description:'hostel food with full meals',
                quantity:   10,
                location: { type: 'Point', coordinates: [81.7788, 17.7219], formattedAddress: 'sangivalasa' },
                expiryTime: new Date('2025-12-17T23:50:00Z'),
                createdAt:  new Date('2025-12-17T19:50:00Z'),
                status:     'CLAIMED',
                urgency:    'medium',
                images:     [riceImg],
            },
            {
                donorId:    userId,
                title:      'best and healthy',
                description:'best and healthy',
                quantity:   1,
                location: { type: 'Point', coordinates: [81.7948, 17.8449], formattedAddress: 'tagarapuvalasa' },
                expiryTime: new Date('2025-12-02T16:20:00Z'),
                createdAt:  new Date('2025-12-02T12:20:00Z'),
                status:     'CLAIMED',
                urgency:    'medium',
                images:     [snackImg],
            },
            {
                donorId:    userId,
                title:      'bananas and papayas',
                description:'bananas and papayas',
                quantity:   4,
                location: { type: 'Point', coordinates: [81.7948, 17.8449], formattedAddress: 'tagarapuvalasa' },
                expiryTime: new Date('2025-12-01T16:00:00Z'),
                createdAt:  new Date('2025-11-30T12:00:00Z'),
                status:     'CLAIMED',
                urgency:    'low',
                images:     [fruitImg],
            },
        ];

        // ── Save to MongoDB ──────────────────────────────────────────
        const saved = await Donation.insertMany(donationsData);
        console.log(`✅ MongoDB seeded with ${saved.length} donations.`);

        // ── Sync to Firestore ────────────────────────────────────────
        const uidMap = {
            [curryId.toString()]:  'seed-donor-1',
            [biteId.toString()]:   'seed-donor-2',
            [freshId.toString()]:  'seed-donor-3',
            [userId.toString()]:   USER_FIREBASE_UID,
        };

        for (const d of saved) {
            const docRef = firestore.collection('donations').doc(d._id.toString());
            await docRef.set({
                donorId:     uidMap[d.donorId.toString()] || d.donorId.toString(),
                title:       d.title,
                description: d.description,
                quantity:    d.quantity,
                status:      d.status === 'POSTED' ? 'available' : d.status.toLowerCase(),
                urgency:     d.urgency || 'medium',
                image:       d.images[0] || '',
                createdAt:   d.createdAt,
                expiryDate:  d.expiryTime,
                location:    d.location.formattedAddress,
            });
        }

        console.log('✅ Firestore synced with all 9 original donations.');
        console.log('🎉 Database restore complete! All original donations are back.');
    } catch (e) {
        console.error('🔥 Error seeding original donations:', e.message);
    }
};

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false);
        mongoose.set('bufferCommands', false);
        mongoose.set('bufferTimeoutMS', 5000);

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            autoIndex: true
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        await seedOriginalDonations();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
