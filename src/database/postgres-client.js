import pg from 'pg';
import * as config from './config.js';
const { Pool} = pg;

const pool = new Pool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
})

export const executeQuery = async (sql, params) => {
    const results = await pool.query(sql, params);
    return results.rows;
}