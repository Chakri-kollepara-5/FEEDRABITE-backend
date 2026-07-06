const Donation = require('../models/Donation');
const { db: firestore } = require('../config/firebase');

// Simple in-memory queue for retry logic
const syncQueue = [];

const processQueue = async () => {
    if (syncQueue.length === 0) return;
    console.log(`Processing dbSync queue... (${syncQueue.length} items)`);
    
    // Process a batch
    const items = syncQueue.splice(0, 10);
    
    for (const item of items) {
        try {
            if (item.target === 'firestore') {
                await syncToFirestore(item.data);
            } else if (item.target === 'mongodb') {
                await syncToMongoDB(item.data);
            }
        } catch (error) {
            console.error(`Retry failed for ${item.target} (ID: ${item.data._id}). Re-queueing.`, error.message);
            // Re-queue with a delay backoff logic could go here, for now just push back
            syncQueue.push(item);
        }
    }
};

// Retry queue interval (every 30 seconds)
setInterval(processQueue, 30000);

const syncToFirestore = async (donation) => {
    try {
        const docRef = firestore.collection('donations').doc(donation._id.toString());
        await docRef.set({
            donorId: donation.donorId.toString(),
            title: donation.title,
            description: donation.description,
            quantity: donation.quantity,
            status: donation.status === 'POSTED' ? 'available' : donation.status.toLowerCase(),
            urgency: donation.urgency || 'medium',
            image: (donation.images && donation.images.length > 0) 
                ? (donation.images[0].startsWith('data:image') && donation.images[0].length > 150000
                    ? 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop' 
                    : donation.images[0])
                : '',
            createdAt: donation.createdAt,
            expiryDate: donation.expiryTime,
            location: donation.location?.formattedAddress || '',
            
            // AI Fields
            freshnessScore: donation.freshnessScore,
            foodCondition: donation.foodCondition,
            safeConsumptionHours: donation.safeConsumptionHours,
            recommendedRadius: donation.recommendedRadius,
            preparationTime: donation.preparationTime,
            storageMethod: donation.storageMethod,
            updatedAt: new Date()
        }, { merge: true });
    } catch (error) {
        console.error("Firestore sync failed:", error.message);
        throw error;
    }
};

const syncToMongoDB = async (donationData) => {
    try {
        await Donation.findByIdAndUpdate(
            donationData._id,
            donationData,
            { new: true, upsert: true }
        );
    } catch (error) {
        console.error("MongoDB sync failed:", error.message);
        throw error;
    }
};

/**
 * Robustly saves a donation to both MongoDB and Firestore.
 * If one fails, it queues a retry for that specific database.
 */
const saveDonationWithDualSync = async (donationDocument) => {
    const data = donationDocument.toObject ? donationDocument.toObject() : donationDocument;
    
    // Invalidate cache dynamically to ensure real-time listings update
    try {
        const cacheService = require('./cacheService');
        await cacheService.del('donations:nearby');
        await cacheService.del('stats:impact');
        await cacheService.del(`donation:${data._id.toString()}`);
    } catch (cacheErr) {
        console.warn("Failed to clear cache on save:", cacheErr.message);
    }

    // 1. Try MongoDB
    let mongoSuccess = false;
    try {
        await syncToMongoDB(data);
        mongoSuccess = true;
    } catch (error) {
        syncQueue.push({ target: 'mongodb', data });
        console.warn(`Queued MongoDB sync for donation ${data._id}`);
    }

    // 2. Try Firestore
    let firestoreSuccess = false;
    try {
        await syncToFirestore(data);
        firestoreSuccess = true;
    } catch (error) {
        syncQueue.push({ target: 'firestore', data });
        console.warn(`Queued Firestore sync for donation ${data._id}`);
    }

    if (!mongoSuccess && !firestoreSuccess) {
        throw new Error("Critical Failure: Both MongoDB and Firestore saves failed.");
    }

    return true;
};

const deleteDonationWithDualSync = async (donationId) => {
    // Invalidate cache dynamically to ensure real-time listings update
    try {
        const cacheService = require('./cacheService');
        await cacheService.del('donations:nearby');
        await cacheService.del('stats:impact');
        await cacheService.del(`donation:${donationId.toString()}`);
    } catch (cacheErr) {
        console.warn("Failed to clear cache on delete:", cacheErr.message);
    }

    try {
        await Donation.findByIdAndDelete(donationId);
    } catch (e) {
        console.warn("MongoDB delete failed:", e.message);
    }
    
    try {
        await firestore.collection('donations').doc(donationId.toString()).delete();
    } catch (e) {
        console.warn("Firestore delete failed:", e.message);
    }
    
    return true;
};

module.exports = {
    saveDonationWithDualSync,
    deleteDonationWithDualSync,
    syncToFirestore,
    syncToMongoDB
};
