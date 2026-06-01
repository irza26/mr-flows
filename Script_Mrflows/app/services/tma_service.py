import joblib
import itertools
import time as _time
import numpy as np
import pandas as pd
from app.db import conn
from Scraper.wrf_rain import get_wrf_timeseries

model = joblib.load("model/model_tma_v3.pkl")
meta  = joblib.load("model/model_tma_v3_meta.pkl")

_WRF_CACHE = {"data": None, "ts": 0}
_WRF_TTL   = 300


def _get_wrf_cached():
    now = _time.time()
    if _WRF_CACHE["data"] and (now - _WRF_CACHE["ts"]) < _WRF_TTL:
        return _WRF_CACHE["data"]
    try:
        data = get_wrf_timeseries()
        _WRF_CACHE["data"] = data
        _WRF_CACHE["ts"] = now
        return data
    except Exception as e:
        print(f"WRF FETCH ERROR: {e}")
        return {}


# ===== DB FETCH =====

def _get_db_recent(station, hours=72):
    """Return wide DataFrame: datetime, water_level, rainfall_<st>..."""
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
        df["datetime"]    = pd.to_datetime(df["datetime"])
        df["water_level"] = pd.to_numeric(df["water_level"], errors="coerce")

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


# ===== BUILD UNIFIED TIMELINE =====

def _build_unified_timeline(df_obs, wrf_raw):
    """
    QC + resample observed data to model freq, then append WRF-disaggregated
    rainfall rows for t > t0 (water_level=NaN, to be filled by recursive forecast).
    Returns (df_full [DatetimeIndex], t0_idx).
    """
    freq      = meta["freq"]
    freq_td   = pd.Timedelta(freq)
    rain_cols = meta["rain_cols"]
    ch_max    = meta["ch_max_interp"]

    df = df_obs.copy()
    df["datetime"] = pd.to_datetime(df["datetime"])
    for c in rain_cols:
        if c in df.columns:
            df.loc[df[c] < 0, c] = np.nan
    df.loc[df["water_level"] <= 0, "water_level"] = np.nan
    df.loc[df["water_level"] > 5,  "water_level"] = np.nan

    df = df.set_index("datetime").sort_index()
    df["water_level"] = df["water_level"].interpolate(method="time")
    for c in rain_cols:
        if c in df.columns:
            df[c] = df[c].interpolate(method="linear", limit=ch_max, limit_direction="forward")

    df_hist = df[rain_cols].resample(freq).sum().join(df[["water_level"]].resample(freq).last())
    t0_ts   = df_hist.index[-1]

    # Detect WRF interval from data
    sample = next((v for v in wrf_raw.values() if len(v) > 1), None)
    wrf_interval = (pd.Timestamp(sample[1]["time"]) - pd.Timestamp(sample[0]["time"])
                    if sample else pd.Timedelta("3h"))
    steps_per = max(1, int(wrf_interval.total_seconds() / freq_td.total_seconds()))

    # Collect WRF timestamps strictly after t0
    future_wts = sorted({
        pd.Timestamp(s["time"])
        for sv in wrf_raw.values() for s in sv
        if pd.Timestamp(s["time"]) > t0_ts
    })

    if future_wts:
        wrf_end    = future_wts[-1] + wrf_interval - freq_td
        future_idx = pd.date_range(start=t0_ts + freq_td, end=wrf_end, freq=freq)
        future_df  = pd.DataFrame({"water_level": np.nan}, index=future_idx)

        for rc in rain_cols:
            stn     = rc.replace("rainfall_", "")
            wrf_map = {pd.Timestamp(s["time"]): float(s.get("rain_mm") or 0)
                       for s in wrf_raw.get(stn, [])}
            future_df[rc] = [
                next((wv / steps_per for wt, wv in wrf_map.items()
                      if wt <= dt < wt + wrf_interval), 0.0)
                for dt in future_idx
            ]

        df_full = pd.concat([df_hist, future_df])
    else:
        df_full = df_hist.copy()

    df_full = df_full[~df_full.index.duplicated(keep="last")].sort_index()
    df_full.index.name = "datetime"

    t0_idx = int(df_full.index.get_loc(t0_ts)) if t0_ts in df_full.index else len(df_hist) - 1
    return df_full, t0_idx


# ===== FEATURE ENGINEERING =====

