const express = require("express");
const router = express.Router();
const Review = require("../models/Review.js");

// @route   POST /reviews/create
// @desc    Submit a product review
router.post("/create", async (req, res) => {
  try {
    const { productId, userId, orderId, review, rating } = req.body;

    // Optional: Prevent duplicate reviews for the same product by same user/order
    const alreadyReviewed = await Review.findOne({ productId, userId, orderId });
    if (alreadyReviewed) {
      return res.status(400).json({ message: "You have already submitted a review for this product in this order." });
    }

    const newReview = new Review({
      productId,
      userId,
      orderId,
      review,
      rating,
    });

    await newReview.save();
    res.status(201).json({ message: "Review submitted successfully!" });
  } catch (err) {
    console.error("Error submitting review:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/average/:productId", async (req, res) => {
    const { productId } = req.params;
    try {
      const reviews = await Review.find({ productId });
      if (reviews.length === 0) return res.json({ averageRating: 0 });
  
      const total = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = total / reviews.length;
  
      res.json({ averageRating: averageRating.toFixed(1) }); // rounded to 1 decimal
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch average rating" });
    }
  });

module.exports = router;
