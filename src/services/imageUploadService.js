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

module.exports = { uploadImageToStorage };
