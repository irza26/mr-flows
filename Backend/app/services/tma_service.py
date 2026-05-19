import joblib
import itertools
import time as _time
import numpy as np
import pandas as pd
from app.db import conn
from Scraper.wrf_rain import get_wrf_timeseries

model = joblib.load("model/model_tma_v2.pkl")
meta  = joblib.load("model/model_tma_v2_meta.pkl")

# ===== WRF CACHE =====
_WRF_CACHE = {"data": None, "ts": 0}
_WRF_TTL   = 300  # 5 min


def _get_wrf_cached():
    now = _time.time()
    if _WRF_CACHE["data"] and (now - _WRF_CACHE["ts"]) < _WRF_TTL:
        return _WRF_CACHE["data"]
    try:
        data = get_wrf_timeseries(limit=24)
        _WRF_CACHE["data"] = data
        _WRF_CACHE["ts"] = now
        return data
    except Exception as e:
        print(f"WRF FETCH ERROR: {e}")
        return {}


# ===== FEATURE ENGINEERING =====

def build_features_inference(df_recent, meta):
    """Replika persis pipeline training — JANGAN ubah urutan."""
    freq         = meta["freq"]
    lag_dict     = meta["lag_dict"]
    rain_cols    = meta["rain_cols"]
    roll_windows = meta["roll_windows"]
    menit_pp     = meta["menit_per_periode"]
    aktif_thr    = meta["aktif_thr"]

    df = df_recent.copy()

    # QC
    for c in rain_cols:
        df.loc[df[c] < 0, c] = np.nan
    df.loc[df["water_level"] <= 0, "water_level"] = np.nan
    df.loc[df["water_level"] > 5,  "water_level"] = np.nan

    # Imputasi
    df = df.set_index("datetime").sort_index()
    df["water_level"] = df["water_level"].interpolate(method="time")
    for c in rain_cols:
        df[c] = df[c].interpolate(
            method="linear", limit=meta["ch_max_interp"], limit_direction="forward"
        )

    # Resample ke freq model
    rain_resampled = df[rain_cols].resample(freq).sum()
    tma_resampled  = df[["water_level"]].resample(freq).last()
    df = rain_resampled.join(tma_resampled).reset_index()
    df["tma_target"] = df["water_level"]

    # Lag tersimpan (dari meta — jangan cari ulang)
    for col, lag in lag_dict.items():
        df[col] = df[col].shift(lag)

    df["tma_lag1"] = df["tma_target"].shift(1)
    df["n_stasiun_aktif"] = (df[rain_cols] > aktif_thr).sum(axis=1)

    # Rolling features — build dict then concat once
    roll_dict = {}
    for col in rain_cols:
        st = col.replace("rainfall_", "").replace(" ", "")
        shifted = df[col].shift(1)
        for w in roll_windows:
            menit = w * menit_pp
            roll_dict[f"roll{menit}m_{st}"] = shifted.rolling(w, min_periods=1).sum()
    if roll_dict:
        df = pd.concat([df, pd.DataFrame(roll_dict, index=df.index)], axis=1)

    # Interaction features — build dict then concat once
    ia_dict = {}
    for order in range(2, min(5, len(rain_cols)) + 1):
        for combo in itertools.combinations(rain_cols, order):
            short = [c.replace("rainfall_", "").replace(" ", "") for c in combo]
            ia_dict["IA_" + "_x_".join(short)] = df[list(combo)].prod(axis=1)
    if ia_dict:
        df = pd.concat([df, pd.DataFrame(ia_dict, index=df.index)], axis=1)

    return df


# ===== DB FETCH =====

