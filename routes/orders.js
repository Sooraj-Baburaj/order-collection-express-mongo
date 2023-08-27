import express from "express";
import { createOrder, listOrders } from "../controller/orders.js";
import isAuthorized from "../middlewares/authorization.js";

const router = express.Router();

router.post("/create", isAuthorized, createOrder);
router.get("/list", isAuthorized, listOrders);

export default router;
