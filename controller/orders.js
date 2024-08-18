import Item from "../models/items.js";
import OrderItem from "../models/orderItem.js";
import Order from "../models/orders.js";
import { capitalize } from "../utils/stringFunctions.js";

export const createOrder = async (req, res) => {
  try {
    const { contactNumber, shopName, orderItems, shopId, salesman,vehicleNumber } = req.body;


    const order = new Order({
      contactNumber,
      shopName,
      shopId,
      salesman,
      vehicleNumber,
    });

    if (orderItems && orderItems.length > 0) {
      for (const item of orderItems) {
        let itemId;

        if (item.id) {
          const isExistingItem = await Item.findById(item.id);
          if (isExistingItem) {
            itemId = item.id;
          } else {
            let newItemRef = { name: item.name };
            if (item.category) {
              newItemRef.category = capitalize(item.category);
            }
            const newItem = new Item(newItemRef);
            const savedItem = await newItem.save();
            itemId = savedItem._id;
          }
        } else {
          let newItemRef = { name: item.name };
          if (item.category) {
            newItemRef.category = capitalize(item.category);
          }
          const newItem = new Item(newItemRef);
          const savedItem = await newItem.save();
          itemId = savedItem._id;
        }

        const orderItem = new OrderItem({
          itemId,
          name: item.name,
          count: item.count,
          unit: item.unit,
          category: capitalize(item?.category ?? ""),
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
      res.status(500).json({ error: JSON.stringify(error) });
    }
    console.log(error);
  }
};

///// LIST ORDERS

export const listOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 20;
    const status = req.query.status;
    const searchQuery = req.query.search || "";
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    const searchPattern = new RegExp(searchQuery, "i");

    let query = {};

    if (searchPattern) {
      query = {
        $or: [{ shopName: searchPattern }, { contactNumber: searchPattern }],
      };
    }

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const statusesToFilter = status ? [status] : [0, 1];

    query.orderStatus = { $in: statusesToFilter };

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "orderItems",
        populate: {
          path: "itemId",
          model: "Item",
        },
      })
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

///// DELETE ORDER

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

///// UPDATE ORDER

export const updateOrder = async (req, res) => {
  try {
    const {
      orderStatus,
      contactNumber,
      shopName,
      shopId,
      salesman,
      vehicleNumber,
      orderItems,
      _id,
    } = req.body;

    if (
      orderStatus == undefined ||
      _id == undefined ||
      contactNumber == undefined
    ) {
      res.status(400).json({
        message: "The _id, orderStatus, contactNumber feilds are required",
        error: true,
      });
      return;
    }

    let updatedOrderItems = [];

    if (orderItems && orderItems.length > 0) {
      for (const item of orderItems) {
        if (!item._id) {
          let itemId;

          if (item.id) {
            const isExistingItem = await Item.findById(item.id);
            if (isExistingItem) {
              itemId = item.id;
            } else {
              const newItem = new Item({ name: item.name });
              const savedItem = await newItem.save();
              itemId = savedItem._id;
            }
          } else {
            const newItem = new Item({ name: item.name });
            const savedItem = await newItem.save();
            itemId = savedItem._id;
          }


          const orderItem = new OrderItem({
            itemId,
            name: item.name,
            count: item.count,
            unit: item.unit,
            status: 0,
            orderId: _id,
          });

          await orderItem.save();

          updatedOrderItems.push(orderItem._id);
        } else {
          await OrderItem.findByIdAndUpdate(item._id, item);
          updatedOrderItems.push(item._id);
        }
      }
    } else {
      res
        .status(400)
        .json({ error: true, message: "orderItems cannot be empty" });
      return;
    }

    const updatedOrderFeilds = {
      orderItems: updatedOrderItems,
      contactNumber,
      orderStatus,
      shopId,
      salesman,
      vehicleNumber,
    };

    if (shopName) {
      updatedOrderFeilds.shopName = shopName;
    }

    const result = await Order.findByIdAndUpdate(_id, updatedOrderFeilds, {
      new: true,
    }).populate("orderItems");

    if (!result) {
      res
        .status(400)
        .json({ message: "No orders found with that id", error: true });
    }

    res.status(200).json({ data: result, message: "Updated succesfully" });
  } catch (error) {
    res.status(500).json({ error, message: `Internal server error${error}` });
  }
};

// GET SINGLE ORDER

export const getOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const result = await Order.findById(orderId).populate({
      path: "orderItems",
      populate: {
        path: "itemId",
        model: "Item",
      },
    });

    if (!result) {
      res.status(400).json({ message: "Order not found", error: true });
      return;
    }

    res.status(200).json({ message: "success", data: result });
  } catch (error) {
    res.status(400).json({ message: "Internal server error", error });
  }
};
