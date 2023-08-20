import express from "express";
import { createOrder } from "../controller/orders.js";

const router = express.Router();

router.post("/save", createOrder);

export default router;
