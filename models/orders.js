import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  shopName: { type: String },
  createdAt: { type: Date, default: Date.now },
  orderItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "OrderItem" }],
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
