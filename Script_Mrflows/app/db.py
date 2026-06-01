import psycopg2
import psycopg2.pool
from contextlib import contextmanager

_DB_CONFIG = dict(
    dbname="curahHujan_db",
    user="postgres",
    password="postgres",
    host="localhost",
    port=5432,
)

_pool = psycopg2.pool.ThreadedConnectionPool(minconn=1, maxconn=10, **_DB_CONFIG)


@contextmanager
def get_db():
    """Context manager: ambil koneksi dari pool, rollback otomatis jika exception."""
    conn = _pool.getconn()
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


def execute_query(query, params=None):
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute(query, params)
            if query.strip().upper().startswith("SELECT"):
                return cur.fetchall()
            conn.commit()
            try:
                return cur.fetchall()
            except Exception:
                return None
        finally:
            cur.close()
