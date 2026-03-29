const User = require('../models/User');

// @desc    Get community members (public/safe profile)
// @route   GET /api/community/members
// @access  Private
const getCommunityMembers = async (req, res, next) => {
    try {
        // Fetch users, limit to 20 for now, sort by createdAt
        const users = await User.find({})
            .select('name role location createdAt profileImage')
            .limit(50)
            .sort({ createdAt: -1 });

        // Transform for frontend
        const members = users.map(user => {
            const cleanName = user.name ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'user';
            const shortId = user._id ? user._id.toString().slice(-4) : '0000';
            const username = `@${cleanName}${shortId}`;

            return {
                id: user._id,
                name: user.name,
                username: username,
                userType: user.role,
                location: user.location?.formattedAddress || 'Unknown Location',
                donationsCount: 0, // We could aggregate this later if needed
                impactScore: 0, // Placeholder
                joinedDate: user.createdAt,
                profileImage: user.profileImage
            };
        });

        res.json(members);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCommunityMembers
};
