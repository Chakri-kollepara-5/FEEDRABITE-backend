const { admin } = require('../config/firebase');
const Notification = require('../models/Notification'); // Mongoose model for history

const sendNotification = async ({ userId, title, message, data, type }) => {
    try {
        // 1. Save to MongoDB for history
        await Notification.create({
            userId,
            title,
            message,
            type,
            relatedId: data && data.relatedId ? data.relatedId : null
        });

        // 2. Send via FCM
        // We need the user's FCM token.
        // OPTION A: Store FCM token in User model during login/updates.
        // OPTION B: Client subscribes to topics (e.g. 'user_UID').
        // Let's assume Topic subscription for simplicity: 'user_{userId}'

        const topic = `user_${userId}`;

        const payload = {
            notification: {
                title,
                body: message,
            },
            data: {
                ...data,
                type: type || 'SYSTEM'
            },
            topic: topic
        };

        const response = await admin.messaging().send(payload);
        console.log('Successfully sent message:', response);
        return response;
    } catch (error) {
        console.error('Error sending notification:', error);
        // Don't crash the request if notif fails
        return null;
    }
};

module.exports = { sendNotification };
