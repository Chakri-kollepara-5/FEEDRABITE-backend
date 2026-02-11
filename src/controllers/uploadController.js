const { uploadImageToStorage } = require('../services/imageUploadService');

// @desc    Upload image
// @route   POST /api/upload
// @access  Private
const uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400);
            throw new Error('No file uploaded');
        }

        const imageUrl = await uploadImageToStorage(req.file);

        res.json({
            message: 'Image uploaded successfully',
            imageUrl
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { uploadImage };
