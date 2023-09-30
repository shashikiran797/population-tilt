import { executeQuery } from '../postgres-client.js';

export async function getAll() {
    const state = await executeQuery(`
        SELECT
            gid as id,
            name,
            ST_AsGeoJSON(geom) as geom
        FROM state
        ORDER BY gid ASC
    `);
    return state.map(s => {
        return {
            ...s,
            geom: JSON.parse(s.geom),
        };
    });
}
