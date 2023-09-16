import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  category: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Item = mongoose.model("Item", itemSchema);

export default Item;
