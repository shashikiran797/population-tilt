import Express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
dotenv.config();
import { getAllStates, getPeopleByStateId } from './service.js';
import { swaggerOptions } from './swagger-config.js';

// To help in debugging
console.log(`DB_HOST: ${process.env.DB_HOST}`);

const app = Express();
const port = 80;

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
 *         geom:
 *           type: JSON
 *           description: Geometry shape in geojson standard format. Refer https://geojson.org/
 *       example:
 *         id: 1
 *         title: Andhra Pradesh
 *         geom: {"type":"MultiPolygon","coordinates":[[81.106099147,17.824355872]]}
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/State'
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
 *         description: State id
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *         required: false
 *         description: Number of records to skip
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         required: false
 *         description: Number of records to limit
 *     responses:
 *       200:
 *         description: The created book.
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

app.get('/health', (req, res) => {
    res.send('OK');
});

app.get('/', (req, res) => {
    res.send('OK');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
