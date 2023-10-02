import { executeQuery } from '../postgres-client.js';

export async function getByStateId(stateId, skip, limit) {
    if (!limit) {
        limit = 10;
    }
    if (!skip) {
        skip = 0;
    }
    const people = await getPeopleByStateId(stateId, skip, limit);
    const total = await countPeopleByStateId(stateId);
    return {
        total,
        people,
    };
}

export async function getByStateIdWithCache(stateId, skip, limit) {
    if (!limit) {
        limit = 10;
    }
    if (!skip) {
        skip = 0;
    }
    const people = await getPeopleByStateIdWithCache(stateId, skip, limit);
    const total = await countPeopleByStateIdWithCache(stateId);
    return {
        total,
        people,
    };
}

async function getPeopleByStateIdWithCache(stateId, skip, limit) {
    const people = await executeQuery(
        `
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            ST_AsGeoJSON(p."location") as location
        FROM person p
        WHERE p.state_id = $1
        ORDER BY p.id
        LIMIT $2 OFFSET $3
    `,
        [stateId, limit, skip],
    );
    return people.map(i => {
        return {
            ...i,
            firstName: i.first_name,
            lastName: i.last_name,
            location: JSON.parse(i.location),
        };
    });
}

async function countPeopleByStateIdWithCache(stateId) {
    const count = await executeQuery(
        `
        SELECT
            count(*)
        FROM person p
        WHERE p.state_id = $1
    `,
        [stateId],
    );
    return count[0].count;
}


async function getPeopleByStateId(stateId, skip, limit) {
    const people = await executeQuery(
        `
        SELECT
            p.id,
            p.first_name,
            p.last_name,
            ST_AsGeoJSON(p."location") as location
        FROM person p
        INNER JOIN state s ON
            s.gid  = $1 AND
            ST_CONTAINS(s.geom, p."location")
        ORDER BY p.id
        LIMIT $2 OFFSET $3
    `,
        [stateId, limit, skip],
    );
    return people.map(i => {
        return {
            ...i,
            firstName: i.first_name,
            lastName: i.last_name,
            location: JSON.parse(i.location),
        };
    });
}

async function countPeopleByStateId(stateId) {
    const count = await executeQuery(
        `
        SELECT
            count(*)
        FROM person p
        INNER JOIN state s ON
            s.gid  = $1 AND
            ST_CONTAINS(s.geom, p."location")
    `,
        [stateId],
    );
    return count[0].count;
}
