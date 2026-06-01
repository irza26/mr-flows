from fastapi import APIRouter, HTTPException
from app.db import get_db

router = APIRouter(prefix="/stations", tags=["Stations"])


@router.post("/sync")
def sync_stations():
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute("""
                INSERT INTO stations (station_name, source, last_update, status)
                SELECT station, 'ch', MAX(datetime), 'aktif' FROM rainfall GROUP BY station
                ON CONFLICT (station_name) DO UPDATE SET
                    last_update = EXCLUDED.last_update, status = 'aktif', updated_at = NOW()
            """)
            cur.execute("""
                INSERT INTO stations (station_name, source, last_update, status)
                SELECT station, 'tma', MAX(datetime), 'aktif' FROM tma GROUP BY station
                ON CONFLICT (station_name) DO UPDATE SET
                    last_update = EXCLUDED.last_update, status = 'aktif', updated_at = NOW()
            """)
            conn.commit()
            return {"message": "Station registry berhasil disinkronkan"}
        except Exception as e:
            print("SYNC ERROR:", e)
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            cur.close()


@router.put("/update-status")
def update_station_status():
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute("""
                UPDATE stations SET
                    status = CASE WHEN last_update >= NOW() - INTERVAL '24 hours' THEN 'aktif' ELSE 'off' END,
                    updated_at = NOW()
            """)
            conn.commit()
            return {"message": "Status stasiun berhasil diperbarui"}
        except Exception as e:
            print("STATUS ERROR:", e)
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            cur.close()


@router.get("/")
def get_stations():
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute("""
                SELECT station_name, source, status, last_update FROM stations ORDER BY station_name
            """)
            rows = cur.fetchall()
            return [
                {
                    "station_name": r[0],
                    "source": r[1],
                    "status": r[2],
                    "last_update": r[3].strftime("%Y-%m-%d %H:%M") if r[3] else None,
                }
                for r in rows
            ]
        except Exception as e:
            print("GET STATIONS ERROR:", e)
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            cur.close()


@router.delete("/cleanup/rainfall")
def cleanup_rainfall():
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute("DELETE FROM rainfall WHERE rainfall < 0")
            deleted = cur.rowcount
            conn.commit()
            return {"deleted_rows": deleted}
        except Exception as e:
            print("CLEANUP RAIN ERROR:", e)
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            cur.close()


@router.delete("/cleanup/tma-duplicate")
def cleanup_tma_duplicate():
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute("""
                DELETE FROM tma a USING tma b
                WHERE a.id > b.id AND a.station = b.station
                  AND a.datetime = b.datetime AND a.water_level = b.water_level
            """)
            deleted = cur.rowcount
            conn.commit()
            return {"deleted_rows": deleted}
        except Exception as e:
            print("CLEANUP TMA ERROR:", e)
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            cur.close()
