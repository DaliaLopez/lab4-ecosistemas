import Boom from "@hapi/boom";
import { pool } from "../../config/database";
import { CreateStoreDTO, Store, UpdateStoreStatusDTO } from "./stores.types";

export const getStoresService = async (): Promise<Store[]> => {
    const dbRequest = await pool.query(`SELECT * FROM stores WHERE isopen = true`);
    return dbRequest.rows
}

export const createStoreService = async (data: CreateStoreDTO): Promise<Store> => {
    const { name, userid } = data;

    const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userid]);

    if (userCheck.rows.length === 0) {
        throw Boom.notFound("The user doesnt exist");
    }

    const userRole = userCheck.rows[0].role;

    if (userRole !== 'store') {
        throw Boom.forbidden("Only the users with role 'store' can create it");
    }

    const dbRequest = await pool.query(
        `INSERT INTO stores (name, userId) VALUES ($1, $2) RETURNING *`,
        [name, userid]
    );
    return dbRequest.rows[0];
}

export const updateStoreStatusService = async (data: UpdateStoreStatusDTO): Promise<Store> => {
    const { id, isopen } = data;
    const dbRequest = await pool.query(
        `UPDATE stores SET isopen = $1 WHERE id = $2 RETURNING *`,
        [isopen, id]
    );
    return dbRequest.rows[0];
}

export const getStoreByIdService = async (id: string): Promise<Store> => {
    const dbRequest = await pool.query(
        `SELECT * FROM stores WHERE id = $1`,
        [id]
    );
    if (dbRequest.rows.length === 0) throw Boom.notFound("Tienda no encontrada");
    return dbRequest.rows[0];
};

export const getStoreByUserIdService = async (userId: string): Promise<Store> => {
    const dbRequest = await pool.query(
        `SELECT * FROM stores WHERE userid = $1`,
        [userId]
    );
    if (dbRequest.rows.length === 0) throw Boom.notFound("Tienda no encontrada");
    return dbRequest.rows[0];
};