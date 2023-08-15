import express from "express";
import { createUser, userAuth } from "../controller/users.js";

const router = express.Router();

router.post("/create", createUser);
router.post("/auth", userAuth);

export default router;
