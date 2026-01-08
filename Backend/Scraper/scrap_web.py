import requests
import psycopg2
from datetime import datetime, timedelta
import time

conn = psycopg2.connect(
    dbname="curahHujan_db",
    user="postgres",
    password="postgres",
    host="localhost",
    port=5432
)

cur = conn.cursor()


SCRAP_FROM_IF_EMPTY = datetime(2017, 1, 1)
NORMALIZE_10_MIN = True

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

cur = conn.cursor()

def get_last_datetime(station, start_from):
    cur.execute("""
        SELECT MAX(date + time)
        FROM rainfall
        WHERE station = %s
    """, (station,))
    last = cur.fetchone()[0]
    return last if last else start_from

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


def run():
    now = datetime.now()

    for st in STATIONS:
        print(f"\n▶ STASIUN: {st['name']} ({st['source']})")

        last_dt = get_last_datetime(st["name"], st["start_from"])
        print("  Last DB:", last_dt)

        try:
            if st["source"] == "jagabalai":
                current = last_dt.date()

                while current <= now.date():
                    data = fetch_jagabalai(st, current)

                    for r in data:
                        if not r.get("readingAt"):
                            continue

                        dt = datetime.strptime(
                            r["readingAt"].replace("T", " ").replace("Z", ""),
                            "%Y-%m-%d %H:%M:%S"
                        )

                        if dt <= last_dt:
                            continue

                        if NORMALIZE_10_MIN:
                            dt = dt.replace(minute=(dt.minute // 10) * 10, second=0)

                        rainfall = r.get("rainfall") or 0

                        cur.execute("""
                            INSERT INTO rainfall (station, date, time, rainfall)
                            VALUES (%s, %s, %s, %s)
                            ON CONFLICT (station, date, time)
                            DO UPDATE SET rainfall = rainfall.rainfall + EXCLUDED.rainfall
                        """, (st["name"], dt.date(), dt.time(), rainfall))

                    conn.commit()
                    print(f"  ✓ {current}")
                    current += timedelta(days=1)
                    time.sleep(1)
            else:
                start_dt = last_dt + timedelta(minutes=1)

                while start_dt < now:
                    end_dt = min(start_dt + timedelta(days=10), now)
                    data = fetch_bbws(st["station_id"], start_dt, end_dt)

                    for item in data:
                        raw = str(item["ymdhm"])
                        date_val = f"{raw[:4]}-{raw[4:6]}-{raw[6:8]}"
                        time_val = f"{raw[8:10]}:{raw[10:12]}"
                        rainfall = item["rf"] or 0

                        cur.execute("""
                            INSERT INTO rainfall (station, date, time, rainfall)
                            VALUES (%s, %s, %s, %s)
                            ON CONFLICT DO NOTHING
                        """, (st["name"], date_val, time_val, rainfall))

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