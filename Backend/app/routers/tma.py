from fastapi import APIRouter, HTTPException
from app.db import conn
import time
import requests
from app.services.tma_service import predict_series

router = APIRouter(prefix="/tma", tags=["TMA"])

# =====================================================
# EXTERNAL THRESHOLD API (BBWS Citarum)
# Mapping internal station name → wlobscd di API eksternal
# =====================================================
EXTERNAL_API_URL = "https://ffws-bbwscitarum.id/waterlevel/WlIfList/agccd/bsncd"
STATION_WLOBSCD = {
    "Bendung_Wanir": "206016005",
}

_threshold_cache = {}
_CACHE_TTL = 3600  # 1 jam


def get_external_thresholds(station: str):
    """Ambil wrnstep1/2/3 dari API BBWS. Fallback ke alert_rules DB jika gagal."""
    wlobscd = STATION_WLOBSCD.get(station)
    if not wlobscd:
        return _get_db_thresholds()

    now = time.time()
    cached = _threshold_cache.get(wlobscd)
    if cached and (now - cached["ts"]) < _CACHE_TTL:
        return cached["rules"]

    try:
        resp = requests.post(EXTERNAL_API_URL, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        items = data.get("resultData", data) if isinstance(data, dict) else data

        for item in items:
            if str(item.get("wlobscd")) == wlobscd:
                rules = [
                    {"label": "Waspada", "threshold": float(item["wrnstep1"])},
                    {"label": "Siaga",   "threshold": float(item["wrnstep2"])},
                    {"label": "Bahaya",  "threshold": float(item["wrnstep3"])},
                ]
                _threshold_cache[wlobscd] = {"ts": now, "rules": rules}
                return rules
    except Exception as e:
        print(f"EXTERNAL THRESHOLD ERROR: {e} — fallback ke DB")

    return _get_db_thresholds()


def _get_db_thresholds():
    """Ambil threshold dari alert_rules DB, skip rule Aman."""
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT rule_name, threshold FROM alert_rules
            WHERE module = 'tma' AND status = 'active' AND rule_name != 'Aman'
            ORDER BY threshold ASC
        """)
        rules = [{"label": r[0], "threshold": float(r[1])} for r in cur.fetchall()]
        cur.close()
        return rules if rules else None
    except Exception as e:
        print(f"DB THRESHOLD ERROR: {e}")
        return None


@router.get("/dashboard")
def get_tma_dashboard(station: str):
    cur = conn.cursor()

    try:
        # ======================
        # DATA UTAMA
        # ======================
        cur.execute("""
            SELECT
                AVG(water_level),
                MAX(water_level),
                MIN(water_level),
                MAX(datetime)
            FROM tma
            WHERE station = %s
        """, (station,))
        row = cur.fetchone()

        if not row or row[0] is None:
            return {"error": "Data kosong"}

        avg, max_, min_, last_time = row
        avg = round(float(avg), 2)

        # ======================
        # LAST VALUE
        # ======================
        cur.execute("""
            SELECT water_level
            FROM tma
            WHERE station = %s
            ORDER BY datetime DESC
            LIMIT 1
        """, (station,))

        row_last = cur.fetchone()
        if not row_last:
            return {"error": "Data kosong"}

        last = round(float(row_last[0]), 2)

        # ======================
        # PREDIKSI MULTI-STEP (v2 model + WRF)
        # ======================
        try:
            series = predict_series(station)
            prediction = series[0]["water_level"] if series else None
        except Exception as e:
            print("PREDICTION ERROR:", e)
            prediction = None
            series = []

        # ======================
        # RULES (STATUS) — dari API BBWS eksternal
        # ======================
        rules = get_external_thresholds(station) or []

        status = "Aman"
        percent = 0

        if rules:
            for rule in rules:
                if last >= rule["threshold"]:
                    status = rule["label"]

            max_threshold = rules[-1]["threshold"]

            if max_threshold > 0:
                percent = min(
                    int((last / max_threshold) * 100),
                    100
                )

        # ======================
        # CHART 24 JAM
        # ======================
        cur.execute("""
            SELECT
                to_char(datetime, 'DD Mon HH24:MI') AS time,
                water_level
            FROM tma
            WHERE station = %s
              AND datetime >= %s - INTERVAL '24 hours'
              AND datetime <= %s
            ORDER BY datetime
        """, (station, last_time, last_time))

        chart = [
            {
                "time": r[0],
                "water_level": round(float(r[1]), 2)
            }
            for r in cur.fetchall()
        ]

        # ======================
        # RESPONSE FINAL
        # ======================
        return {
            "last": last,
            "avg": avg,
            "max": round(float(max_), 2),
            "min": round(float(min_), 2),
            "percent": percent,
            "status": status,
            "last_time": last_time.strftime("%Y-%m-%d %H:%M"),
            "chart": chart,
            "rules": rules,

            # 🔥 SAFE OUTPUT
            "prediction": prediction,
            "prediction_series": series
        }

    except Exception as e:
        conn.rollback()
        print("TMA ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()