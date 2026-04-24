import { pool } from "../../config/database";
import { supabase } from "../../config/supabase";
import { AcceptOrderDTO, CreateOrderDTO, Order, OrderStatus, UpdateOrderPositionDTO, UpdateOrderStatusDTO } from "./orders.types";

export const createOrderService = async (data: CreateOrderDTO): Promise<Order> => {
    const { consumerid, storeid, total, destination } = data;
    const dbRequest = await pool.query(
        `INSERT INTO orders (consumerId, storeId, total, destination, status)
        VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6)
        RETURNING id, consumerid, storeid, total, status, createdat,
        ST_Y(destination::geometry) as destination_lat, 
        ST_X(destination::geometry) as destination_lng`,
        [consumerid, storeid, total, destination.longitude, destination.latitude, OrderStatus.CREATED],
    );

    return dbRequest.rows[0];
};

export const getAvailableOrdersService = async (): Promise<Order[]> => {
    const dbRequest = await pool.query(
        `SELECT *, 
        ST_Y(destination::geometry) as destination_lat, 
        ST_X(destination::geometry) as destination_lng 
        FROM orders 
        WHERE status = '${OrderStatus.CREATED}' 
        AND deliveryid IS NULL`
    );

    return dbRequest.rows;
};

export const acceptOrderService = async (data: AcceptOrderDTO): Promise<Order> => {

    const { id, deliveryid } = data;
    const dbRequest = await pool.query(
        `UPDATE orders
        SET deliveryid = $2,
            status = $3
        WHERE id = $1
         RETURNING *`,
        [id, deliveryid, OrderStatus.IN_DELIVERY]
    );

    return dbRequest.rows[0];
};

export const updateOrderPositionService = async (id: string, data: UpdateOrderPositionDTO) => {
    const { latitude, longitude } = data;

    const result = await pool.query(
        `UPDATE orders 
        SET delivery_position = ST_SetSRID(ST_MakePoint($2, $1), 4326),
            status = CASE 
                WHEN ST_DWithin(ST_SetSRID(ST_MakePoint($2, $1), 4326), destination, 5) THEN '${OrderStatus.DELIVERED}'
                ELSE status
            END
        WHERE id = $3
        RETURNING id, status, 
        ST_Y(delivery_position::geometry) as latitude, 
        ST_X(delivery_position::geometry) as longitude`,
        [latitude, longitude, id]
    );

    const updatedOrder = result.rows[0];

    const channel = supabase.channel(`order:${id}`);
    await channel.send({
        type: 'broadcast',
        event: 'position-update',
        payload: {
            latitude: updatedOrder.latitude,
            longitude: updatedOrder.longitude,
            status: updatedOrder.status
        }
    });

    return updatedOrder;
};

export const updateOrderStatusService = async (data: UpdateOrderStatusDTO): Promise<Order> => {
    const { id, status, deliveryid } = data;
    const dbRequest = await pool.query(
        `UPDATE orders
        SET status = $2, deliveryid = $3
        WHERE id = $1
         RETURNING *`,
        [id, status, deliveryid]
    );

    return dbRequest.rows[0];
};

export const getUserOrdersService = async (userId: string): Promise<Order[]> => {

    const dbRequest = await pool.query(
        `SELECT *,
        ST_Y(destination::geometry) as destination_lat, 
        ST_X(destination::geometry) as destination_lng
        FROM orders
        WHERE consumerid = $1
        OR deliveryid = $1
        ORDER BY createdat DESC`,
        [userId]
    );

    return dbRequest.rows;
};

export const getOrdersByStoreService = async (storeId: string): Promise<Order[]> => {
    const dbRequest = await pool.query(
        `SELECT * FROM orders WHERE storeId = $1 ORDER BY createdAt DESC`,
        [storeId]
    );
    return dbRequest.rows;
};
