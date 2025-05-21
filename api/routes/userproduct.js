const router = require("express").Router();
const UserProd = require("../models/userprod.model.js");
const twilio = require("twilio");
require("dotenv").config();
const client = twilio(process.env.account_sid, process.env.auth_token);
const verifyUser = require("../middlewares/verifyUser.js");
// Create a new order (user + product details)
// router.post("/create", async (req, res) => {
//   const { name, email, shippingaddress, phone, pincode, orderedProducts } = req.body;
//   console.log(name,email,shippingaddress,phone,pincode,orderedProducts);
//   try {
//     if (!name || !email || !shippingaddress || !phone || !pincode || !orderedProducts?.length) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const newUserOrder = new UserProd({
//       name,
//       email,
//       shippingaddress,
//       phone,
//       pincode,
//       orderedProducts,
//     });

//     const saved = await newUserOrder.save();
//     res.status(201).json(saved);
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res.status(500).json({ message: "Something went wrong" });
//   }
// });

const Product = require("../models/Product.model");

router.post("/create", async (req, res) => {
  const {razorpay_payment_id,name, email, shippingaddress, phone, pincode, orderedProducts } = req.body;

  try {
    if (!name || !email || !shippingaddress || !phone || !pincode || !orderedProducts?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Loop and update stock
    for (const item of orderedProducts) {
      const product = await Product.findById(item.productID);

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productID}` });
      }

      if (product.availableStock < item.quantity) {
        return res.status(400).json({ message: `Only ${product.availableStock} left for ${product.title}` });
      }

      product.availableStock -= item.quantity;
      await product.save();
    }

    // Save the order
    const newUserOrder = new UserProd({
      razorpay_payment_id,
      name,
      email,
      shippingaddress,
      phone,
      pincode,
      orderedProducts,
    });

    const saved = await newUserOrder.save();
     // Send SMS if payment is completed
     if (razorpay_payment_id) {
      const message = await client.messages.create({
        body: `Hi ${name}, your order has been placed successfully. Payment ID: ${razorpay_payment_id}`,
        from: process.env.phone,
        to: phone.startsWith('+') ? phone : `+91${phone}`, // Assumes Indian numbers
      });

      console.log("SMS sent:", message.sid);
    }
    res.status(201).json(saved);

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/orders/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const userOrders = await UserProd.find({ email }).populate("orderedProducts.productID");

    if (!userOrders || userOrders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    res.status(200).json(userOrders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user order by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await UserProd.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/getuser", async (req, res) => {
  try {
    const userProd = await UserProd.find().populate("orderedProducts.productID");;
    res.json(userProd);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json(productResponse.unexpectedError);
  }
});
// const getUserOrders = async (req, res) => {
//     try {
//       const users = await User.find().populate("orderedProducts.productID");
//       res.status(200).json(users);
//     } catch (err) {
//       console.error("Error fetching user orders:", err);
//       res.status(500).json({ message: "Server error" });
//     }
//   };


module.exports = router;
