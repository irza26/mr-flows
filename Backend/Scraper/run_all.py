import subprocess
import sys

scripts = [
    "Scraper/scrap_web.py",
    "Scraper/scrap_tma.py",
]

for s in scripts:
    result = subprocess.run([sys.executable, s])
