import subprocess
import sys

scripts = [
    "Backend/Scraper/scrap_tma.py",
    "Backend/Scraper/scrap_web.py",
]

for s in scripts:
    result = subprocess.run([sys.executable, s])
