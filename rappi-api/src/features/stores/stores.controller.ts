import { Request, Response } from "express";
import { createStoreService, getStoreByIdService, getStoreByUserIdService, getStoresService, updateStoreStatusService } from './stores.service';
import Boom from "@hapi/boom";

export const getStoresController = async (req: Request, res: Response) => {
    const stores = await getStoresService();
    return res.json(stores);
}

export const createStoreController = async (req: Request, res: Response) => {
    const { name, userid } = req.body;
    const store = await createStoreService({ name, userid })
    if (!name || !userid) {
        throw Boom.badRequest("name and userId are required");
    }
    return res.json(store);
}

export const updateStoreStatusController = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isopen } = req.body;

    if (isopen === undefined) {
        throw Boom.badRequest('isopen field is required');
    }

    const updateStore = await updateStoreStatusService({ id: String(id), isopen });
    return res.json(updateStore);
};

export const getStoreByIdController = async (req: Request, res: Response) => {
    const { id } = req.params;
    const store = await getStoreByIdService(String(id));
    res.status(200).json(store);
};

export const getStoreByUserIdController = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const store = await getStoreByUserIdService(String(userId));
    res.status(200).json(store);
};