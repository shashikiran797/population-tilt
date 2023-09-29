#!/bin/bash

# Set your PostgreSQL connection parameters
DB_NAME="test"
DB_USER="postgres"
DB_PASSWORD="postgres"
PERSON_TABLE_NAME="person"
STATES_TABLE_NAME="state"
PGPASSWORD=$DB_PASSWORD
CSV_FILE="./backend-assignment/individuals.csv"

# Download data from the S3 bucket
# only if backend-assignment.zip does not exist
if [ ! -f "./backend-assignment.zip" ]; then
    echo "Downloading data from S3..."
    curl https://backend-assignment.s3.us-east-2.amazonaws.com/backend-assignment.zip -o ./backend-assignment.zip
fi
unzip -o backend-assignment.zip

# Table setup in postgres
psql -d "$DB_NAME" -U "$DB_USER" -c "DROP TABLE IF EXISTS $PERSON_TABLE_NAME"
psql -d "$DB_NAME" -U "$DB_USER" -c "CREATE TABLE $PERSON_TABLE_NAME(id SERIAL, first_name text, last_name text, raw jsonb, location geometry(Point, 4326), PRIMARY KEY (id))"
node ./scripts/csv-to-json.js

echo "Loading data into PostgreSQL..."
cat ./backend-assignment/individuals.json | psql -d "$DB_NAME" -U "$DB_USER" -U postgres -c "COPY $PERSON_TABLE_NAME (raw) FROM STDIN;"

echo "Updating data in PostgreSQL..."
psql -d "$DB_NAME" -U "$DB_USER" -c "UPDATE $PERSON_TABLE_NAME SET first_name = raw->>'first_name', last_name = raw->>'last_name', location = ST_GeomFromGeoJSON(raw -> 'location' ->> 'geometry');"
psql -d "$DB_NAME" -U "$DB_USER" -c "ALTER TABLE $PERSON_TABLE_NAME DROP COLUMN raw;";

echo "Creating index..."
psql -d "$DB_NAME" -U "$DB_USER" -c "CREATE INDEX location_idx ON $PERSON_TABLE_NAME USING GIST (location);"

Specify the input GeoJSON folder and output SHP folder
INPUT_FOLDER="./backend-assignment/states"
OUTPUT_FOLDER="./backend-assignment/states-shp"

psql -d "$DB_NAME" -U "$DB_USER" -c "DROP TABLE IF EXISTS $STATES_TABLE_NAME";
psql -d "$DB_NAME" -U "$DB_USER" -c "CREATE TABLE $STATES_TABLE_NAME(gid serial,\
shapeid varchar(80),\
type varchar(80),\
iso_group varchar(80),\
name varchar(80),\
admin_leve int4)\
";
psql -d "$DB_NAME" -U "$DB_USER" -c "ALTER TABLE $STATES_TABLE_NAME ADD PRIMARY KEY (gid);"
psql -d "$DB_NAME" -U "$DB_USER" -c "SELECT AddGeometryColumn('','$STATES_TABLE_NAME','geom','4326','MULTIPOLYGON',2);"



# Loop through each GeoJSON file in the input folder
for GEOJSON_FILE in "$INPUT_FOLDER"/*.geojson; do
    if [ -f "$GEOJSON_FILE" ]; then
        # Extract the base name of the GeoJSON file without extension
        FILENAME=$(basename -- "$GEOJSON_FILE")
        FILENAME_NOEXT="${FILENAME%.*}"

        # Convert GeoJSON to SHP
        ogr2ogr -f "ESRI Shapefile" "$OUTPUT_FOLDER/$FILENAME_NOEXT.shp" "$GEOJSON_FILE"

        # Load SHP into PostgreSQL
        shp2pgsql -I -s 4326 "$OUTPUT_FOLDER/$FILENAME_NOEXT.shp" "$FILENAME_NOEXT" | psql -d "$DB_NAME" -U "$DB_USER"
        psql -d "$DB_NAME" -U "$DB_USER" -c "INSERT INTO $STATES_TABLE_NAME(shapeid, type, iso_group, name, admin_leve, geom) SELECT shapeid, type, iso_group, name, admin_leve, geom FROM $FILENAME_NOEXT;"
        psql -d "$DB_NAME" -U "$DB_USER" -c "DROP TABLE $FILENAME_NOEXT;"
    fi
done

echo "Conversion and loading complete."
