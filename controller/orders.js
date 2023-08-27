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

        console.log(order._id);

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

    const total = await Order.countDocuments();

    // const orders = await Order.find().populate('orderItems').exec();

    const orders = await Order.find()
      .skip((page - 1) * perPage)
      .limit(perPage)
      .select("-__v");

    res
      .status(200)
      .json({ data: orders, total, currentPage: page, perPage, error: false });
  } catch (error) {
    res.status(500).json({ error });
  }
};
