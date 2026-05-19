from fastapi import APIRouter
from app.db import conn
from fastapi import HTTPException

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("/")
def get_alerts():
    cur = conn.cursor()
    cur.execute("SELECT * FROM alert_rules ORDER BY id")
    return cur.fetchall()

@router.post("/")
def create_alert(rule: dict):
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO alert_rules (rule_name, module, parameter, operator, threshold)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        rule["rule_name"],
        rule["module"],
        rule["parameter"],
        rule["operator"],
        rule["threshold"]
    ))
    conn.commit()
    return {"message": "Rule berhasil ditambahkan"}

@router.put("/{rule_id}")
def update_alert(rule_id: int, rule: dict):
    cur = conn.cursor()

    cur.execute("""
        SELECT id, threshold
        FROM alert_rules
        WHERE module='tma' AND status='active'
        ORDER BY threshold
    """)
    rules = cur.fetchall()

    updated = []
    for r_id, threshold in rules:
        if r_id == rule_id:
            updated.append(float(rule["threshold"]))
        else:
            updated.append(float(threshold))

    if updated != sorted(updated):
        raise HTTPException(
            status_code=400,
            detail="Urutan threshold tidak valid. Pastikan Aman < Waspada < Bahaya"
        )

    cur.execute("""
        UPDATE alert_rules
        SET threshold=%s
        WHERE id=%s
    """, (rule["threshold"], rule_id))

    conn.commit()
    return {"message": "Threshold berhasil diperbarui"}


@router.patch("/{rule_id}/disable")
def disable_alert(rule_id: int):
    cur = conn.cursor()
    cur.execute("""
        UPDATE alert_rules
        SET status='inactive'
        WHERE id=%s
    """, (rule_id,))
    conn.commit()
    return {"message": "Rule dinonaktifkan"}
