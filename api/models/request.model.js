// models/RequestOrder.js
const mongoose = require('mongoose');

const requestOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userprod",
    required: true,
  },
  // orderId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   required: true,
  // },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  requestedQuantity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Fulfilled", "Rejected"],
    default: "Pending"
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("RequestOrder", requestOrderSchema);
