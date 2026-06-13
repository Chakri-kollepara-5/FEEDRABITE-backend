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

    const startTime = Date.now();
    try {
        const { firebaseToken, userType, organization, phone } = req.body;

        if (!firebaseToken) {
            console.error('❌ Missing firebaseToken');
            res.status(400); // Bad Request
            throw new Error('Firebase token is required');
        }

        // 1. Verify Firebase Token
        let uid, email, name, picture;
        let isDevMock = false;

        if (process.env.NODE_ENV === 'development') {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.decode(firebaseToken);
            // If the token is not a valid Firebase JWT (e.g. mock token or alphanumeric string), bypass the verifyIdToken network request immediately to prevent slow timeouts.
            if (!decoded || !decoded.iss || !decoded.iss.startsWith('https://securetoken.google.com/')) {
                isDevMock = true;
                uid = decoded?.sub || decoded?.user_id || 'dev_user_123';
                email = decoded?.email ? decoded.email.toLowerCase() : 'dev@example.com';
                name = decoded?.name || req.body.name || 'Dev User';
                picture = decoded?.picture || 'no-photo.jpg';
                console.log(`⚠️ Dev Mock Token Bypass active. UID: ${uid}, Email: ${email}`);
            }
        }

        if (!isDevMock) {
            try {
                const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
                uid = decodedToken.uid;
                email = decodedToken.email ? decodedToken.email.toLowerCase() : (decodedToken.phone_number ? `${decodedToken.phone_number}@phone.com` : null);
                name = decodedToken.name || req.body.name;
                picture = decodedToken.picture;
                console.log(`✅ Firebase Verified (${Date.now() - startTime}ms). UID: ${uid}, Email: ${email}`);
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
                        name = decoded.name || req.body.name;
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
        }

        // 2. Find or Create User
        // Try finding by UID first (Normal Login)
        let user = await User.findOne({ firebaseUid: uid });
        let isNewUser = false;

        if (user) {
            console.log(`✅ User found by UID: ${user._id}`);
            
            // Auto elevate role if email contains 'admin'
            let roleToAssign = user.role;
            if (email && (email.startsWith('admin') || email.includes('admin@'))) {
                roleToAssign = 'admin';
            } else if (userType) {
                roleToAssign = userType;
            }

            // Only update if there are actual changes to reduce database round-trips
            const hasChanges = 
                (roleToAssign && roleToAssign !== user.role) ||
                (organization !== undefined && organization !== user.organization) ||
                (phone && phone !== user.phone) ||
                (name && name !== user.name) ||
                (picture && picture !== user.profileImage);

            if (hasChanges) {
                console.log('🔄 Updating existing user metadata (changes detected)...');
                user = await User.findByIdAndUpdate(
                    user._id,
                    {
                        $set: {
                            role: roleToAssign,
                            organization: organization !== undefined ? organization : user.organization,
                            phone: phone || user.phone,
                            name: name || user.name,
                            profileImage: picture || user.profileImage
                        }
                    },
                    { new: true }
                );
            }
        }

        // 3. Handle Orphaned Account (Email exists, UID doesn't match)
        if (!user && email) {
            console.log(`🔍 Checking for orphaned account with email: ${email}`);
            
            let roleToAssign = userType || 'donor';
            if (email && (email.startsWith('admin') || email.includes('admin@'))) {
                roleToAssign = 'admin';
            }

            // Attempt to exclusively update the user with this email to link to new UID
            // We use findOneAndUpdate to ATOMICALLY check and update, avoiding race conditions
            // We also unset 'location' to fix legacy data issues
            user = await User.findOneAndUpdate(
                { email: email },
                {
                    $set: {
                        firebaseUid: uid,
                        name: name || undefined,
                        profileImage: picture || undefined,
                        role: roleToAssign,
                        organization: organization || undefined,
                        phone: phone || undefined
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
            const { createIfMissing } = req.body;

            if (!createIfMissing) {
                console.warn(`⚠️ Login attempted for non-existent user: ${email}`);
                res.status(404); // Not Found
                throw new Error('User not found. Please register first.');
            }

            console.log('🆕 Creating new user...');
            try {
                let roleToAssign = userType || 'donor';
                if (email && (email.startsWith('admin') || email.includes('admin@'))) {
                    roleToAssign = 'admin';
                }
                user = await User.create({
                    firebaseUid: uid,
                    email: email,
                    name: name || 'New User',
                    role: roleToAssign,
                    organization: organization || undefined,
                    phone: phone || undefined,
                    profileImage: picture || 'no-photo.jpg'
                });
                isNewUser = true;
                console.log(`✅ New User Created (${Date.now() - startTime}ms): ${user._id}`);
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
            isNewUser,
            latency: Date.now() - startTime
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
