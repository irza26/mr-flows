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


BASE_URL = "https://api.ffws-bbwscitarum.id/waterlevel/WlAndBwl"

STATIONS = [
    {"name": "Bendung_Wanir", "station_id": "206016005", "start_from": datetime(2017, 1, 1)}
]

def get_last_datetime(station, start_from):
    cur.execute("""
        SELECT MAX(datetime)
        FROM tma
        WHERE station = %s
    """, (station,))
    last = cur.fetchone()[0]

    if last:
        return last - timedelta(minutes=10)  # mundur dikit buat safety
    return start_from


def fetch_data(station_id, start_dt, end_dt):
    t1 = start_dt.strftime("%Y%m%d%H%M")
    t2 = end_dt.strftime("%Y%m%d%H%M")

    url = f"{BASE_URL}/{station_id}/{t1}/{t2}"

    r = requests.post(
        url,
        headers={"Origin": "https://ffws-bbwscitarum.id"},
        timeout=30
    )
    r.raise_for_status()

    return r.json().get("resultData", [])


def upsert_tma(station, dt, water_level):
    cur.execute("""
        INSERT INTO tma (station, datetime, water_level)
        VALUES (%s, %s, %s)
        ON CONFLICT (station, datetime)
        DO UPDATE SET water_level = EXCLUDED.water_level
    """, (station, dt, water_level))

def run():
    now = datetime.now()

    for st in STATIONS:
        print(f"\n▶ STASIUN TMA: {st['name']}")

        start_dt = get_last_datetime(st["name"], st["start_from"])
        print("   Resume dari:", start_dt)

        while start_dt < now:

            end_dt = min(start_dt + timedelta(days=10), now)
            print(f"   {start_dt} → {end_dt}")

            try:
                data = fetch_data(st["station_id"], start_dt, end_dt)

                if not data:
                    print("   kosong")
                else:
                    count_insert = 0

                    for item in data:
                        raw = str(item["ymdhm"])
                        dt_obj = datetime.strptime(raw, "%Y%m%d%H%M")

                        water_level = item.get("wl")
                        if water_level is None:
                            continue

                        if dt_obj > start_dt:
                            upsert_tma(st["name"], dt_obj, water_level)
                            count_insert += 1

                    conn.commit()
                    print(f"   ✓ masuk {count_insert} data")

            except Exception as e:
                conn.rollback()
                print("   ERROR:", e)

            start_dt = end_dt
            time.sleep(0.5)

    print("\n✔ SEMUA TMA SELESAI")

if __name__ == "__main__":
    run()