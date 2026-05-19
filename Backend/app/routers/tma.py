from fastapi import APIRouter, HTTPException
from app.db import conn
import joblib
from app.services.tma_service import predict_single, predict_series

router = APIRouter(prefix="/tma", tags=["TMA"])

# load model sekali (biar efisien)
model = joblib.load("model/model_tma.pkl")


def get_rainfall_lag1(cur, datetime_lag):
    cur.execute("""
        SELECT station, rainfall
        FROM rainfall
        WHERE datetime = %s
    """, (datetime_lag,))

    rain = {}
    for r in cur.fetchall():
        rain[f"rainfall_{r[0]}"] = float(r[1] or 0)

    return rain


def predict_tma(cur, station, last_time):
    cur.execute("""
        SELECT water_level
        FROM tma
        WHERE station = %s
        ORDER BY datetime DESC
        LIMIT 2
    """, (station,))

    rows = cur.fetchall()

    if len(rows) < 2:
        return None

    tma_lag1 = float(rows[1][0])

    cur.execute("""
        SELECT datetime
        FROM tma
        WHERE station = %s
        ORDER BY datetime DESC
        LIMIT 2
    """, (station,))

    time_rows = cur.fetchall()
    datetime_lag = time_rows[1][0]

    rainfall = get_rainfall_lag1(cur, datetime_lag)

    X = [[
        rainfall.get("rainfall_Cihawuk", 0),
        rainfall.get("rainfall_Cikitu", 0),
        rainfall.get("rainfall_Ibun", 0),
        rainfall.get("rainfall_Kertasari", 0),
        rainfall.get("rainfall_Paseh Cipaku", 0),
        tma_lag1
    ]]

    pred = model.predict(X)[0]
    return round(float(pred), 2)


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
        # 🔥 PREDIKSI (FIX DI SINI)
        # ======================
        try:
            prediction = predict_single(station)
            series = predict_series(station)
        except Exception as e:
            print("PREDICTION ERROR:", e)
            prediction = None
            series = []

        # ======================
        # RULES (STATUS)
        # ======================
        cur.execute("""
            SELECT rule_name, threshold
            FROM alert_rules
            WHERE module = 'tma' AND status = 'active'
            ORDER BY threshold ASC
        """)

        rules = [
            {"label": r[0], "threshold": float(r[1])}
            for r in cur.fetchall()
        ]

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