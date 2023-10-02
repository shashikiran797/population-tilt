import Express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
dotenv.config();
import { getAllStates, getPeopleByStateId, getPeopleByStateIdWithCache } from './service.js';
import { swaggerOptions } from './swagger-config.js';

// To help in debugging
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`PORT: ${process.env.PORT}`);

const app = Express();
const port = process.env.PORT || 80;

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * components:
 *   schemas:
 *     State:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: The auto-generated id of the state
 *         name:
 *           type: string
 *           description: Name of the state
 *       example:
 *         id: 1
 *         title: Andhra Pradesh
 *     Person:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: The auto-generated id of the person
 *         firstName:
 *           type: string
 *           description: First Name of the person
 *         lastName:
 *           type: string
 *           description: Last Name of the person
 *         location:
 *           type: number
 *           description: Person's location in geojson standard format. Refer https://geojson.org/
 *         example:
 *           id: 1
 *           firstName: Madeline
 *           lastName: Kihn
 *           location: {"type":"Point","coordinates":[85.598660227,24.845938619]}
 */

/**
 * @swagger
 * tags:
 *   name: States
 *   description: API to get all states
 * /states:
 *   get:
 *     summary: Get all states
 *     tags: [States]
 *     requestBody:
 *      required: false
 *     responses:
 *       200:
 *         description: The created book.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/State'
 *       500:
 *         description: Some server error
 *
 */
app.get('/states', async (req, res) => {
    res.json(await getAllStates());
});

/**
 * @swagger
 * tags:
 *   name: People
 *   description: API to get people by state id. Pagination is supported using skip and limit query params. Default limit is 10.
 * /states/{id}/people:
 *   get:
 *     summary: Get people by state id
 *     tags: [People]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         default: 6
 *         description: State id
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *         default: 0
 *         required: false
 *         description: Number of records to skip
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         default: 10
 *         required: false
 *         description: Number of records to limit
 *     responses:
 *       200:
 *         description: Count and the list of people
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Person'
 *       500:
 *         description: Some server error
 *
 */
app.get('/states/:id/people', async (req, res) => {
    const { skip, limit } = req.query;
    res.json(await getPeopleByStateId(req.params.id, skip, limit));
});

/**
 * @swagger
 * tags:
 *   name: People
 *   description: Same as the API to get people by state id. But this API uses cache to improve performance.
 * /states/{id}/people/fast:
 *   get:
 *     summary: Get people by state id, but faster
 *     tags: [People]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         default: 1
 *         required: true
 *         description: State id
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *         required: false
 *         default: 0
 *         description: Number of records to skip
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         required: false
 *         default: 10
 *         description: Number of records to limit
 *     responses:
 *       200:
 *         description: Count and the list of people
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Person'
 *       500:
 *         description: Some server error
 *
 */
app.get('/states/:id/people/fast', async (req, res) => {
    const { skip, limit } = req.query;
    res.json(await getPeopleByStateIdWithCache(req.params.id, skip, limit));
});

app.get('/health', (req, res) => {
    res.send('OK');
});

app.get('/', (req, res) => {
    res.send('OK');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
