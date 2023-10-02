import * as stateRepository from './database/repositories/state-repository.js';
import * as personRepository from './database/repositories/person-repository.js';

export async function getAllStates() {
    return stateRepository.getAll();
}

export async function getPeopleByStateId(stateId, skip, limit) {
    return personRepository.getByStateId(stateId, skip, limit);
}

export async function getPeopleByStateIdWithCache(stateId, skip, limit) {
    return personRepository.getByStateIdWithCache(stateId, skip, limit);
}
