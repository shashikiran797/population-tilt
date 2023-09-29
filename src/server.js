
import Express from 'express';
import {executeQuery} from './database/postgres-client.js';

const app = Express();
const port = 3000;

app.get('/', async (req, res) => {
    const t = await executeQuery('SELECT NOW()')
    res.send(t[0].now);
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})