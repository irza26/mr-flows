import psycopg2

conn = psycopg2.connect(
    dbname="curahHujan_db",
    user="postgres",
    password="postgres",
    host="localhost",
    port=5432
)
