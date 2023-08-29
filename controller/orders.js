import Item from "../models/items.js";
import OrderItem from "../models/orderItem.js";
import Order from "../models/orders.js";

export const createOrder = async (req, res) => {
  try {
    const { customerName, shopName, orderItems } = req.body;

    const order = new Order({
      customerName,
      shopName,
    });

    if (orderItems && orderItems.length > 0) {
      for (const item of orderItems) {
        let itemId;

        if (item.id) {
          itemId = item.id;
        } else {
          const newItem = new Item({ name: item.name });
          const savedItem = await newItem.save();
          itemId = savedItem._id;
        }

        const orderItem = new OrderItem({
          itemId,
          name: item.name,
          count: item.count,
          status: 0,
          orderId: order._id,
        });

        await orderItem.save();

        order.orderItems.push(orderItem._id);
      }
    } else {
      res
        .status(400)
        .json({ error: true, message: "orderItems cannot be empty" });
      return;
    }

    await order.save();

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    if (error?.code === 11000) {
      res.status(400).json({ message: "Item already exists!", error: true });
    } else {
      res.status(500).json({ error });
    }
  }
};

export const listOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if 'page' is not provided
    const perPage = parseInt(req.query.per_page) || 20; // Default to 10 items per page if 'per_page' is not provided

    const statusesToFilter = req.query.status ? [req.query.status] : [0, 1];

    const total = await Order.where({
      orderStatus: { $in: statusesToFilter },
    }).countDocuments();

    const orders = await Order.find()
      .where({ orderStatus: { $in: statusesToFilter } })
      .populate("orderItems")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .select("-__v")
      .exec();

    res
      .status(200)
      .json({ data: orders, total, currentPage: page, perPage, error: false });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const deletedOrder = await Order.findByIdAndRemove(orderId);

    if (!deletedOrder) {
      res.status(400).json({ message: "Order not found", error: true });
      return;
    }

    res.status(200).json({ message: "Order deleted succesfully" });
  } catch (error) {
    res.status(400).json({ message: "Internal server error", error });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    if (req.body.status == undefined || req.body.id == undefined) {
      res.status(400).json({
        message: "The id, status feilds are required",
        error: true,
      });
      return;
    }
    const result = await Order.findByIdAndUpdate(
      req.body.id,
      {
        orderStatus: req.body.status,
      },
      { new: true }
    );

    if (!result) {
      res
        .status(400)
        .json({ message: "No orders found with that id", error: true });
    }

    res
      .status(200)
      .json({ data: result, message: "Status updated succesfully" });
  } catch (error) {
    res.status(500).json({ error, message: "Internal server error" });
  }
};
