from fastapi import APIRouter, HTTPException
from app.db import get_db

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/")
def get_alerts():
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute("SELECT * FROM alert_rules ORDER BY id")
            return cur.fetchall()
        finally:
            cur.close()


@router.post("/")
def create_alert(rule: dict):
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute("""
                INSERT INTO alert_rules (rule_name, module, parameter, operator, threshold)
                VALUES (%s, %s, %s, %s, %s)
            """, (rule["rule_name"], rule["module"], rule["parameter"], rule["operator"], rule["threshold"]))
            conn.commit()
            return {"message": "Rule berhasil ditambahkan"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            cur.close()


@router.put("/{rule_id}")
def update_alert(rule_id: int, rule: dict):
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute("""
                SELECT id, threshold FROM alert_rules
                WHERE module='tma' AND status='active' ORDER BY threshold
            """)
            rules = cur.fetchall()

            updated = []
            for r_id, threshold in rules:
                updated.append(float(rule["threshold"]) if r_id == rule_id else float(threshold))

            if updated != sorted(updated):
                raise HTTPException(
                    status_code=400,
                    detail="Urutan threshold tidak valid. Pastikan Aman < Waspada < Bahaya"
                )

            cur.execute(
                "UPDATE alert_rules SET threshold=%s WHERE id=%s",
                (rule["threshold"], rule_id)
            )
            conn.commit()
            return {"message": "Threshold berhasil diperbarui"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            cur.close()


@router.patch("/{rule_id}/disable")
def disable_alert(rule_id: int):
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute("UPDATE alert_rules SET status='inactive' WHERE id=%s", (rule_id,))
            conn.commit()
            return {"message": "Rule dinonaktifkan"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            cur.close()