def _build_features(df_in):
    """
    Replicate training feature engineering exactly.
    Accepts DatetimeIndex df; returns df with 'datetime' column and all feature cols.
    lag_dict values are dicts {"lag": int, ...} so we extract ["lag"] explicitly.
    """
    strategy     = meta["best_strategy"]
    rain_cols    = meta["rain_cols"]
    roll_windows = meta["roll_windows"]
    menit_pp     = meta["menit_per_periode"]
    aktif_thr    = meta["aktif_thr"]
    feat_info    = meta["feature_info"]

    df = df_in.copy()
    if isinstance(df.index, pd.DatetimeIndex):
        df = df.reset_index()  # 'datetime' becomes a regular column

    df["tma_lag1"] = df["water_level"].shift(1)

    roll_dict = {}

    if strategy == "lag_then_roll":
        lag_dict = feat_info["lag_dict"]
        for col, val in lag_dict.items():
            lag = val["lag"] if isinstance(val, dict) else int(val)
            if col in df.columns:
                df[col] = df[col].shift(lag)
        # Rolling on already-lagged col with extra shift(1) — matches training
        for col in rain_cols:
            st      = col.replace("rainfall_", "").replace(" ", "")
            shifted = df[col].shift(1)
            for w in roll_windows:
                roll_dict[f"roll{w * menit_pp}m_{st}"] = shifted.rolling(w, min_periods=1).sum()

    else:  # roll_then_lag
        combo_dict = feat_info["combo_dict"]
        for col in rain_cols:
            stn = col.replace("rainfall_", "").replace(" ", "")
            cfg = combo_dict.get(col, combo_dict.get(stn, {}))
            lag = cfg.get("lag", 1) if isinstance(cfg, dict) else int(cfg or 1)
            w_c = cfg.get("window") if isinstance(cfg, dict) else None
            for w in (set(roll_windows) | ({w_c} if w_c else set())):
                roll_dict[f"roll{w * menit_pp}m_{stn}"] = df[col].rolling(w, min_periods=1).sum().shift(lag)
            df[col] = df[col].shift(lag)

    if roll_dict:
        df = pd.concat([df, pd.DataFrame(roll_dict, index=df.index)], axis=1)

    # n_stasiun_aktif and interactions use the already-shifted rain_cols
    df["n_stasiun_aktif"] = (df[rain_cols] > aktif_thr).sum(axis=1)

    ia_dict = {}
    for order in range(2, min(5, len(rain_cols)) + 1):
        for combo in itertools.combinations(rain_cols, order):
            short = [c.replace("rainfall_", "").replace(" ", "") for c in combo]
            ia_dict["IA_" + "_x_".join(short)] = df[list(combo)].prod(axis=1)
    if ia_dict:
        df = pd.concat([df, pd.DataFrame(ia_dict, index=df.index)], axis=1)

    return df


# ===== NOWCAST HORIZON =====

def _nowcast_menit():
    """Max lag in periods × minutes/period = how far ahead observational data still drives features."""
    menit_pp  = meta["menit_per_periode"]
    feat_info = meta["feature_info"]
    if meta["best_strategy"] == "lag_then_roll":
        vals = feat_info["lag_dict"].values()
        lags = [v["lag"] if isinstance(v, dict) else int(v) for v in vals]
    else:
        vals = feat_info["combo_dict"].values()
        lags = [v.get("lag", 0) if isinstance(v, dict) else int(v or 0) for v in vals]
    return max(lags, default=0) * menit_pp


# ===== RECURSIVE MULTI-STEP =====

def _run_recursive(df_full, t0_idx, nc_menit):
    """
    For each future step i > t0_idx: build features from df_full[:i+1],
    predict, write predicted TMA back into df_full[i] so the next step's
    tma_lag1 is correct. Returns list of {datetime, water_level_pred, is_nowcast}.
    """
    t0_ts = df_full.index[t0_idx]
    preds = []

    for i in range(t0_idx + 1, len(df_full)):
        df_feat = _build_features(df_full.iloc[:i + 1])
        X       = pd.DataFrame([df_feat.iloc[-1][meta["feature_cols"]]])

        if X.isnull().values.any():
            print(f"PREDICT step {i}: NaN in features, stopping.")
            break

        y_hat  = float(model.predict(X)[0])
        t_pred = df_full.index[i]

        df_full.at[t_pred, "water_level"] = y_hat

        minutes_ahead = (t_pred - t0_ts).total_seconds() / 60
        preds.append({
            "datetime":         t_pred,
            "water_level_pred": y_hat,
            "is_nowcast":       minutes_ahead <= nc_menit,
        })

    return preds


# ===== PUBLIC API =====

def _horizon_steps():
    return max(1, int(12 * 60 / meta.get("menit_per_periode", 60)))


def predict_single(station):
    """1-step-ahead prediction for the stat card."""
    df_obs = _get_db_recent(station)
    if df_obs is None or df_obs.empty:
        return None

    df_full, _ = _build_unified_timeline(df_obs, {})
    df_feat    = _build_features(df_full)
    X          = pd.DataFrame([df_feat.iloc[-1][meta["feature_cols"]]])

    if X.isnull().values.any():
        return None

    return round(float(model.predict(X)[0]), 2)


def predict_series(station, horizon_steps=None):
    """
    Multi-step recursive forecast using unified observed+WRF timeline.
    Returns list of {time, water_level, is_nowcast, source} — same shape as v2.
    """
    if horizon_steps is None:
        horizon_steps = _horizon_steps()

    df_obs = _get_db_recent(station)
    if df_obs is None or df_obs.empty:
        return []

    wrf_raw = _get_wrf_cached()
    df_full, t0_idx = _build_unified_timeline(df_obs, wrf_raw)
    nc_menit        = _nowcast_menit()

    end_idx = min(len(df_full), t0_idx + 1 + horizon_steps)
    df_full = df_full.iloc[:end_idx].copy()

    preds = _run_recursive(df_full, t0_idx, nc_menit)

    return [
        {
            "time":        p["datetime"].strftime("%d %b %H:%M"),
            "water_level": round(p["water_level_pred"], 2),
            "is_nowcast":  p["is_nowcast"],
            "source":      "nowcast" if p["is_nowcast"] else "wrf",
        }
        for p in preds
    ]
