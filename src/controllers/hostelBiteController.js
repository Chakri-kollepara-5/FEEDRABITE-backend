const HostelBite = require("../models/HostelBite");

const createHostelBite = async (req, res) => {
  try {
    const { foodType, quantity, location } = req.body;
    const user = req.user;

    const newPost = new HostelBite({
      foodType,
      quantity,
      location,
      createdBy: user.id || user.uid,
      status: "available"
    });

    const saved = await newPost.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: "Failed to create HostelBite", error: error.message });
  }
};

const listHostelBite = async (req, res) => {
  try {
    const { status = "available", limit = 10 } = req.query;
    const posts = await HostelBite.find({ status })
      .sort({ createdAt: -1 })
      .limit(Number(limit));
      
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch HostelBites", error: error.message });
  }
};

const assignHostelBite = async (req, res) => {
  try {
    const user = req.user;
    const post = await HostelBite.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.status !== "available") {
      return res.status(400).json({ message: "Already assigned or completed" });
    }

    post.status = "assigned";
    post.assignedTo = user.id || user.uid;
    post.assignedAt = new Date();
    await post.save();

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to assign", error: error.message });
  }
};

module.exports = {
  createHostelBite,
  listHostelBite,
  assignHostelBite,
};
