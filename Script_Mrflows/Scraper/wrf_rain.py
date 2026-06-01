import requests
from bs4 import BeautifulSoup
import numpy as np
from io import StringIO
from datetime import datetime, timedelta

BASE_URL = "https://weather.meteo.itb.ac.id/model/wrf_new/cy00/d02/rainuv10/asc/"

POINTS = [
    {"name": "Cihawuk", "lat": -7.185951, "lon": 107.699982},
    {"name": "Cikitu", "lat": -7.142651, "lon": 107.691972},
    {"name": "Nagrak", "lat": -7.127906, "lon": 107.724088},
    {"name": "Ibun", "lat": -7.099045, "lon": 107.763373},
    {"name": "Paseh Cipaku", "lat": -7.056617, "lon": 107.763847},
    {"name": "Kertasari", "lat": -7.1919, "lon": 107.676883}
]

# =========================
# RETRY REQUEST
# =========================
def fetch_with_retry(url, retries=3):
    for i in range(retries):
        try:
            r = requests.get(url, timeout=10)
            r.raise_for_status()
            return r
        except:
            if i == retries - 1:
                return None


# =========================
# SCRAPE FILE LIST
# =========================
def get_file_list():
    res = requests.get(BASE_URL, timeout=15)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")
    return [
        a.get("href")
        for a in soup.find_all("a")
        if a.get("href") and a.get("href").endswith(".asc")
    ]


# =========================
# PARSE ASC
# =========================
def parse_asc(text):
    lines = text.strip().split("\n")

    header = {}
    for i in range(6):
        k, v = lines[i].split()
        header[k] = float(v)

    data = np.loadtxt(StringIO("\n".join(lines[6:])))
    return header, data


# =========================
# GRID → VALUE
# =========================
def get_value(lat, lon, header, grid):
    xll = header["xllcorner"]
    yll = header["yllcorner"]
    cell = header["cellsize"]
    nrows = int(header["nrows"])
    ncols = int(header["ncols"])

    col = int((lon - xll) / cell)
    row = int((lat - yll) / cell)
    row = nrows - row - 1

    if row < 0 or col < 0 or row >= nrows or col >= ncols:
        return None

    val = grid[row, col]
    return None if val == -9999 else float(val)


# =========================
# EXTRACT TIME FROM FILE
# =========================
def extract_datetime_from_filename(f):
    # wrf-00-rainuv10-20260402_13.asc
    parts = f.replace(".asc", "").split("_")

    date_str = parts[-2].split("-")[-1]
    hour_str = parts[-1]

    base_time = datetime.strptime(date_str, "%Y%m%d")
    return base_time + timedelta(hours=int(hour_str))


# =========================
# MAIN FUNCTION
# =========================
def get_wrf_timeseries():
    try:
        files = get_file_list()
    except Exception as e:
        print(f"WRF get_file_list ERROR: {e}")
        return {p["name"]: [] for p in POINTS}

    files = sorted(files, key=lambda x: extract_datetime_from_filename(x))

    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    files = [f for f in files if extract_datetime_from_filename(f) >= today_start]

    results = {p["name"]: [] for p in POINTS}

    for f in files:
        url = BASE_URL + f

        r = fetch_with_retry(url)
        if not r:
            print("Skip:", f)
            continue

        try:
            header, grid = parse_asc(r.text)
            forecast_time = extract_datetime_from_filename(f)

            for p in POINTS:
                val = get_value(p["lat"], p["lon"], header, grid)

                results[p["name"]].append({
                    "time": forecast_time.strftime("%Y-%m-%d %H:%M"),
                    "rain_mm": val if val else 0
                })

        except Exception as e:
            print("Error parsing:", f, e)
            continue

    return results


# =========================
# TEST
# =========================
if __name__ == "__main__":
    import json
    data = get_wrf_timeseries()
    print(json.dumps(data, indent=2))