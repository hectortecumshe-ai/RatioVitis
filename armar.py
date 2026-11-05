"""Arma index.html de Ratio Vitis (un solo archivo autocontenido, sin recursos de terceros) a partir de src/.
Reutiliza de RatioBos (mismos autores) el estilo base, el mapa de México y algunas ilustraciones.
Uso:  python armar.py"""
import os, re, urllib.parse
R = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(R, 'src')
leer = lambda n: open(os.path.join(S, n), encoding='utf-8').read()
BOS = os.path.join(os.path.dirname(R), 'RatioBos', 'src')
def simbolos(ruta, ids):
    t = open(ruta, encoding='utf-8').read(); out = []
    for i in ids:
        m = re.search(r'(?s)<symbol id="' + i + r'".*?</symbol>', t)
        if not m: raise SystemExit('Falta ' + i)
        out.append(m.group(0).replace('font-family="Georgia,serif"', 'font-family="Palatino Linotype,Palatino,serif"'))
    return '\n'.join(out)
ajenos = simbolos(os.path.join(BOS, '03_sprite_bos.svg'), ['i-steer']) + '\n' + \
         simbolos(os.path.join(BOS, 'ref_sprite_avis.svg'), ['i-chicken', 'i-report', 'i-check', 'i-book', 'i-prod', 'i-cien'])
defs = ('<defs><linearGradient id="lg-logo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f6b5a"/><stop offset="1" stop-color="#173a31"/></linearGradient>'
        '<linearGradient id="lg-corn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f7d25c"/><stop offset="1" stop-color="#e9ad2f"/></linearGradient>'
        '<linearGradient id="lg-sack" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6c48c"/><stop offset="1" stop-color="#c99b5e"/></linearGradient></defs>')
sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">' + defs + '\n' + leer('04_sprite_telar.svg') + '\n' + ajenos + '\n</svg>'
logo = open(os.path.join(R, 'logo.svg'), encoding='utf-8').read().strip()
fav = 'data:image/svg+xml,' + urllib.parse.quote(logo)
modesw = open(os.path.join(os.path.join(R,'herramientas'), 'modesw.html'), encoding='utf-8').read().strip() if os.path.exists(os.path.join(os.path.join(R,'herramientas'), 'modesw.html')) else ''
css = leer('01_estilo_base.css') + '\n' + leer('02_estilo_bos.css') + '\n' + leer('03_estilo_telar.css') + '\n' + leer('05_vitis.css')
js = ['10_datos.js', '15_variables.js', '11_territorio.js', '12_mapa.js', '19_avance.js', '20_ayuda.js', '20_fao56.js', '21_suelo.js', '22_clima.js', '23_raspa.js', '24_campo.js', '25_estadistica.js', '30_experimento.js', '31_red.js',
      '45_graficos.js', '46_graficos2.js', '46_vitis3d.js', '40_bloques_a.js', '50_bloques_b.js', '51_fenologia.js', '52_bloques_c.js', '54_bloque_est.js', '56_bloque_sca.js', '57_regen_riesgo.js', '57s_sostenible.js', '57p_prospectiva.js', '58_tablero.js', '59_vistas.js', '60_final.js']
familia = leer('90_familia.html')  # enlaces a las demás apps de la familia Ratio
qr = open(os.path.join(R, 'herramientas', 'qr-app.svg'), encoding='utf-8').read().strip().replace('<svg ', '<svg role="img" aria-label="QR" ', 1)
casos = open(os.path.join(R, 'pruebas', 'casos_fao56.json'), encoding='utf-8').read()   # motor independiente (pruebas/verificar_fao56.py)
cuerpo = '\n'.join('<script>\n' + leer(n) + '\n</script>' for n in js).replace("'__QR__'", repr(qr)).replace('__CASOS__', casos).replace('__CASOS_RED__', open(os.path.join(R, 'pruebas', 'casos_red.json'), encoding='utf-8').read()).replace('__CASOS_EST__', open(os.path.join(R, 'pruebas', 'casos_estadistica.json'), encoding='utf-8').read())
html = f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ratio Vitis — El viñedo medido como sistema complejo adaptativo · The measured vineyard as a complex adaptive system</title>
<meta name="description" content="Ratio Vitis (Ratio Complexus): el viñedo medido como sistema complejo adaptativo — relación agua–suelo–planta–atmósfera con FAO-56 (ET0 de Penman–Monteith, coeficiente dual y balance hídrico), suelo, clima vitícola, potencial hídrico y diseño experimental en bloques al azar. ES/EN.">
<link rel="icon" href="{fav}">
<!--
  Ratio Vitis · Ratio Complexus («lo que está tejido junto») · versión 0.1
  Un solo archivo (HTML + CSS + JavaScript). Sin servidor, sin instalación, sin recursos de terceros.
  Autores: Héctor Tecumshé Mojica-Zárate · Jorge Hernández-González · Oscar Díaz-José · Adán Guillermo Ramírez-García · Licencia MIT
  Fuentes: Allen et al. (2006) FAO Riego y Drenaje 56; Tonietto y Carbonneau (2004); INEGI (2020); USDA-NRCS; UC ANR; IVES.
  Contornos del mapa: Natural Earth (dominio público).
-->
<style>
{css}
</style>
</head>
<body>
{sprite}
<header class="bar">
  <div class="bar-top">
    <button class="brand" data-ir="inicio" aria-label="Ratio Vitis">
      <span class="brand-ico"><svg viewBox="0 0 64 64"><use href="#i-logo"/></svg></span>
      <span><span class="brand-name">Ratio<i>Vitis</i></span> <span class="brand-sub" id="brandSub"></span></span>
    </button>
    <span class="sp"></span>
    <span class="ibtn no-print" id="pill"><span class="lbl" id="pillTxt"></span></span>
    <div class="langsw no-print" role="group" aria-label="Idioma / Language"><button data-lang="es">ES</button><button data-lang="en">EN</button></div>
    {modesw}
    <button class="ibtn round" id="btnTema" aria-label="Tema / Theme">☀</button>
    <button class="ibtn round" id="btnAyuda" aria-label="Ayuda / Help">?</button>
  </div>
  <nav class="steps-nav" id="nav"></nav>
  <div class="progress no-print"><span id="progTxt"></span><div class="track"><div class="fill" id="progFill"></div></div></div>
</header>
<main id="main"></main>
{familia}<footer class="pie" id="pie"></footer>
<div class="toast" id="toast"></div>
<dialog id="dlgAyuda"></dialog>
{cuerpo}
</body>
</html>
'''
open(os.path.join(R, 'index.html'), 'w', encoding='utf-8', newline='\n').write(html)
ext = sorted(set(e.split('/')[2] for e in re.findall(r'(?:src|href)="(https?://[^"]+)"', html)))
print('index.html', len(html.encode()) // 1024, 'KB · dominios en src/href:', ext)
