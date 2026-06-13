const Feed = require("../models/Feed");
const HostelBite = require("../models/HostelBite");

const fetchDashboardSummary = async () => {
  const totalFeeds = await Feed.countDocuments();
  const activeHostelBite = await HostelBite.countDocuments({ status: "available" });

  return {
    totalFeeds,
    activeHostelBite,
  };
};

const fetchRecentFeeds = async (limit) => {
  const feeds = await Feed.find()
    .sort({ createdAt: -1 })
    .limit(limit);

  return feeds;
};

module.exports = {
  fetchDashboardSummary,
  fetchRecentFeeds,
};
