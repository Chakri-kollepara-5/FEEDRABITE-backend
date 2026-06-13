const Feed = require("../models/Feed");

const createFeed = async (req, res) => {
  try {
    const { content, images } = req.body;
    const user = req.user; // Set by authMiddleware

    if (!content || content.trim() === "") {
      return res.status(400).json({
        message: "Feed content is required",
      });
    }

    const newFeed = new Feed({
      content,
      userId: user.id || user.uid,
      userEmail: user.email,
      role: user.role || 'user',
      images: images || [],
    });

    const feed = await newFeed.save();

    return res.status(201).json({
      message: "Feed created successfully",
      feed,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create feed",
      error: error.message
    });
  }
};

const getFeeds = async (req, res) => {
  try {
    const feeds = await Feed.find().sort({ createdAt: -1 }).limit(50);
    res.json(feeds);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch feeds", error: error.message });
  }
};

module.exports = {
  createFeed,
  getFeeds
};
