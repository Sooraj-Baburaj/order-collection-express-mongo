import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/users.js";

export const createUser = async (req, res) => {
  try {
    if (!req.body.username) {
      res.status(400).json({ message: "Username is required", error: true });
    } else if (!req.body.password) {
      res.status(400).json({ message: "Password is required", error: true });
    } else {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = new User({
        username: req.body.username,
        password: hashedPassword,
      });
      await user.save();
      res.status(200).json({ message: "success", user, error: false });
    }
  } catch (error) {
    if (error?.code === 11000) {
      res
        .status(400)
        .json({ message: "Username already exists!", error: true });
    } else {
      res.status(500).json({ error });
    }
  }
};

export const userAuth = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user) {
      const result = await bcrypt.compare(req.body.password, user.password);
      if (result) {
        const token = jwt.sign({ username: user.username }, process.env.SECRET);
        res.status(200).json({ token, message: "token created succesfully" });
      } else {
        res
          .status(400)
          .json({ message: "password doesn't match", error: true });
      }
    } else {
      res.status(400).json({ message: "User doesn't exist", error: true });
    }
  } catch (error) {
    res.status(500).json({ error, message: "Internal server error" });
  }
};
