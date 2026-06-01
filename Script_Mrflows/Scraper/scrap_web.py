import requests
import psycopg2
from datetime import datetime, timedelta
from collections import defaultdict
import time

conn = psycopg2.connect(
    dbname="curahHujan_db",
    user="postgres",
    password="postgres",
    host="localhost",
    port=5432
)

cur = conn.cursor()

STATIONS = [
    {
        "name": "Cihawuk",
        "source": "jagabalai",
        "stationId": "60811ae4-024d-40a4-aae8-7bb9d60f3236",
        "deviceId": "HGT213",
        "start_from": datetime(2023, 1, 1)
    },
    {
        "name": "Nagrak",
        "source": "jagabalai",
        "stationId": "44279621-72c8-4f0a-a6e9-a88f2d8276e5",
        "deviceId": "HGT656",
        "start_from": datetime(2024, 1, 1)
    },
    {
        "name": "Ibun",
        "source": "jagabalai",
        "stationId": "5f0b964d-86f4-46c0-ba59-bed37543597d",
        "deviceId": "HGT167",
        "start_from": datetime(2023, 1, 1)
    },
    {
        "name": "Cikitu",
        "source": "jagabalai",
        "stationId": "cc6eb3b7-5707-41c2-aafd-72c63cf6d7d3",
        "deviceId": "HGT214",
        "start_from": datetime(2023, 1, 1)
    },
    {
        "name": "Paseh Cipaku",
        "source": "bbwscitarum",
        "station_id": "206014004",
        "start_from": datetime(2017, 1, 1)
    },
    {
        "name": "Kertasari",
        "source": "bbwscitarum",
        "station_id": "206014019",
        "start_from": datetime(2017, 1, 1)
    }
]

JAGABALAI_URL = "https://jagabalai.higertech.com/Station/DataTableDetailStation"
BBWS_URL = "https://api.ffws-bbwscitarum.id/rainfall/Mst"

def get_last_datetime(station, start_from):
    cur.execute("""
        SELECT MAX(datetime)
        FROM rainfall
        WHERE station = %s
    """, (station,))
    last = cur.fetchone()[0]

    if last:
        return last - timedelta(minutes=10)
    return start_from


def fetch_jagabalai(st, day):
    payload = {
        "draw": 1,
        "start": 0,
        "length": -1,
        "stationId": st["stationId"],
        "deviceId": st["deviceId"],
        "filterDate": day.strftime("%Y-%m-%d"),
        "selectedTime": "minute",
        "stationType": "ARR"
    }

    r = requests.post(JAGABALAI_URL, data=payload, timeout=30)
    r.raise_for_status()
    return r.json().get("data", [])


def fetch_bbws(station_id, start_dt, end_dt):
    t1 = start_dt.strftime("%Y%m%d%H%M")
    t2 = end_dt.strftime("%Y%m%d%H%M")
    url = f"{BBWS_URL}/{station_id}/{t1}/{t2}"

    r = requests.post(
        url,
        headers={"Origin": "https://ffws-bbwscitarum.id"},
        timeout=30
    )
    r.raise_for_status()

    data = r.json().get("resultData")
    return data if data else []


def process_jagabalai_data(data):
    bucket = defaultdict(float)

    for r in data:
        if not r.get("readingAt"):
            continue

        dt = datetime.strptime(
            r["readingAt"].replace("T", " ").replace("Z", ""),
            "%Y-%m-%d %H:%M:%S"
        )

        # floor ke 10 menit
        dt10 = dt.replace(minute=(dt.minute // 10) * 10, second=0)

        rainfall = r.get("rainfall") or 0
        bucket[dt10] += rainfall

    return bucket


def upsert_rainfall(station, dt, rainfall):
    cur.execute("""
        INSERT INTO rainfall (station, datetime, rainfall)
        VALUES (%s, %s, %s)
        ON CONFLICT (station, datetime)
        DO UPDATE SET rainfall = EXCLUDED.rainfall
    """, (station, dt, rainfall))

def run():
    now = datetime.now()

    for st in STATIONS:
        print(f"\n▶ STASIUN: {st['name']} ({st['source']})")

        last_dt = get_last_datetime(st["name"], st["start_from"])
        print("  Resume from:", last_dt)

        try:
            if st["source"] == "jagabalai":

                current = last_dt.date()

                while current <= now.date():

                    data = fetch_jagabalai(st, current)
                    bucket = process_jagabalai_data(data)

                    for dt10, rain_sum in bucket.items():

                        if dt10 > last_dt:
                            upsert_rainfall(st["name"], dt10, rain_sum)

                    conn.commit()
                    print(f"  ✓ {current}")
                    current += timedelta(days=1)
                    time.sleep(1)

            else:
                start_dt = last_dt

                while start_dt < now:
                    end_dt = min(start_dt + timedelta(days=10), now)
                    data = fetch_bbws(st["station_id"], start_dt, end_dt)

                    for item in data:
                        raw = str(item["ymdhm"])
                        dt_obj = datetime.strptime(raw, "%Y%m%d%H%M")
                        rainfall = item["rf"] or 0

                        if dt_obj > last_dt:
                            upsert_rainfall(st["name"], dt_obj, rainfall)

                    conn.commit()
                    print(f"  ✓ {start_dt} → {end_dt}")
                    start_dt = end_dt
                    time.sleep(0.5)

        except Exception as e:
            conn.rollback()
            print("  ERROR:", e)

    print("\n✔ SEMUA STASIUN SELESAI")

if __name__ == "__main__":
    run()