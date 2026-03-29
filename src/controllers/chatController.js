const { admin, db } = require('../config/firebase');
const { sendNotification } = require('../services/notificationService');
const User = require('../models/User');

// @desc    Send a chat message
// @route   POST /api/chat/send
// @access  Private
const sendMessage = async (req, res, next) => {
    try {
        const { recipientId, text, conversationId } = req.body;
        const senderId = req.user._id.toString();

        if (!recipientId || !text) {
            res.status(400);
            throw new Error('Recipient and text are required');
        }

        let chatId = conversationId;

        // If no conversationId, check if one exists or create new
        if (!chatId) {
            // Logic to find existing conversation between these two
            // For simplicity, let's assume client sends conversationId OR we create one
            // A deterministic ID could be sorted UIDs: "min_max"
            const participants = [senderId, recipientId].sort();
            chatId = `${participants[0]}_${participants[1]}`;
        }

        const messageData = {
            conversationId: chatId,
            senderId,
            text,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            read: false
        };

        // 1. Add to Messages collection
        await db.collection('messages').add(messageData);

        // 2. Update/Create Conversation
        const conversationRef = db.collection('conversations').doc(chatId);
        await conversationRef.set({
            participants: [senderId, recipientId],
            lastMessage: {
                text,
                senderId,
                timestamp: new Date()
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 3. Send Notification to Recipient
        await sendNotification({
            userId: recipientId,
            title: `New message from ${req.user.name}`,
            message: text,
            type: 'MESSAGE_RECEIVED',
            data: {
                conversationId: chatId,
                senderId
            }
        });

        res.status(201).json({ message: 'Message sent', conversationId: chatId });
    } catch (error) {
        next(error);
    }
};

// @desc    Get conversations
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res, next) => {
    try {
        const snapshot = await db.collection('conversations')
            .where('participants', 'array-contains', req.user._id.toString())
            .orderBy('updatedAt', 'desc')
            .get();

        const conversations = [];
        snapshot.forEach(doc => {
            conversations.push({ id: doc.id, ...doc.data() });
        });

        res.json(conversations);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendMessage,
    getConversations
};
