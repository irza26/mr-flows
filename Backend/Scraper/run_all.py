import subprocess
import sys

scripts = [
    "Scraper/scrap_tma.py",
    "Scraper/scrap_web.py",
]

for s in scripts:
    result = subprocess.run([sys.executable, s])
