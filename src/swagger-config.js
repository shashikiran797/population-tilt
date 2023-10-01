export const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Population research APIs',
            version: '0.1.0',
            description: 'APIs to analyse the population distribution',
        },
        servers: [
            {
                // TODO: Make this configurable
                url: 'http://localhost:80',
            },
        ],
    },
    apis: ['./src/server.js'],
};
