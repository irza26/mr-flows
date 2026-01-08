from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import threading

from app.routers import ch, tma, dashboard, auth
from app.scraper_runner import run_scrapall
from app.routers import alert
from app.routers import stations

app = FastAPI(
    title="MR-FLOWS API",
    description="Monitoring Curah Hujan & Tinggi Muka Air",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    threading.Thread(
        target=run_scrapall,
        daemon=True
    ).start()

@app.get("/")
def root():
    return {
        "message": "MR-FLOWS API aktif",
        "dashboard": "/dashboard"
    }

app.include_router(dashboard.router)
app.include_router(ch.router)
app.include_router(tma.router)
app.include_router(auth.router)
app.include_router(alert.router)
app.include_router(stations.router)
