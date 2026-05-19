from fastapi import APIRouter

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("")
def dashboard_root():
    return {
        "system": "MR-FLOWS",
        "modules": {
            "curah_hujan": "/dashboard/ch",
            "tinggi_air": "/dashboard/tma"
        }
    }

@router.get("/ch")
def dashboard_ch():
    return {"redirect": "/ch/dashboard"}

@router.get("/tma")
def dashboard_tma():
    return {"redirect": "/tma/dashboard"}
