const router = require("express").Router();
const ObjectId = require('mongoose').Types.ObjectId;

const Order = require("../models/Order.model");
const { 
  verifyToken,
  verifyAuthorization,
  verifyAdminAccess,
} = require('../middlewares/verifyAuth');

// Get all orders - admin only
router.get("/", verifyAdminAccess, async (req, res) => {
  const query = req.query;

  try {
    let orders;
    if (query.status) {
      orders = await Order.find({ status: query.status });
    } else {
      orders = await Order.find();
    }

    return res.json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json(orderResponse.unexpectedError);
  }
});


// Create a new order - authenticated user
router.post("/", verifyToken, async (req, res) => {
  const { products, amount, address } = req.body;

  // Check if essential data is present
  if (!products || !Array.isArray(products) || !amount || !address) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields (products, amount, or address)"
    });
  }
  console.log("✅ JWT Payload:", req.user);
  try {
    const order = await Order.create({
      userID: ObjectId(req.user.uid),
      products,
      amount,
      address,
    });

    return res.json({
      ...orderResponse.orderCreated,
      orderID: order._id,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json(orderResponse.unexpectedError);
  }
});

// Get order statistics - admin only
router.get("/stats", verifyAdminAccess, async (req, res) => {
  const date = new Date();
  const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
  const previousMonth = new Date(date.setMonth(lastMonth.getMonth() - 1));

  try {
    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: previousMonth } } },
      { $project: { month: { $month: "$createdAt" }, sales: "$amount" } },
      {
        $group: {
          _id: "$month",
          sales: { $sum: "$sales" },
        },
      },
    ]);
    res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json(orderResponse.unexpectedError);
  }
});
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { products, amount } = req.body;

    if (!products || !Array.isArray(products) || !amount) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields (products or amount)",
      });
    }
    console.log("✅ JWT Payload:", req.user);

    const newOrder = new Order({
      userID: ObjectId(req.user.uid), // extract from JWT payload
      products,
      amount,
      status: "pending",
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ status: "error", message: "Something went wrong" });
  }
});


// Get an order - authorized user & admin only
router.get("/:id", verifyToken, async (req, res) => {
  try {
    let order;

    // Manually verify authorization
    if (req.user.isAdmin) {
      order = await Order.findById(req.params.id);
    } else {
      order = await Order.findOne({
        _id: ObjectId(req.params.id),
        userID: ObjectId(req.user.uid),
      });
    }

    if (!order) {
      return res.status(404).json(orderResponse.orderNotFound);
    }

    order = await order.populate({
      path: "products.productID",
      select: ["title", "price", "image"],
    });

    return res.json({ status: "ok", order });
  } catch (err) {
    console.error(err);
    return res.status(500).json(orderResponse.unexpectedError);
  }
});

// Update an order - admin only
router.put("/:id", verifyAdminAccess, async (req, res) => {
  const { status, products, amount } = req.body;

  // Check if data is valid
  if (status && !["pending", "processing", "shipped", "delivered"].includes(status)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid order status",
    });
  }

  try {
    await Order.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return res.json(orderResponse.orderUpdated);
  } catch (err) {
    console.error(err);
    return res.status(500).json(orderResponse.unexpectedError);
  }
});

// Delete an order - admin only
router.delete("/:id", verifyAdminAccess, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json(orderResponse.orderDeleted);
  } catch (err) {
    console.log(err);
    return res.status(500).json(orderResponse.unexpectedError);
  }
});

// Get user orders - authorized user & admin only
router.get("/user/:id", verifyAuthorization, async (req, res) => {
  try {
    const orders = await Order.find({ userID: req.params.id })
    .populate("userID", "username email")
    .populate("products.productID", "title image");
  
  
      // .populate({
      //   path: 'products.productID',
      //   select: ['title', 'image'],
      // });

    return res.json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json(orderResponse.unexpectedError);
  }
});

router.get("/with-users", verifyAdminAccess, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userID", "name email phone")
      .populate("products.productID", "title price image")
      .select("-__v");

    return res.status(200).json(orders);
  } catch (err) {
    console.error("Error in /with-users route:", err); // Add this for detailed error logging
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred",
      error: err.message, // 👈 Add this temporarily to see what’s wrong
    });
  }
});

module.exports = router;
const orderResponse = {
  orderCreated: {
    status: "ok",
    message: "Order has been created",
  },
  orderUpdated: {
    status: "ok",
    message: "Order has been updated",
  },
  orderDeleted: {
    status: "ok",
    message: "Order has been deleted",
  },
  orderNotFound: {
    status: "error",
    message: "Order not found",
  },
  unexpectedError: {
    status: "error",
    message: "An unexpected error occurred",
  },
};

module.exports = router;
