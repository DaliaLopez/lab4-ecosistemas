import { Request, Response } from "express";
import {
    acceptOrderService,
    createOrderService,
    getAvailableOrdersService,
    getOrdersByStoreService,
    getUserOrdersService,
    updateOrderPositionService,
    updateOrderStatusService
} from "./orders.service";
import {
    createOrderItemService,
    getOrderDetailsService
} from "./orderItems/orderItems.service";
import Boom from "@hapi/boom";



export const createOrderController = async (req: Request, res: Response) => {
    const { consumerid, storeid, total, items, destination } = req.body;

    if (!items || items.length === 0) {
        throw Boom.badRequest("Order must contain items");
    }

    if (!destination || typeof destination.latitude !== "number" || typeof destination.longitude !== "number") {
        throw Boom.badRequest("Valid destination (latitude and longitude) is required");
    }
    
    const order = await createOrderService({
        consumerid,
        storeid,
        total,
        destination
    });


    for (const item of items) {

        if (!item.productid) {
            throw Boom.badRequest("Each item must have a valid productid (all lowercase)");
        }
        
        await createOrderItemService({
            orderid: order.id,
            productid: item.productid,
            quantity: item.quantity,
            priceattime: item.priceattime
        });
    }


    return res.json(order);
};

export const getAvailableOrdersController = async (req: Request, res: Response) => {
    const orders = await getAvailableOrdersService();

    return res.json(orders);
};

export const acceptOrderController = async (req: Request, res: Response) => {

    const { id } = req.params;
    const { deliveryid } = req.body;

    const order = await acceptOrderService({
        id: String(id),
        deliveryid
    });

    return res.json(order);
};

export const updateOrderStatusController = async (req: Request, res: Response) => {

    const { id } = req.params;
    const { status } = req.body;
    const { deliveryid } = req.body;

    const order = await updateOrderStatusService({
        id: String(id),
        status,
        deliveryid
    });

    return res.json(order);
};

export const updateOrderPositionController = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
        throw Boom.badRequest("Latitude and longitude must be numbers");
    }

    const order = await updateOrderPositionService( String(id), {latitude, longitude} );
    
    return res.json(order);
};

export const getUserOrdersController = async (req: Request, res: Response) => {

    const { userId } = req.params;
    const orders = await getUserOrdersService(String(userId));
    return res.json(orders);
};

export const getOrderDetailsController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const details = await getOrderDetailsService(String(id));

        if (!details || details.length === 0) {
            console.log(`No se encontraron items para la orden: ${id}`);
            return res.status(200).json([]);
        }

        return res.json(details);
    } catch (error) {
        console.error("Error en getOrderDetailsController:", error);
        res.status(500).json({ message: "Error interno al obtener detalles" });
    }
};

export const getOrdersByStoreController = async (req: Request, res: Response) => {
    const { storeId } = req.params;
    const orders = await getOrdersByStoreService(String(storeId));

    res.status(200).json(orders);
};