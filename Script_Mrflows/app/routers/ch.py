from fastapi import APIRouter, HTTPException
from app.db import conn

# 🔥 IMPORT WRF
from Scraper.wrf_rain import get_wrf_timeseries

import time

router = APIRouter(prefix="/ch", tags=["Curah Hujan"])

RESOLUSI_MENIT = {
    "Paseh Cipaku": 10,
    "Kertasari": 10
}

# =========================
# CACHE WRF (biar ga scrape terus)
# =========================
WRF_CACHE = {
    "data": None,
    "last_fetch": 0
}

def get_cached_wrf():
    now = time.time()

    if WRF_CACHE["data"] and (now - WRF_CACHE["last_fetch"] < 300):
        return WRF_CACHE["data"]

    data = get_wrf_timeseries()

    WRF_CACHE["data"] = data
    WRF_CACHE["last_fetch"] = now

    return data


def get_interval_minutes(station):
    return RESOLUSI_MENIT.get(station, 5)


@router.get("/dashboard")
def ch_dashboard(station: str):
    cur = conn.cursor()

    try:
        interval_menit = get_interval_minutes(station)

        # =========================
        # DATA REAL (DB)
        # =========================
        cur.execute("""
            SELECT MAX(datetime)
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
            ORDER BY datetime DESC
            LIMIT 1
        """, (station,))
        current = cur.fetchone()[0] or 0

        cur.execute("""
            SELECT COALESCE(SUM(rainfall), 0)
            FROM rainfall
            WHERE station = %s
              AND datetime > %s - INTERVAL '1 hour'
              AND datetime <= %s
        """, (station, last_time, last_time))
        per_hour = cur.fetchone()[0]

        cur.execute("""
            SELECT COALESCE(SUM(rainfall), 0)
            FROM rainfall
            WHERE station = %s
              AND datetime >= %s - INTERVAL '24 hours'
              AND datetime <= %s
        """, (station, last_time, last_time))
        daily = cur.fetchone()[0]

        cur.execute(f"""
            SELECT
                date_trunc('minute', datetime)
                - MOD(EXTRACT(MINUTE FROM datetime)::int, {interval_menit}) * INTERVAL '1 minute'
                AS bucket_time,
                SUM(rainfall) AS rain
            FROM rainfall
            WHERE station = %s
              AND datetime >= %s - INTERVAL '24 hours'
              AND datetime <= %s
            GROUP BY bucket_time
            ORDER BY bucket_time
        """, (station, last_time, last_time))

        chart = [
            {
                "time": r[0].strftime("%Y-%m-%d %H:%M"),
                "rain_fall": round(r[1], 2)
            }
            for r in cur.fetchall()
        ]

        # =========================
        # 🔥 WRF PREDICTION
        # =========================
        wrf_data = get_cached_wrf()
        station_series = wrf_data.get(station, [])

        prediction_value = 0
        if station_series:
            prediction_value = station_series[0]["rain_mm"] or 0

        prediction_chart = [
            {
                "time": t["time"],
                "rain": round(t["rain_mm"], 2)
            }
            for t in station_series
        ]

        return {
            "current": round(current, 2),
            "interval_minute": interval_menit,
            "per_hour": round(per_hour, 2),
            "daily": round(daily, 2),
            "last_time": last_time.strftime("%Y-%m-%d %H:%M"),

            # 🔥 WRF
            "prediction": round(prediction_value, 2),
            "prediction_chart": prediction_chart,

            # real data
            "chart": chart
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()


@router.get("/sidebar")
def ch_sidebar():
    cur = conn.cursor()

    try:
        cur.execute("""
            WITH latest AS (
                SELECT
                    station,
                    MAX(datetime) AS last_time
                FROM rainfall
                GROUP BY station
            )
            SELECT
                r.station,
                COALESCE(SUM(r.rainfall), 0) AS rain_per_hour,
                l.last_time
            FROM rainfall r
            JOIN latest l ON r.station = l.station
            WHERE r.datetime > l.last_time - INTERVAL '1 hour'
              AND r.datetime <= l.last_time
            GROUP BY r.station, l.last_time
            ORDER BY r.station
        """)

        rows = cur.fetchall()

        # 🔥 WRF
        wrf_data = get_cached_wrf()

        return [
            {
                "name": r[0],
                "rain_fall": round(r[1], 2),
                "time": r[2].strftime("%H:%M"),
                "prediction": round(
                    wrf_data.get(r[0], [{}])[0].get("rain_mm", 0), 2
                )
            }
            for r in rows
        ]

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()