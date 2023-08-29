import express from "express";
import {
  createOrder,
  deleteOrder,
  listOrders,
  updateOrderStatus,
} from "../controller/orders.js";
import isAuthorized from "../middlewares/authorization.js";

const router = express.Router();

router.post("/create", isAuthorized, createOrder);
router.get("/list", isAuthorized, listOrders);
router.delete("/delete/:id", isAuthorized, deleteOrder);
router.post("/update", isAuthorized, updateOrderStatus);

export default router;
