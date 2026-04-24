import { Router } from "express";
import { getOrdersByStoreController, updateOrderPositionController } from './orders.controller';

import {
    createOrderController,
    getAvailableOrdersController,
    acceptOrderController,
    updateOrderStatusController,
    getUserOrdersController,
    getOrderDetailsController
} from "./orders.controller";

export const router = Router();

router.post("/", createOrderController);
router.get("/available", getAvailableOrdersController);
router.patch("/:id/accept", acceptOrderController);
router.patch("/:id/position", updateOrderPositionController);
router.patch("/:id/status", updateOrderStatusController);
router.get("/user/:userId", getUserOrdersController);
router.get("/:id/details", getOrderDetailsController);
router.get("/store/:storeId", getOrdersByStoreController);