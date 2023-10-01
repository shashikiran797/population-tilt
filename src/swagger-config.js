const SERVER_DOMAIN = process.env.SERVER_DOMAIN || `localhost:${process.env.PORT || 80}`;
const SERVER_URL = `http://${SERVER_DOMAIN}`;
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
                url: SERVER_URL
            },
        ],
    },
    apis: ['./src/server.js'],
};
