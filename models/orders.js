import mongoose from "mongoose";

import OrderItem from "./orderItem.js";

const orderSchema = new mongoose.Schema({
  contactNumber: { type: String, required: true },
  shopName: { type: String },
  shopId: { type: String },
  salesman: { type: String },
  // vehicleNumber: { type: String },
  createdAt: { type: Date, default: Date.now },
  orderStatus: { type: Number, enum: [0, 1], default: 0 },
  orderItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "OrderItem" }],
});

orderSchema.pre("remove", async (next) => {
  try {
    await OrderItem.deleteMany({ _id: { $in: this.orderItems } });
    next();
  } catch (error) {
    next(error);
  }
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
