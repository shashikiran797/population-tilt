import { executeQuery } from '../postgres-client.js';

export async function getAll() {
    const states = await executeQuery(`
        SELECT
            gid as id,
            name
        FROM state
        ORDER BY gid ASC
    `);
    return states
}
