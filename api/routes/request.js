// routes/userprod.js (or wherever your routes are)
const express = require('express');
const router = express.Router();
const RequestOrder = require('../models/request.model.js');

// POST: Request more quantity
router.post('/request-quantity', async (req, res) => {
  try {
    const { userId, productId, requestedQuantity } = req.body;

    if (!userId || !productId || !requestedQuantity) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newRequest = new RequestOrder({
      userId,
      productId,
      requestedQuantity,
    });

    await newRequest.save();

    res.status(201).json({ message: "Request submitted successfully", request: newRequest });
  } catch (err) {
    console.error("Error creating request:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get('/get-requests', async (req, res) => {
  try {
    const requests = await RequestOrder.find().populate('userId').populate('productId');
    res.status(200).json(requests);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
module.exports = router;
