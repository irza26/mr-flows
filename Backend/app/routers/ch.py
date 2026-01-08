from fastapi import APIRouter
from app.db import conn

router = APIRouter(prefix="/ch", tags=["Curah Hujan"])

RESOLUSI_MENIT = {
    "Paseh Cipaku": 10,
    "Kertasari": 10
}

def get_interval_minutes(station):
    return RESOLUSI_MENIT.get(station, 5)

@router.get("/dashboard")
def ch_dashboard(station: str):
    cur = conn.cursor()

    interval_menit = get_interval_minutes(station)
    cur.execute("""
        SELECT MAX(date + time)
        FROM rainfall
        WHERE station = %s
    """, (station,))
    last_time = cur.fetchone()[0]

    if not last_time:
        return {"error": "Data kosong"}

    cur.execute("""
        SELECT rainfall
        FROM rainfall
        WHERE station = %s
        ORDER BY (date + time) DESC
        LIMIT 1
    """, (station,))
    current = cur.fetchone()[0] or 0

    cur.execute("""
        SELECT COALESCE(SUM(rainfall), 0)
        FROM rainfall
        WHERE station = %s
          AND (date + time) > %s - INTERVAL '1 hour'
          AND (date + time) <= %s
    """, (station, last_time, last_time))
    per_hour = cur.fetchone()[0]

    cur.execute("""
        SELECT COALESCE(SUM(rainfall), 0)
        FROM rainfall
        WHERE station = %s
          AND (date + time) >= %s - INTERVAL '24 hours'
          AND (date + time) <= %s
    """, (station, last_time, last_time))
    daily = cur.fetchone()[0]

    cur.execute(f"""
        SELECT
            date_trunc('minute', date + time)
            - MOD(EXTRACT(MINUTE FROM date + time)::int, {interval_menit}) * INTERVAL '1 minute'
            AS bucket_time,
            SUM(rainfall) AS rain
        FROM rainfall
        WHERE station = %s
          AND (date + time) >= %s - INTERVAL '24 hours'
          AND (date + time) <= %s
        GROUP BY bucket_time
        ORDER BY bucket_time
    """, (station, last_time, last_time))

    chart = [
        {
            "time": r[0].strftime("%d %b %H:%M"),
            "rain_fall": round(r[1], 2)
        }
        for r in cur.fetchall()
    ]

    return {
        "current": round(current, 2),
        "interval_minute": interval_menit,
        "per_hour": round(per_hour, 2),
        "daily": round(daily, 2),
        "last_time": last_time.strftime("%Y-%m-%d %H:%M"),
        "prediction" : 0,
        "chart": chart
    }


@router.get("/sidebar")
def ch_sidebar():
    cur = conn.cursor()

    cur.execute("""
        WITH latest AS (
            SELECT
                station,
                MAX(date + time) AS last_time
            FROM rainfall
            GROUP BY station
        )
        SELECT
            r.station,
            COALESCE(SUM(r.rainfall), 0) AS rain_per_hour,
            l.last_time
        FROM rainfall r
        JOIN latest l ON r.station = l.station
        WHERE (r.date + r.time) > l.last_time - INTERVAL '1 hour'
          AND (r.date + r.time) <= l.last_time
        GROUP BY r.station, l.last_time
        ORDER BY r.station
    """)

    rows = cur.fetchall()

    return [
        {
            "name": r[0],
            "rain_fall": round(r[1], 2), 
            "time": r[2].strftime("%H:%M")
        }
        for r in rows
    ]

