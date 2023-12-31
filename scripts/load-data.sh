#!/bin/bash

# Set your PostgreSQL connection parameters

PERSON_TABLE_NAME="person"
STATES_TABLE_NAME="state"
DB_NAME="population_tilt"
DB_USER="postgres"

# Local
# DB_PASSWORD="postgres"
# DB_HOST="localhost"

# Remote
DB_PASSWORD="RU6hhtAivyMLHr"
DB_HOST=iaacstack-populationtiltrds3c60dca9-qn7y6gdxboja.ctr7ftlvugnk.ap-south-1.rds.amazonaws.com

export PGPASSWORD=$DB_PASSWORD

# Download data from the S3 bucket
# only if backend-assignment.zip does not exist
if [ ! -f "./backend-assignment.zip" ]; then
    echo "Downloading data from S3..."
    curl https://backend-assignment.s3.us-east-2.amazonaws.com/backend-assignment.zip -o ./backend-assignment.zip
fi

# Unzip the downloaded file only if the backend-assignment folder does not exist
if [ ! -d "./backend-assignment" ]; then
    echo "Unzipping data..."
    unzip -o backend-assignment.zip
fi

echo "CREATE DATABASE $DB_NAME"
echo "$DB_HOST, $DB_USER, $DB_PASSWORD"

# echo "Creating database..."
psql -h "$DB_HOST" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME"
psql -h "$DB_HOST" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME"

# echo "Installing postgis extensions..."
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "CREATE EXTENSION IF NOT EXISTS postgis_raster;"
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;"
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "CREATE EXTENSION IF NOT EXISTS postgis_topology;"

# Table setup in postgres
echo "Creating table..."
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "DROP TABLE IF EXISTS $PERSON_TABLE_NAME"
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "CREATE TABLE $PERSON_TABLE_NAME(id SERIAL, first_name text, last_name text, raw jsonb, location geometry(Point, 4326), PRIMARY KEY (id))"
node ./scripts/csv-to-json.js


psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "DROP TABLE IF EXISTS $STATES_TABLE_NAME";
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "CREATE TABLE $STATES_TABLE_NAME(gid serial,\
shapeid varchar(80),\
type varchar(80),\
iso_group varchar(80),\
name varchar(80),\
admin_leve int4)\
";
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "ALTER TABLE $STATES_TABLE_NAME ADD PRIMARY KEY (gid);"

echo "Loading data into PostgreSQL..."
echo "This may take a while..."

# split ./backend-assignment/individuals.json file into files of 10000 lines each
echo "Splitting individuals.json file into files of 10000 lines each..."
cd ./backend-assignment
rm -rf split
mkdir split
cd split
split -l 10000 ../individuals.json split_


# Load data into PostgreSQL using split files
for FILE in ./split_*; do
    echo "Loading $FILE..."
    cat "$FILE" | psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -U postgres -c "COPY $PERSON_TABLE_NAME (raw) FROM STDIN;"
done


cd ../..

echo "Updating data in PostgreSQL... This might take a while..."
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "UPDATE $PERSON_TABLE_NAME SET first_name = raw->>'first_name', last_name = raw->>'last_name', location = ST_GeomFromGeoJSON(raw -> 'location' ->> 'geometry');"
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "ALTER TABLE $PERSON_TABLE_NAME DROP COLUMN raw;";
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "ALTER TABLE $PERSON_TABLE_NAME ADD COLUMN state_id int4;"
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "ALTER TABLE $PERSON_TABLE_NAME ADD CONSTRAINT fk_state_id FOREIGN KEY (state_id) REFERENCES $STATES_TABLE_NAME(gid);"

echo "Creating index..."
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "CREATE INDEX location_idx ON $PERSON_TABLE_NAME USING GIST (location);"

# Specify the input GeoJSON folder and output SHP folder
INPUT_FOLDER="./backend-assignment/states"
OUTPUT_FOLDER="./backend-assignment/states-shp"

psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "SELECT AddGeometryColumn('','$STATES_TABLE_NAME','geom','4326','MULTIPOLYGON',2);"
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "CREATE INDEX $STATES_TABLE_NAME_geom_idx ON $STATES_TABLE_NAME USING GIST (geom);"


# Loop through each GeoJSON file in the input folder
for GEOJSON_FILE in "$INPUT_FOLDER"/*.geojson; do
    if [ -f "$GEOJSON_FILE" ]; then
        # Extract the base name of the GeoJSON file without extension
        FILENAME=$(basename -- "$GEOJSON_FILE")
        FILENAME_NOEXT="${FILENAME%.*}"

        # Convert GeoJSON to SHP
        ogr2ogr -f "ESRI Shapefile" "$OUTPUT_FOLDER/$FILENAME_NOEXT.shp" "$GEOJSON_FILE"

        # Load SHP into PostgreSQL
        shp2pgsql -I -s 4326 "$OUTPUT_FOLDER/$FILENAME_NOEXT.shp" "$FILENAME_NOEXT" | psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER"
        psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "INSERT INTO $STATES_TABLE_NAME(shapeid, type, iso_group, name, admin_leve, geom) SELECT shapeid, type, iso_group, name, admin_leve, geom FROM $FILENAME_NOEXT;"

        echo "Updating state_id column in person table using $FILENAME_NOEXT..."
        psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "UPDATE $PERSON_TABLE_NAME \
            SET state_id = $STATES_TABLE_NAME.gid \
            FROM $STATES_TABLE_NAME WHERE ST_Contains($STATES_TABLE_NAME.geom, $PERSON_TABLE_NAME.location) \
            AND $STATES_TABLE_NAME.name IN (
                SELECT name from $FILENAME_NOEXT
            )
            ;"
        psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "DROP TABLE $FILENAME_NOEXT;"
    fi
done

psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "CREATE INDEX state_id_idx ON $PERSON_TABLE_NAME (state_id);"