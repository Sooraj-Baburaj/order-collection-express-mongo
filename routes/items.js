import express from "express";
import {
  addItem,
  deleteItem,
  listCategories,
  listItems,
} from "../controller/items.js";
import isAuthorized from "../middlewares/authorization.js";

const router = express.Router();

router.post("/create", isAuthorized, addItem);
router.get("/list", isAuthorized, listItems);
router.get("/list-categories", isAuthorized, listCategories);
router.delete("/delete/:id", isAuthorized, deleteItem);

export default router;
