import mongoose from "mongoose";

const userschema = new mongoose.Schema({
  username: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userschema);

export default User;
