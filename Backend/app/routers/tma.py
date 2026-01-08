from fastapi import APIRouter
from app.db import conn

router = APIRouter(prefix="/tma", tags=["TMA"])

@router.get("/dashboard")
def get_tma_dashboard(station: str):
    cur = conn.cursor()

    cur.execute("""
        SELECT
            AVG(water_level),
            MAX(water_level),
            MIN(water_level),
            MAX(date + time)
        FROM tma
        WHERE station = %s
    """, (station,))
    row = cur.fetchone()

    if not row or row[0] is None:
        return {"error": "Data kosong"}

    avg, max_, min_, last_time = row
    avg = round(avg, 2)

    cur.execute("""
        SELECT water_level
        FROM tma
        WHERE station = %s
        ORDER BY (date + time) DESC
        LIMIT 1
    """, (station,))
    last = round(cur.fetchone()[0], 2)

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
    for rule in rules:
        if last >= rule["threshold"]:
            status = rule["label"]

    percent = min(
        int((last / rules[-1]["threshold"]) * 100),
        100
    )

    cur.execute("""
        SELECT
            to_char(date + time, 'DD Mon HH24:MI') AS time,
            water_level
        FROM tma
        WHERE station = %s
        AND (date + time) >= %s - INTERVAL '24 hours'
        AND (date + time) <= %s
        ORDER BY (date + time)
    """, (station, last_time, last_time))

    chart = [
        {
            "time": r[0],
            "water_level": round(r[1], 2)
        }
        for r in cur.fetchall()
    ]

    return {
        "last": last,
        "avg": avg,
        "percent": percent,
        "status": status,
        "last_time": last_time.strftime("%Y-%m-%d %H:%M"),
        "chart": chart,
        "rules": rules
    }
