import psycopg2

conn = psycopg2.connect(
    dbname="curahHujan_db",
    user="postgres",
    password="postgres",
    host="localhost",
    port=5432
)

def execute_query(query, params=None):
    cur = conn.cursor()
    try:
        cur.execute(query, params)

        # 🔥 kalau SELECT → fetch
        if query.strip().upper().startswith("SELECT"):
            result = cur.fetchall()
        else:
            # 🔥 WAJIB COMMIT
            conn.commit()

            # kalau ada RETURNING
            try:
                result = cur.fetchall()
            except:
                result = None

        return result

    except Exception as e:
        conn.rollback()
        print("DB ERROR:", e)
        raise e

    finally:
        cur.close()