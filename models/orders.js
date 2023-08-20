import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customername: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
