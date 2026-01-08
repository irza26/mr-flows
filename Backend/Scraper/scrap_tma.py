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

BASE_URL = "https://api.ffws-bbwscitarum.id/waterlevel/WlAndBwl"

STATIONS = [
    {"name": "Bendung_Wanir", "station_id": "206016005"},
]

cur = conn.cursor()

def get_last_datetime(station):
    cur.execute("""
        SELECT MAX(date + time)
        FROM tma
        WHERE station = %s
    """, (station,))
    last = cur.fetchone()[0]
    return last if last else datetime(2017, 1, 1, 0, 0)


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


def run():
    now = datetime.now()

    for st in STATIONS:
        print(f"\n Mulai TMA station: {st['name']}")

        start_dt = get_last_datetime(st["name"]) + timedelta(minutes=1)
        print("   Lanjut dari:", start_dt)

        while start_dt < now:
            end_dt = start_dt + timedelta(days=10)
            if end_dt > now:
                end_dt = now

            print(f" {start_dt} → {end_dt}")

            try:
                data = fetch_data(st["station_id"], start_dt, end_dt)

                if not data:
                    print(" kosong")
                else:
                    for item in data:
                        raw = str(item["ymdhm"])
                        date_val = f"{raw[:4]}-{raw[4:6]}-{raw[6:8]}"
                        time_val = f"{raw[8:10]}:{raw[10:12]}"

                        water_level = item.get("wl")
                        if water_level is None:
                            continue

                        cur.execute("""
                            INSERT INTO tma (station, date, time, water_level)
                            VALUES (%s, %s, %s, %s)
                            ON CONFLICT DO NOTHING
                        """, (st["name"], date_val, time_val, water_level))

                    conn.commit()
                    print(f" masuk {len(data)} baris")

            except Exception as e:
                conn.rollback()
                print(" error:", e)

            start_dt = end_dt
            time.sleep(0.4)

    print("\nSemua TMA selesai")


if __name__ == "__main__":
    run()
