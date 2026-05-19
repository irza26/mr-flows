import joblib
from datetime import timedelta
from app.db import execute_query
import pandas as pd

model = joblib.load("model/model_tma.pkl")

RAIN_STATIONS = [
    "Cihawuk",
    "Cikitu",
    "Ibun",
    "Kertasari",
    "Paseh Cipaku"
]


def get_latest_tma(station):
    query = """
        SELECT datetime, water_level
        FROM tma
        WHERE station = %s
        ORDER BY datetime DESC
        LIMIT 1
    """
    row = execute_query(query, (station,))[0]

    return {
        "time": row[0],
        "value": float(row[1])
    }


def get_rainfall_sum(station_name, start_time, end_time):
    query = """
        SELECT SUM(rainfall)
        FROM rainfall
        WHERE station = %s
          AND datetime >= %s
          AND datetime <= %s
    """
    row = execute_query(query, (station_name, start_time, end_time))
    return float(row[0][0] or 0)


def build_features(time_point, tma_lag1):
    start_time = time_point - timedelta(hours=2)

    feature_dict = {}

    for st in RAIN_STATIONS:
        val = get_rainfall_sum(st, start_time, time_point)
        feature_dict[f"rainfall_{st}"] = val  # 🔥 kasih nama fitur

    feature_dict["tma_lag1"] = tma_lag1

    return pd.DataFrame([feature_dict])


def predict_single(station):
    latest = get_latest_tma(station)

    X = build_features(latest["time"], latest["value"])

    pred = model.predict(X)[0]

    return round(float(pred), 2)


def predict_series(station, steps=6):
    latest = get_latest_tma(station)

    current_time = latest["time"]
    tma_prev = latest["value"]

    results = []

    for i in range(1, steps + 1):
        future_time = current_time + timedelta(minutes=10 * i)

        X = build_features(future_time, tma_prev)

        pred = float(model.predict(X)[0])

        results.append({
            "time": future_time.strftime("%H:%M"),
            "water_level": round(pred, 2)
        })

        tma_prev = pred  # 🔥 rolling

    return results