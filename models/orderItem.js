import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  name: String,
  count: Number,
  status: { type: Number, enum: [0, 1], default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
});

const OrderItem = mongoose.model("OrderItem", orderItemSchema);

export default OrderItem;
