const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const admin = require('../config/firebase');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    console.log('--- LOGIN REQUEST STARTED ---');
    // console.log('Headers:', JSON.stringify(req.headers)); // Optional: uncomment if needed
    // console.log('Body:', JSON.stringify(req.body));       // Optional: uncomment if needed

    try {
        const { firebaseToken } = req.body;

        if (!firebaseToken) {
            console.error('❌ Missing firebaseToken');
            res.status(400); // Bad Request
            throw new Error('Firebase token is required');
        }

        // 1. Verify Firebase Token
        let uid, email, name, picture;
        try {
            const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
            uid = decodedToken.uid;
            email = decodedToken.email ? decodedToken.email.toLowerCase() : null;
            name = decodedToken.name;
            picture = decodedToken.picture;
            console.log(`✅ Firebase Verified. UID: ${uid}, Email: ${email}`);
        } catch (authError) {
            console.error('❌ Firebase Verification Failed:', authError.message);
            // DEV BYPASS Logic
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ Entering DEV BYPASS mode...');
                const jwt = require('jsonwebtoken');
                const decoded = jwt.decode(firebaseToken);
                if (decoded) {
                    uid = decoded.sub || decoded.user_id;
                    email = decoded.email ? decoded.email.toLowerCase() : 'dev@example.com';
                    name = decoded.name;
                    picture = decoded.picture;
                    console.log(`⚠️ Dev Bypass Success. UID: ${uid}`);
                } else {
                    uid = 'dev_user_123';
                    email = 'dev@example.com';
                    name = 'Dev User';
                    console.log('⚠️ Dev Bypass User Used');
                }
            } else {
                res.status(401); // Unauthorized
                throw new Error('Invalid Firebase Token');
            }
        }

        // 2. Find or Create User
        // Try finding by UID first (Normal Login)
        let user = await User.findOne({ firebaseUid: uid });
        let isNewUser = false;

        if (user) {
            console.log(`✅ User found by UID: ${user._id}`);
        }

        // 3. Handle Orphaned Account (Email exists, UID doesn't match)
        if (!user && email) {
            console.log(`🔍 Checking for orphaned account with email: ${email}`);
            // Attempt to exclusively update the user with this email to link to new UID
            // We use findOneAndUpdate to ATOMICALLY check and update, avoiding race conditions
            // We also unset 'location' to fix legacy data issues
            user = await User.findOneAndUpdate(
                { email: email },
                {
                    $set: {
                        firebaseUid: uid,
                        name: name || undefined,
                        profileImage: picture || undefined
                    },
                    $unset: { location: 1 } // Sanitize corrupted location field
                },
                { new: true } // Return updated document
            );

            if (user) {
                console.log(`✅ Recovered/Linked Orphaned Account: ${user._id}`);
            }
        }

        // 4. Create New User if still not found
        if (!user) {
            console.log('🆕 Creating new user...');
            try {
                user = await User.create({
                    firebaseUid: uid,
                    email: email,
                    name: name || 'New User',
                    role: 'donor',
                    profileImage: picture || 'no-photo.jpg'
                });
                isNewUser = true;
                console.log(`✅ New User Created: ${user._id}`);
            } catch (createError) {
                // If create failed, it might be a race condition on unique email
                if (createError.code === 11000) {
                    console.warn('⚠️ Duplicate Key Error on Create (Race Condition). Retrying fetch...');
                    user = await User.findOne({ email: email });
                    if (!user) throw createError; // If still not found, real error
                } else {
                    throw createError;
                }
            }
        }

        // 5. Respond
        if (!user) {
            throw new Error('Failed to retrieve or create user.');
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
            isNewUser
        });

    } catch (error) {
        console.error('🔥 DATA CONTROLLER ERROR:', error);
        console.error(error.stack);
        // If status wasn't set, default to 500 (Server Error)
        // If it was set to 400/401 above, it keeps that.
        const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
        res.status(statusCode).json({
            message: error.message,
            stack: process.env.NODE_ENV === 'production' ? null : error.stack,
        });
    }
};

module.exports = { loginUser };