def _get_db_recent(station, hours=72):
    """Return wide DataFrame: datetime, water_level, rainfall_<stasiun>..."""
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT datetime, water_level FROM tma
            WHERE station = %s AND datetime >= NOW() - INTERVAL '%s hours'
            ORDER BY datetime
        """, (station, hours))
        rows = cur.fetchall()
        if not rows:
            return None

        df = pd.DataFrame(rows, columns=["datetime", "water_level"])
        df["datetime"]     = pd.to_datetime(df["datetime"])
        df["water_level"]  = pd.to_numeric(df["water_level"], errors="coerce")

        for rain_col in meta["rain_cols"]:
            stn = rain_col.replace("rainfall_", "")
            cur.execute("""
                SELECT datetime, rainfall FROM rainfall
                WHERE station = %s AND datetime >= NOW() - INTERVAL '%s hours'
                ORDER BY datetime
            """, (stn, hours))
            rrows = cur.fetchall()
            if rrows:
                rdf = pd.DataFrame(rrows, columns=["datetime", rain_col])
                rdf["datetime"] = pd.to_datetime(rdf["datetime"])
                rdf[rain_col]   = pd.to_numeric(rdf[rain_col], errors="coerce").fillna(0.0)
                df = df.merge(rdf, on="datetime", how="left")
            else:
                df[rain_col] = 0.0

        for c in meta["rain_cols"]:
            df[c] = df[c].fillna(0.0)

        return df
    finally:
        cur.close()


# ===== WRF ALIGNMENT =====

def _align_wrf(wrf_raw, prediction_datetimes):
    """
    Distribusi data WRF (1h atau 3h) ke setiap langkah prediksi model.
    Rainfall WRF per-interval dibagi proporsional sesuai freq model.
    Returns ({stn: [val_per_step]}, [source_per_step]).
    """
    rain_stations = [c.replace("rainfall_", "") for c in meta["rain_cols"]]
    freq_td = pd.Timedelta(meta["freq"])

    # Deteksi interval WRF dari data
    sample = next((v for v in wrf_raw.values() if len(v) > 1), None)
    if sample:
        wrf_interval = pd.Timestamp(sample[1]["time"]) - pd.Timestamp(sample[0]["time"])
    else:
        wrf_interval = pd.Timedelta("1h")

    ratio = freq_td.total_seconds() / wrf_interval.total_seconds()

    per_station: dict[str, list[float]] = {}
    for stn in rain_stations:
        series = wrf_raw.get(stn, [])
        if not series:
            per_station[stn] = [0.0] * len(prediction_datetimes)
            continue

        wrf_times = [pd.Timestamp(s["time"]) for s in series]
        wrf_vals  = [float(s.get("rain_mm") or 0) for s in series]

        vals = []
        for dt in prediction_datetimes:
            matched = 0.0
            for i, wt in enumerate(wrf_times):
                if wt <= dt < wt + wrf_interval:
                    matched = wrf_vals[i] * ratio
                    break
            vals.append(matched)
        per_station[stn] = vals

    # Source flag per langkah
    sources = []
    for dt in prediction_datetimes:
        covered = False
        for stn in rain_stations:
            for s in wrf_raw.get(stn, []):
                wt = pd.Timestamp(s["time"])
                if wt <= dt < wt + wrf_interval:
                    covered = True
                    break
            if covered:
                break
        sources.append("wrf" if covered else "nowcast")

    return per_station, sources


# ===== RECURSIVE MULTI-STEP =====

def _run_multi_step(df_initial, horizon_steps, rainfall_fc):
    """Recursive forecast: hasil prediksi jadi tma_lag1 langkah berikut."""
    predictions = []
    df_work = df_initial.copy()

    for h in range(horizon_steps):
        df_feat = build_features_inference(df_work, meta)
        X = df_feat[meta["feature_cols"]].iloc[[-1]]

        if X.isnull().values.any():
            print(f"PREDICT STEP {h}: NaN features, stop.")
            break

        y_hat   = float(model.predict(X)[0])
        next_dt = df_feat["datetime"].iloc[-1] + pd.Timedelta(meta["freq"])

        predictions.append({"datetime": next_dt, "water_level_pred": y_hat})

        # Append baris baru: predicted TMA + WRF/zero rainfall
        new_row = {"datetime": next_dt, "water_level": y_hat}
        for c in meta["rain_cols"]:
            stn = c.replace("rainfall_", "")
            fc_list = rainfall_fc.get(stn, []) if rainfall_fc else []
            new_row[c] = fc_list[h] if h < len(fc_list) else 0.0

        df_work = pd.concat([df_work, pd.DataFrame([new_row])], ignore_index=True)

    return predictions


# ===== PUBLIC API =====

def _horizon_steps():
    """12 jam dalam satuan periode model."""
    return max(1, int(12 * 60 / meta.get("menit_per_periode", 60)))


def predict_single(station):
    """Prediksi 1 langkah (1 periode model) — untuk stat card 1 jam."""
    df = _get_db_recent(station)
    if df is None or df.empty:
        return None

    df_feat = build_features_inference(df, meta)
    X = df_feat[meta["feature_cols"]].iloc[[-1]]
    if X.isnull().values.any():
        return None

    return round(float(model.predict(X)[0]), 2)


def predict_series(station, horizon_steps=None):
    """
    Multi-step forecast dengan WRF ITB (fallback: rainfall=0 / nowcast).
    Return: list of {time, water_level, source}
      source: "wrf" | "nowcast"
    """
    if horizon_steps is None:
        horizon_steps = _horizon_steps()

    df = _get_db_recent(station)
    if df is None or df.empty:
        return []

    # Tentukan datetime tiap langkah prediksi
    df_base  = build_features_inference(df.copy(), meta)
    last_dt  = df_base["datetime"].iloc[-1]
    freq_td  = pd.Timedelta(meta["freq"])
    pred_dts = [last_dt + freq_td * (i + 1) for i in range(horizon_steps)]

    # Sinkronisasi WRF
    try:
        wrf_raw = _get_wrf_cached()
        rainfall_fc, sources = _align_wrf(wrf_raw, pred_dts)
    except Exception as e:
        print(f"WRF ALIGN ERROR: {e}")
        rainfall_fc = None
        sources = ["nowcast"] * horizon_steps

    # Jalankan prediksi rekursif
    preds = _run_multi_step(df, horizon_steps, rainfall_fc)

    return [
        {
            "time":        p["datetime"].strftime("%d %b %H:%M"),
            "water_level": round(p["water_level_pred"], 2),
            "source":      sources[i] if i < len(sources) else "nowcast",
        }
        for i, p in enumerate(preds)
    ]
