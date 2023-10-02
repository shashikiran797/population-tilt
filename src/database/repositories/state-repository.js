import { executeQuery } from '../postgres-client.js';

export async function getAll() {
    const states = await executeQuery(`
        SELECT
            gid as id,
            name,
            ST_AsGeoJSON(geom) as geom
        FROM state
        ORDER BY gid ASC
    `);
    return states
}
