const mongoose = require('mongoose');

const UserProdSchema = new mongoose.Schema(
  {
    // razorpay_order_id:{
    //   type: String,
      
    // },
    razorpay_payment_id:{
      type: String,
    },
    // razorpay_signature:{
    //   type: String,
    //   required: true,
    // },

    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    shippingaddress: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    pincode: {
      type: Number,
      required: true,
    },
    orderedProducts: [
      {
        productID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        requestedQuantity: {  // Changed from reqquantity to requestedQuantity
          type: Number,
          default: 0,  // Default to 0 (not requested)
        },
        orderedAt: {
          type: Date,
          default: Date.now,
        }
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("userprod", UserProdSchema);
