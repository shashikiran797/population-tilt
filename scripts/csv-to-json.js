import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { Transform } from 'stream';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const csvFilePath = path.join(__dirname, '../backend-assignment/test-individuals.csv');
// const jsonFilePath = path.join(__dirname, '../backend-assignment/test-individuals.json');

const csvFilePath = path.join(__dirname, '../backend-assignment/individuals.csv');
const jsonFilePath = path.join(__dirname, '../backend-assignment/individuals.json');

// exit if jsonFilePath exists
const fileExists = fs.existsSync(jsonFilePath);
if (fileExists) {
    console.error(`File ${jsonFilePath} already exists, not processing`);
    process.exit(1);
}

const outputStream = fs.createWriteStream(jsonFilePath, { encoding: 'utf8' });

const jsonTransformStream = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
        const toBeParsed = chunk.location + ',"' + chunk._3 + '",' + chunk._4;
        chunk.location = JSON.parse(toBeParsed);
        delete chunk._3;
        delete chunk._4;
        this.push(JSON.stringify(chunk) + '\n');
        callback();
    },
});

fs.createReadStream(csvFilePath, {
    encoding: 'utf8',
})
    .pipe(csv({
        escape: `"`
    }))
    .pipe(jsonTransformStream)
    .pipe(outputStream)
    .on('finish', () => {
        console.log(`CSV file converted to JSON and saved to ${jsonFilePath}`);
    })
    .on('error', (error) => {
        console.error('Error:', error.message);
    });
