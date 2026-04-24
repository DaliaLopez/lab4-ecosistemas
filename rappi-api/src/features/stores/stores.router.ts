import { Router } from "express";
import { createStoreController, getStoreByIdController, getStoreByUserIdController, getStoresController, updateStoreStatusController } from "./stores.controller";

export const router = Router();

router.get('/', getStoresController);
router.post('/', createStoreController);
router.patch('/:id', updateStoreStatusController);
router.get('/:id', getStoreByIdController);
router.get('/user/:userId', getStoreByUserIdController);