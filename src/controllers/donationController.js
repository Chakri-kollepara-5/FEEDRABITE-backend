const {
  createDonationService,
  listDonationsService,
  claimDonationService,
} = require("../services/donationService");

const createDonation = async (req, res) => {
  try {
    const donation = await createDonationService(req.body, req.user);
    res.status(201).json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDonations = async (req, res) => {
  try {
    const { status } = req.query;
    const donations = await listDonationsService(status);
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const claimDonation = async (req, res) => {
  try {
    const result = await claimDonationService(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  createDonation,
  getDonations,
  claimDonation,
};
