"""Verificación independiente del motor FAO-56 de Ratio Vitis.
1) Reproduce los ejemplos resueltos de Allen et al. (2006), FAO Riego y Drenaje 56:
   Ej. 2 (P y γ a 1800 m), Ej. 8 (Ra, 3 de septiembre, 20° S), Ej. 14 (u2 desde 10 m),
   Ej. 15 (Rs de Hargreaves, Lyon), Ej. 18 (ET0 diaria, Uccle, 6 de julio) y Ej. 20 (Hargreaves, Lyon).
2) Escribe casos_fao56.json con 300 días aleatorios y su ET0 calculada aquí, para compararla
   con la de la app (pruebas/comparar_app.py la ejecuta en Chrome sin interfaz).
Escrita de nuevo a partir de las ecuaciones del manual, sin copiar el código de la app."""
import json, math, os, random

def presion(z): return 101.3 * ((293.0 - 0.0065 * z) / 293.0) ** 5.26
def e_sat(t): return 0.6108 * math.exp(17.27 * t / (t + 237.3))
def pendiente(t): return 4098.0 * e_sat(t) / (t + 237.3) ** 2
def radiacion_extra(lat_grados, dia):
    phi = math.radians(lat_grados)
    d_r = 1 + 0.033 * math.cos(2 * math.pi * dia / 365)
    dec = 0.409 * math.sin(2 * math.pi * dia / 365 - 1.39)
    w_s = math.acos(max(-1.0, min(1.0, -math.tan(phi) * math.tan(dec))))
    ra = 24 * 60 / math.pi * 0.0820 * d_r * (w_s * math.sin(phi) * math.sin(dec) + math.cos(phi) * math.cos(dec) * math.sin(w_s))
    return ra, 24 / math.pi * w_s

def eto_pm(tmax, tmin, hrmax, hrmin, u2, lat, z, dia, rs=None, n=None):
    tmed = (tmax + tmin) / 2
    gam = 0.665e-3 * presion(z)
    dl = pendiente(tmed)
    es = (e_sat(tmax) + e_sat(tmin)) / 2
    ea = (e_sat(tmin) * hrmax / 100 + e_sat(tmax) * hrmin / 100) / 2
    ra, nmax = radiacion_extra(lat, dia)
    if rs is None:
        rs = (0.25 + 0.50 * n / nmax) * ra if n is not None else 0.16 * math.sqrt(tmax - tmin) * ra
    rso = (0.75 + 2e-5 * z) * ra
    rnl = 4.903e-9 * ((tmax + 273.16) ** 4 + (tmin + 273.16) ** 4) / 2 * (0.34 - 0.14 * math.sqrt(ea)) * (1.35 * min(1.0, rs / rso) - 0.35)
    rn = 0.77 * rs - rnl
    return (0.408 * dl * rn + gam * 900 / (tmed + 273) * u2 * (es - ea)) / (dl + gam * (1 + 0.34 * u2)), dict(ra=ra, n=nmax, rs=rs, rso=rso, rnl=rnl, rn=rn, es=es, ea=ea, delta=dl, gamma=gam)

def comprobar(nombre, calc, publicado, tol):
    ok = abs(calc - publicado) <= tol
    print(f'{"OK " if ok else "FALLA"} {nombre}: calculado {calc:.4f} · FAO-56 {publicado} (tolerancia {tol})')
    return ok

if __name__ == '__main__':
    todo = []
    p = presion(1800); todo.append(comprobar('Ej. 2  P a 1800 m [kPa]', p, 81.8, 0.05))
    todo.append(comprobar('Ej. 2  γ [kPa/°C]', 0.665e-3 * p, 0.054, 0.0005))
    ra, _ = radiacion_extra(-20, 246); todo.append(comprobar('Ej. 8  Ra 3 sep, 20° S [MJ/m²/d]', ra, 32.2, 0.05))
    todo.append(comprobar('Ej. 14 u2 desde 3.2 m/s a 10 m', 3.2 * 4.87 / math.log(67.8 * 10 - 5.42), 2.4, 0.01))
    ra_l, _ = radiacion_extra(45.72, 196)
    todo.append(comprobar('Ej. 15 Ra Lyon, J=196', ra_l, 40.6, 0.06))
    todo.append(comprobar('Ej. 15 Rs Hargreaves Lyon', 0.16 * math.sqrt(26.6 - 14.8) * 40.6, 22.3, 0.05))
    u2 = 2.78 * 4.87 / math.log(67.8 * 10 - 5.42)
    e18, x = eto_pm(21.5, 12.3, 84, 63, u2, 50.80, 100, 187, n=9.25)
    todo.append(comprobar('Ej. 18 Ra Uccle', x['ra'], 41.09, 0.02))
    todo.append(comprobar('Ej. 18 Rn', x['rn'], 13.28, 0.08))
    todo.append(comprobar('Ej. 18 ET0 [mm/d]', e18, 3.88, 0.03))
    todo.append(comprobar('Ej. 20 ET0 Hargreaves Lyon [mm/d]', 0.0023 * (20.7 + 17.8) * math.sqrt(26.6 - 14.8) * 0.408 * 40.55, 5.0, 0.05))
    print('Ejemplos de FAO-56:', 'TODOS CORRECTOS' if all(todo) else 'HAY FALLAS')
    random.seed(56)
    casos = []
    for _ in range(300):
        lat = round(random.uniform(14, 33), 3); z = random.randint(0, 2600); dia = random.randint(1, 365)
        tmin = round(random.uniform(-2, 24), 1); tmax = round(tmin + random.uniform(4, 22), 1)
        hrmin = random.randint(8, 70); hrmax = random.randint(hrmin + 5, 100); u2v = round(random.uniform(0.3, 6), 2)
        modo = random.choice(['rs', 'n', 'harg'])
        ra, nmax = radiacion_extra(lat, dia)
        rs = round(random.uniform(0.25, 0.75) * ra, 2) if modo == 'rs' else None
        n = round(random.uniform(0, nmax), 2) if modo == 'n' else None
        v, _ = eto_pm(tmax, tmin, hrmax, hrmin, u2v, lat, z, dia, rs=rs, n=n)
        casos.append(dict(J=dia, lat=lat, z=z, tmax=tmax, tmin=tmin, hrmax=hrmax, hrmin=hrmin, u2=u2v, rs=rs, n=n, et0=v))
    json.dump(casos, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'casos_fao56.json'), 'w'), indent=0)
    print('casos_fao56.json:', len(casos), 'días aleatorios')
