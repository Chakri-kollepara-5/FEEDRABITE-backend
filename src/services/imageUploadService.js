const { admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

const uploadImageToStorage = async (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            return reject('No file provided');
        }

        const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
        const filename = `images/${uuidv4()}_${file.originalname}`;
        const fileUpload = bucket.file(filename);

        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        blobStream.on('error', (error) => {
            reject(error);
        });

        blobStream.on('finish', () => {
            // Get public URL
            // Make the file public
            fileUpload.makePublic()
                .then(() => {
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
                    resolve(publicUrl);
                })
                .catch(err => {
                    // Fallback for private buckets or if makePublic fails (requires permissions)
                    // simplified:
                    resolve(`https://storage.googleapis.com/${bucket.name}/${filename}`);
                });
        });

        blobStream.end(file.buffer);
    });
};

const uploadBase64ImageToStorage = async (base64Str) => {
    return new Promise((resolve, reject) => {
        if (!base64Str) {
            return reject('No image data provided');
        }

        // Match base64 pattern and extract content-type/data
        const matches = base64Str.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!matches) {
            // If it doesn't look like base64, assume it's already a URL
            return resolve(base64Str);
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const extension = mimeType.split('/')[1] || 'jpg';

        if (!admin || !admin.apps || admin.apps.length === 0) {
            console.warn("⚠️ Firebase Admin not initialized. Using fallback placeholder image URL.");
            return resolve("https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop");
        }

        const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
        const filename = `images/${uuidv4()}.${extension}`;
        const fileUpload = bucket.file(filename);

        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: mimeType,
            },
        });

        blobStream.on('error', (error) => {
            console.error("Firebase Storage write stream error:", error);
            reject(error);
        });

        blobStream.on('finish', () => {
            fileUpload.makePublic()
                .then(() => {
                    resolve(`https://storage.googleapis.com/${bucket.name}/${filename}`);
                })
                .catch(() => {
                    resolve(`https://storage.googleapis.com/${bucket.name}/${filename}`);
                });
        });

        blobStream.end(buffer);
    });
};

module.exports = { uploadImageToStorage, uploadBase64ImageToStorage };

