import subprocess
import sys
import os

BASE_DIR = os.path.dirname(__file__)
SCRAPER_DIR = os.path.join(BASE_DIR, "../Scraper")

def run_scrapall():
    subprocess.run([
        sys.executable,
        os.path.join(SCRAPER_DIR, "run_all.py")
    ])
