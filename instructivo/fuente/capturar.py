"""Toma las capturas de los instructivos de Ratio Vitis con Chrome sin interfaz.
Requiere el servidor local de la app (python -m http.server 8776 --directory D:/CLAUDE/RatioVitis).
Uso:  python capturar.py              (todas, en español e inglés)
      python capturar.py inicio tablero   (solo esas)
Cada captura se guarda como PNG en ../img/png y luego convertir.ps1 la pasa a JPG (../img/<id>-<idioma>.jpg)."""
import os, subprocess, sys, time, urllib.parse

AQUI = os.path.dirname(os.path.abspath(__file__))
PNG = os.path.join(AQUI, '..', 'img', 'png'); os.makedirs(PNG, exist_ok=True)
EDGE = r'C:\Program Files\Google\Chrome\Application\chrome.exe'   # Chrome sin interfaz
PERFIL = os.path.join(os.environ.get('TEMP', AQUI), 'vitis_capturas_perfil')
BASE = 'http://localhost:8776/instructivo/fuente/captura.html?'

# id: parámetros de captura.html (b, v, h, sel, off, m, prep, js, q)
CAPTURAS = {}   # se llena desde capturas.py
from capturas import CAPTURAS

def url(cid, lang):
    p = {k: str(v) for k, v in CAPTURAS[cid].items()}
    p.setdefault('v', 'prod'); p['l'] = lang
    return BASE + urllib.parse.urlencode(p)

def tomar(cid, lang):
    p = CAPTURAS[cid]; w, h = p.get('w', 1280), p.get('h', 860)
    out = os.path.join(PNG, f'{cid}-{lang}.png')
    if os.path.exists(out): os.remove(out)
    subprocess.run([EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', f'--user-data-dir={PERFIL}',
                    f'--window-size={w},{h}', '--virtual-time-budget=9000', f'--screenshot={out}', url(cid, lang)],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
    for _ in range(80):
        if os.path.exists(out) and os.path.getsize(out) > 0: break
        time.sleep(0.25)
    return os.path.exists(out)

if __name__ == '__main__':
    ids = sys.argv[1:] or list(CAPTURAS)
    for cid in ids:
        for lang in ('es', 'en'):
            ok = tomar(cid, lang)
            if ok:
                from PIL import Image
                Image.open(os.path.join(PNG, f'{cid}-{lang}.png')).convert('RGB').save(os.path.join(AQUI, '..', 'img', f'{cid}-{lang}.jpg'), quality=84, optimize=True)
            print(cid, lang, 'ok' if ok else 'FALLA', flush=True)
