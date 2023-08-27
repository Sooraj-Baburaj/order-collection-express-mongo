import express from "express";
import { addItem, deleteItem, listItems } from "../controller/items.js";
import isAuthorized from "../middlewares/authorization.js";

const router = express.Router();

router.post("/add", isAuthorized, addItem);
router.get("/list", isAuthorized, listItems);
router.delete("/delete/:id", isAuthorized, deleteItem);

export default router;
