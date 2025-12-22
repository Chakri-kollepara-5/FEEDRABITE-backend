const { db } = require("../config/firebase");

/**
 * CREATE donation
 */
const createDonationService = async (data, user) => {
  const ref = db.collection("donations").doc();

  const payload = {
    id: ref.id,
    foodType: data.foodType,
    description: data.description || "",
    quantity: data.quantity,
    location: data.location,
    status: "available",
    donorId: user.uid,
    donorName: user.name || "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await ref.set(payload);
  return payload;
};

/**
 * LIST donations (public)
 */
const listDonationsService = async (status) => {
  let query = db.collection("donations");

  if (status) {
    query = query.where("status", "==", status);
  }

  const snap = await query.orderBy("createdAt", "desc").get();

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * CLAIM donation
 */
const claimDonationService = async (id, user) => {
  const ref = db.collection("donations").doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new Error("Donation not found");
  }

  const data = snap.data();

  if (data.status !== "available") {
    throw new Error("Donation already claimed");
  }

  await ref.update({
    status: "claimed",
    claimedBy: user.uid,
    claimedAt: new Date(),
    updatedAt: new Date(),
  });

  return { id, status: "claimed" };
};

module.exports = {
  createDonationService,
  listDonationsService,
  claimDonationService,
};
