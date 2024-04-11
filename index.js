import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import userRoutes from "./routes/users.js";
import itemRoutes from "./routes/items.js";
import orderRoutes from "./routes/orders.js";
import orderItemRoutes from "./routes/orderItems.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(
    "mongodb+srv://anaschemmala50:XX1Q5l2WXptDC77B@cluster0.to1ok26.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));

app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order-items", orderItemRoutes);

app.listen(PORT, () => console.log(`server running on Port:${PORT}`));
