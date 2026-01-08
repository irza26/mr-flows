import geopandas as gpd

gdb_path = r"C:\Users\Muammar Irza\Downloads\Bandung\KAB BANDUNG\RBI25K_KAB_BANDUNG_KUGI50_20221231.gdb"
das_path = r"C:\Impal-FIn\frontend\public\DAS\DAS.shp"

sungai = gpd.read_file(gdb_path, layer="SUNGAI_LN_25K")
kec = gpd.read_file(gdb_path, layer="ADMINISTRASI_AR_KECAMATAN")
das = gpd.read_file(das_path)
majalaya = kec[kec["NAMOBJ"].str.contains("Majalaya", case=False, na=False)]

sungai_mjl = gpd.clip(sungai, majalaya)
das = das.to_crs(sungai_mjl.crs)

sungai_dalam_das = gpd.clip(sungai_mjl, das)

sungai_dalam_das = sungai_dalam_das.to_crs(epsg=32748)
sungai_dalam_das["panjang_m"] = sungai_dalam_das.geometry.length

sungai_utama = sungai_dalam_das.sort_values(
    "panjang_m", ascending=False
).head(1)

sungai_utama.to_file(
    "sungai_utama_dalam_das.geojson",
    driver="GeoJSON"
)