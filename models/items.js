import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
});

const Item = mongoose.model("Item", itemSchema);

export default Item;
