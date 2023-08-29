import express from "express";
import {
  listOrderItemsBulk,
  listOrderItems,
  updateOrderItemStatus,
} from "../controller/orderItem.js";
import isAuthorized from "../middlewares/authorization.js";

const router = express.Router();

router.get("/bulk-list", isAuthorized, listOrderItemsBulk);
router.get("/list", isAuthorized, listOrderItems);
router.post("/update", isAuthorized, updateOrderItemStatus);

export default router;
