"""Arma los instructivos de Ratio Vitis (productor y científico, español e inglés en un mismo HTML).
Uso:  python armar.py          → ../../instructivo-productor.html y ../../instructivo-cientifico.html
Las capturas se toman con capturar.py (Chrome sin interfaz, lista en capturas.py) y se guardan en ../img/<id>-<idioma>.jpg.
Los PDF se imprimen con pdf.py. El contenido está en productor.py y cientifico.py."""
import json, os, re, subprocess, sys
from enlaces_web import web   # enlaces públicos (no localhost) en el HTML y en los PDF
APP_WEB = 'https://hectortecumshe-ai.github.io/RatioVitis/'

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..'))
sys.path.insert(0, AQUI)
VERSION_APP = '0.1.0'
EDICION = ('1.ª edición', '1st edition')
FECHA = ('noviembre de 2026', 'November 2026')
DOI_APP = '10.5281/zenodo.24048724'                                   # ← DOI de la app cuando Zenodo lo asigne
DOI_GUIA = {'productor': '10.5281/zenodo.24048804', 'cientifico': '10.5281/zenodo.24048805'}  # ← DOI propio de cada instructivo
ISBN = {'productor': ('', ''), 'cientifico': ('', '')}
CITA_AUT = ('Mojica-Zárate, H. T., Hernández-González, J., Díaz-José, O., y Ramírez-García, A. G.', 'Mojica-Zárate, H. T., Hernández-González, J., Díaz-José, O., &amp; Ramírez-García, A. G.')
AUTORES = 'Héctor Tecumshé Mojica-Zárate · Jorge Hernández-González · Oscar Díaz-José · Adán Guillermo Ramírez-García'
APP = 'https://hectortecumshe-ai.github.io/RatioVitis/'
leer = lambda n: open(os.path.join(AQUI, n), encoding='utf-8').read()

# ---------------------------------------------------------------- bloques de la app (id, es, en, minutos, resumen es, resumen en, rápido es, rápido en)
BLOQUES = [
 ('b1', 'Viñedo y experimento', 'Vineyard and trial', '10 min', 'Sitio, marco y sorteo', 'Site, spacing and draw', 'Ubica el viñedo, escribe el marco y sortea los tratamientos.', 'Locate the vineyard, enter the spacing and draw the treatments.'),
 ('b2', 'Suelo', 'Soil', '10 min', 'El tanque de agua', 'The water tank', 'Prueba del frasco, densidad, profundidad de raíces, pH y sal.', 'Jar test, bulk density, rooting depth, pH and salt.'),
 ('b3', 'Clima', 'Climate', '5 min', 'Lo que pide la atmósfera', 'What the air demands', 'Importa el CSV diario y lee ET0, Winkler, Huglin y GST.', 'Import the daily CSV and read ET0, Winkler, Huglin and GST.'),
 ('b4', 'RASPA', 'SPAC', '10 min', 'Agua del suelo a la atmósfera', 'Water from soil to air', 'Etapas, brotación y riegos; lee el balance y el estrés.', 'Stages, budburst and irrigations; read the balance and stress.'),
 ('b5', 'Fertilidad', 'Fertility', '8 min', 'Hoja, suelo y abonos', 'Leaf, soil and manures', 'Análisis foliar, DOP y dosis igualada en nitrógeno.', 'Tissue analysis, DOP and nitrogen-matched dose.'),
 ('b6', 'Biomasa', 'Biomass', '8 min', 'Vigor, dosel y carbono', 'Vigour, canopy and carbon', 'Poda, área foliar, NDVI, sarmiento y materia seca.', 'Pruning, leaf area, NDVI, shoot and dry matter.'),
 ('b7', 'Productividad', 'Productivity', '6 min', 'Fruta, calidad y agua', 'Fruit, quality and water', 'Rendimiento, °Brix, Ravaz y pérdida por falta de agua.', 'Yield, °Brix, Ravaz and loss from water shortage.'),
 ('b8', 'Energía', 'Energy', '3 min', 'Cómo se reparte el sol', 'How sunlight is shared', 'Lee calor latente, calor sensible y Bowen.', 'Read latent heat, sensible heat and Bowen.'),
 ('b9', 'Estadística', 'Statistics', '10 min', '¿Diferencia real o azar?', 'Real difference or chance?', 'Importa la plantilla de campo y lee ANOVA y Tukey.', 'Import the field sheet and read ANOVA and Tukey.'),
 ('b10', 'Sistema complejo', 'Complex system', '5 min', 'La red del viñedo', 'The vineyard network', 'Recorre las escenas y los lazos de retroalimentación.', 'Walk through the scenes and feedback loops.'),
 ('b11', 'Tablero', 'Dashboard', '3 min', 'Todo en una página', 'All on one page', 'Empieza por el semáforo.', 'Start with the traffic light.'),
 ('b12', 'Regeneración', 'Regeneration', '6 min', 'Prácticas y resultados', 'Practices and outcomes', 'Califica las prácticas y guarda una línea base.', 'Score the practices and save a baseline.'),
 ('b13', 'Riesgos', 'Risks', '6 min', 'Probabilidad × impacto', 'Likelihood × impact', 'Califica cada riesgo; atiende lo rojo.', 'Score each risk; deal with the red ones.'),
 ('b14', 'Sostenibilidad', 'Sustainability', '8 min', 'Ambiental, económica, social', 'Environmental, economic, social', 'Captura por tratamiento y lee el ISG y la AMIBA.', 'Enter per treatment and read the ISG and AMIBA.'),
 ('b15', 'Prospectiva', 'Outlook', '6 min', 'A 1, 2 y 5 años', 'At 1, 2 and 5 years', 'Ajusta la materia orgánica y compara tres futuros.', 'Adjust organic matter and compare three futures.'),
 ('b16', 'Informe', 'Report', '3 min', 'Acciones, PDF y datos', 'Actions, PDF and data', 'Imprime, exporta CSV y JSON, guarda el proyecto.', 'Print, export CSV and JSON, save the project.'),
]
CLARO = ['#6b3fa0', '#7a5230', '#3f7a9a', '#2f7d6a', '#8a6d1f', '#4f7d3a', '#b0703e', '#c0772b', '#39718a', '#2f5d50', '#3f6fb0', '#2f8f6a', '#b8562e', '#2f7d4a', '#8a3f5a', '#5a4a3a']
OSCURO = ['#c4a6ea', '#d8b08c', '#8fc8e6', '#86d1bf', '#e0c06e', '#a9cf7e', '#e0a878', '#e2a15c', '#86c3dc', '#8fc2ad', '#9dbbe8', '#86d1a2', '#ec9a72', '#86d1a2', '#e08aa8', '#c9b6a3']


def css():
    c = leer('base.css')
    c = c.replace('RatioAvis · Instructivo del Productor', 'Ratio Vitis · Instructivos')
    c = c.replace('--acc:#c0772b; --acc-d:#8a5214; --acc-s:rgba(192,119,43,.12);', '--acc:#9a4f2c; --acc-d:#7a3a1c; --acc-s:rgba(154,79,44,.12);')
    viejo_c = '--b1:#2f5d50; --b2:#5c8538; --b3:#2f6f8f; --b4:#b0841f; --b5:#c0772b; --b6:#a0502e; --b7:#755a8c; --b8:#4a5d6b;'
    viejo_o = '--b1:#8fc2ad; --b2:#a9cf7e; --b3:#7fbddb; --b4:#e3c063; --b5:#e2a15c; --b6:#e39272; --b7:#bba3d6; --b8:#9fb4c2;'
    assert viejo_c in c and viejo_o in c
    c = c.replace(viejo_c, ' '.join(f'--b{i+1}:{x};' for i, x in enumerate(CLARO)))
    c = c.replace(viejo_o, ' '.join(f'--b{i+1}:{x};' for i, x in enumerate(OSCURO)))
    c = c.replace('.cover .steps{display:grid;grid-template-columns:repeat(8,1fr);', '.cover .steps{display:grid;grid-template-columns:repeat(16,minmax(0,1fr));')
    c = c.replace('.cover .steps div{padding:14px 12px 16px;', '.cover .steps div{padding:10px 5px 12px;')
    c = c.replace('  .cover .steps div:nth-child(4){border-right:0}', '  .cover .steps div:nth-child(4n){border-right:0}')
    c = c.replace('  .cover .steps div:nth-child(-n+4){border-bottom:1px solid var(--line)}', '  .cover .steps div:nth-child(-n+12){border-bottom:1px solid var(--line)}')
    c += '''
@media print{html .cover{height:297mm;overflow:hidden}html .cover .in{flex:1 1 auto;min-height:0;overflow:hidden}html .cover .steps{flex:none}html .cover .steps div{padding:3mm .6mm 3.5mm 1.2mm}html .cover .steps div span{font-size:5.8pt;letter-spacing:-.01em}html .cover .steps b{font-size:12pt}}
/* ---------- Ratio Vitis: ecuaciones, fichas, código, ficha legal ---------- */
.cover .steps div span{font-size:11.5px}
.chap-head .big{min-width:1.2ch}
figure.svgfig{padding:18px 18px 4px}
figure.svgfig svg{display:block;width:100%;height:auto;font-family:var(--sans)}
figure.svgfig svg text:not([fill]){fill:var(--text)}
.eq{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;margin:22px 0 24px;padding:16px 24px 12px;background:var(--paper);border:1px solid var(--line);border-left:3px solid var(--c,var(--pri));border-radius:12px;font-size:19px;overflow-x:auto}
.eq .no{align-self:flex-end;font:600 12.5px var(--sans);color:var(--faint);text-align:right}
.eq sub,.eq sup{font-size:.7em}
.where{font-size:16px;color:var(--muted);margin:-8px 0 22px}
.legal{font-size:14.5px;line-height:1.6;color:var(--muted)}
.legal b{color:var(--text)}
.legal .isbn{font:700 15px var(--sans);letter-spacing:.04em;color:var(--text)}
.qrbox{display:flex;gap:22px;align-items:center;margin:18px 0}
.qrbox svg{width:150px;height:150px;flex:0 0 auto;background:#fff;padding:8px;border-radius:10px;border:1px solid var(--line)}
.code{position:relative;margin:20px 0 26px;border-radius:12px;background:#17201c;color:#e4ebe6;overflow:hidden;border:1px solid #26302b}
.code .bar{padding:8px 14px;background:#1e2924;font:600 12px var(--sans);color:#9fb0a6;letter-spacing:.06em}
.code pre{margin:0;padding:16px 18px;overflow-x:auto;font-size:13px;line-height:1.6;white-space:pre-wrap}
table.hoja td{height:34px;border:1px solid var(--line)}
@media print{.eq{break-inside:avoid}.code{break-inside:avoid}table.hoja td{height:9mm}#creditos .legal{font-size:10pt;line-height:1.4}#creditos .legal p{margin:3px 0}#creditos h3{margin-top:14px}#creditos .qrbox svg{width:110px;height:110px}}
'''
    return c


def js(titulo_es, titulo_en, pdf_es, pdf_en, grupos, glos, cien):
    j = leer('base.js')
    def rp(a, b, obligatorio=True):
        nonlocal j
        if a not in j:
            assert not obligatorio, 'no está en base.js: ' + a[:60]
            return
        j = j.replace(a, b)
    for v in ('ratioavis_lang', 'ratiovina_guia_lang'): rp(f"'{v}'", "'ratiovitis_guia_lang'", False)
    for v in ('ratioavis_tema', 'ratiovina_guia_tema'): rp(f"'{v}'", "'ratiovitis_guia_tema'", False)
    j = re.sub(r"'[^']*Instructivo del (Productor|Científico)' : '[^']*(Producer|Scientist) Guide'", f"'{titulo_es}' : '{titulo_en}'", j)
    j = re.sub(r"'instructivo/[^']*\.pdf' : 'instructivo/[^']*\.pdf'", f"'instructivo/{pdf_es}' : 'instructivo/{pdf_en}'", j)
    rp("$$('figure[data-fig] .fn', sec).forEach(fn => { i++; fn.textContent = (LANG === 'es' ? 'Figura ' : 'Figure ') + (/^\\d$/.test(n) ? n + '.' + i : i); });",
       "$$('figure .fn', sec).forEach(fn => { i++; fn.textContent = (LANG === 'es' ? 'Figura ' : 'Figure ') + n + '.' + i; });", False)
    rp("if (subs.length && /^\\d$/.test(sec.dataset.toc))", "if (subs.length && /^[\\dA-Z]+$/.test(sec.dataset.toc) && sec.dataset.toc !== 'P')", False)
    i = j.index('const GRUPOS = '); k = j.index(';', i) + 1
    j = j[:i] + 'const GRUPOS = ' + json.dumps(grupos, ensure_ascii=False) + ';' + j[k:]
    i = j.index('const GLOS = ['); k = j.index('];', i) + 2
    j = j[:i] + 'const GLOS = ' + json.dumps(glos, ensure_ascii=False, indent=0) + ';' + j[k:]
    return j


# ---------------------------------------------------------------- piezas bilingües
def L(es, en, tag='span', **kw):
    a = ''.join(f' {k.rstrip("_")}="{v}"' for k, v in kw.items())
    return f'<{tag} lang="es"{a}>{es}</{tag}><{tag} lang="en"{a}>{en}</{tag}>'

def P(es, en, cls=''):
    c = f' class="{cls}"' if cls else ''
    return f'<p lang="es"{c}>{es}</p>\n<p lang="en"{c}>{en}</p>\n'

def H3(id_, n, es, en):
    return f'<h3 id="{id_}" data-n="{n}">{L(es, en)}</h3>\n'

def FIG(id_, es, en, leyenda=()):
    ley = ''.join(f'<li>{L(a, b)}</li>' for a, b in leyenda)
    return (f'<figure data-fig="{id_}"><figcaption><span class="fn"></span>{L(es, en)}</figcaption>'
            + (f'<ol class="legend">{ley}</ol>' if ley else '') + '</figure>\n')

ICONO_BOX = {'farm': '◆', 'tip': '✓', 'warn': '!', 'why': '?', 'rule': '→'}
def BOX(tipo, t_es, t_en, es, en):
    return (f'<div class="box {tipo}"><span class="bi">{ICONO_BOX[tipo]}</span><span class="bt" lang="es">{t_es}</span><span class="bt" lang="en">{t_en}</span>'
            f'<p lang="es">{es}</p><p lang="en">{en}</p></div>\n')

def TABLA(cab, filas, cls=''):
    th = ''.join(f'<th>{L(*c)}</th>' if isinstance(c, tuple) else f'<th>{c}</th>' for c in cab)
    tr = ''.join('<tr>' + ''.join(f'<td>{L(*x)}</td>' if isinstance(x, tuple) else f'<td>{x}</td>' for x in f) + '</tr>' for f in filas)
    return f'<div class="tbl"><table class="{cls}"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>\n'

def REGLA(t_es, t_en, filas):
    tr = ''.join(f'<tr><td>{L(a, b)}</td><td>{L(c, d)}</td></tr>' for a, b, c, d in filas)
    return (f'<div class="box rule"><span class="bi">→</span><span class="bt" lang="es">{t_es}</span><span class="bt" lang="en">{t_en}</span>'
            f'<table><tbody>{tr}</tbody></table></div>\n')

EQ_EN = [('media de T<sub>med</sub> del 1 abr al 31 oct', 'mean T<sub>mean</sub> from 1 Apr to 31 Oct'), ('T<sub>mín</sub> media de septiembre', 'mean September T<sub>min</sub>'),
         ('desequilibrio global', 'overall imbalance'), ('dosis', 'dose'), ('planta', 'vine'), ('(uva)', '(grape)'), ('(diario)', '(daily)'), ('ANCOVA en bloques', 'Block ANCOVA'),
         ('si D', 'if D'), ('; si no,', '; otherwise'), ('vid:', 'vine:'), ('Ec.', 'Eq.'), ('Cuadro', 'Table'), ('Tabla', 'Table'), ('cap.', 'ch.'), (' y ', ' and '),
         ('1 abr', '1 Apr'), ('31 oct', '31 Oct'), ('30 sep', '30 Sep'), ('<sub>máx</sub>', '<sub>max</sub>'), ('<sub>mín</sub>', '<sub>min</sub>'), ('<sub>med</sub>', '<sub>mean</sub>'),
         ('c,máx', 'c,max'), ('c aj', 'c adj'), (' MO', ' OM'), ('·MO', '·OM'), ('(MO', '(OM'), ('umbral', 'threshold'),
         ('ADT', 'TAW'), ('AFA', 'RAW'), ('θ<sub>CC</sub>', 'θ<sub>FC</sub>'), ('θ<sub>PMP</sub>', 'θ<sub>WP</sub>'), ('IAF = AF', 'LAI = LA'), ('ΔMS', 'ΔDM'), ('CE<sub>e', 'EC<sub>e')]
def en_eq(t):
    for a, b in EQ_EN: t = t.replace(a, b)
    return t

def EQ(html, no=''):
    return f'<div class="eq"><span>{L(html, en_eq(html))}</span>' + (f'<span class="no">{L(no, en_eq(no))}</span>' if no else '') + '</div>\n'

def CHAP(id_, toc, color, eb_es, eb_en, t_es, t_en, in_es, in_en, cuerpo, inchap=True):
    return (f'<section class="chap" id="{id_}" data-toc="{toc}" style="--c:{color}">\n  <div class="chap-head"><span class="big">{toc}</span>\n'
            f'    <div class="eyebrow" lang="es">{eb_es}</div><div class="eyebrow" lang="en">{eb_en}</div>\n'
            f'    <h2 lang="es">{t_es}</h2><h2 lang="en">{t_en}</h2>\n    <p lang="es">{in_es}</p>\n    <p lang="en">{in_en}</p>\n    <span class="rule"></span></div>\n'
            + ('  <nav class="inchap"></nav>\n' if inchap else '') + cuerpo + '</section>\n\n')

def pasos():
    return ''.join(f'<div style="--c:var(--b{i+1})"><b>{i+1}</b>{L(b[1], b[2])}</div>' for i, b in enumerate(BLOQUES))

def flujo():
    return '<div class="flow">' + ''.join(f'<a href="#{b[0]}" style="--c:var(--b{i+1})"><span class="k" lang="es">Bloque {i+1}</span><span class="k" lang="en">Block {i+1}</span><span class="t">{b[3]}</span>'
                   f'<b lang="es">{b[1]}</b><b lang="en">{b[2]}</b><small lang="es">{b[4]}</small><small lang="en">{b[5]}</small></a>' for i, b in enumerate(BLOQUES)) + '</div>\n'

def rapido():
    return '<ol class="quick">' + ''.join(f'<li style="--c:var(--b{i+1})"><i>{i+1}</i><div><b lang="es">{b[1]}</b><b lang="en">{b[2]}</b><span lang="es">{b[6]}</span><span lang="en">{b[7]}</span></div></li>' for i, b in enumerate(BLOQUES)) + '</ol>\n'

def banda():
    return ''.join(f'<i style="background:var(--b{i+1})"></i>' for i in range(len(BLOQUES)))

def qr_svg():
    out = os.path.join(AQUI, '..', 'qr-app.svg')
    subprocess.run([sys.executable, os.path.join(AQUI, 'qr.py'), APP, out, 'M'], check=True, stdout=subprocess.DEVNULL)
    s = open(out, encoding='utf-8').read()
    return s[s.index('<svg'):]

def cita_app():
    d = f'https://doi.org/{DOI_APP}' if DOI_APP else 'https://github.com/hectortecumshe-ai/RatioVitis'
    z = 'Zenodo. ' if DOI_APP else ''
    return (f'<p lang="es">{CITA_AUT[0]} (2026). <i>Ratio Vitis: el viñedo medido como sistema complejo adaptativo: relación agua–suelo–planta–atmósfera, fertilidad, biomasa, productividad y energía</i> (versión {VERSION_APP}) [Software]. {z}{d}</p>'
            f'<p lang="en">{CITA_AUT[1]} (2026). <i>Ratio Vitis: The measured vineyard as a complex adaptive system: soil–plant–atmosphere water relations, fertility, biomass, productivity and energy</i> (Version {VERSION_APP}) [Computer software]. {z}{d}</p>')

def cita_guia(guia, t_es, t_en):
    d = DOI_GUIA.get(guia)
    url = f'https://doi.org/{d}' if d else APP + f'instructivo-{guia}.html'
    z = 'Zenodo. ' if d else ''
    return (f'<p lang="es">{CITA_AUT[0]} (2026). <i>{t_es.replace(" · ", ": ")}</i> (1.ª ed.). {z}{url}</p>'
            f'<p lang="en">{CITA_AUT[1]} (2026). <i>{t_en.replace(" · ", ": ")}</i> (1st ed.). {z}{url}</p>')

def legal(guia, t_es, t_en):
    ie, ien = ISBN[guia]
    d = DOI_GUIA.get(guia)
    doi_es = f'DOI de este instructivo: <a href="https://doi.org/{d}">{d}</a>' if d else 'DOI de este instructivo: se asigna al publicarlo en Zenodo'
    doi_en = f'DOI of this guide: <a href="https://doi.org/{d}">{d}</a>' if d else 'DOI of this guide: assigned on publication in Zenodo'
    dapp = f'<a href="https://doi.org/{DOI_APP}">{DOI_APP}</a>' if DOI_APP else L('se asigna al publicar la aplicación', 'assigned when the app is published')
    return f'''<div class="legal">
  <p lang="es"><b>{t_es}</b> · {EDICION[0]}, {FECHA[0]} · describe Ratio Vitis {VERSION_APP}.</p>
  <p lang="en"><b>{t_en}</b> · {EDICION[1]}, {FECHA[1]} · covers Ratio Vitis {VERSION_APP}.</p>
  <p>{AUTORES}</p>
  <p lang="es">Universidad Autónoma Chapingo, México. ORCID del autor de correspondencia (Héctor Tecumshé Mojica-Zárate): 0000-0002-9067-3983.</p>
  <p lang="en">Chapingo Autonomous University, Mexico. Corresponding author ORCID (Héctor Tecumshé Mojica-Zárate): 0000-0002-9067-3983.</p>
  <p><span class="isbn" lang="es">{('ISBN ' + ie) if ie else 'ISBN: sin asignar'}</span><span class="isbn" lang="en">{('ISBN ' + (ien or ie)) if (ien or ie) else 'ISBN: not assigned'}</span><br>
     <span lang="es">{doi_es} · DOI de la aplicación: </span><span lang="en">{doi_en} · DOI of the app: </span>{dapp}</p>
  <p lang="es">Texto y figuras bajo licencia Creative Commons Atribución 4.0 Internacional (CC BY 4.0); la aplicación, bajo licencia MIT. Las capturas son de Ratio Vitis {VERSION_APP} en modo ejemplo (Mata de Zarza, Veracruz) o en blanco. Composición en Palatino Linotype.</p>
  <p lang="en">Text and figures under the Creative Commons Attribution 4.0 International licence (CC BY 4.0); the app under the MIT licence. Screenshots are from Ratio Vitis {VERSION_APP} in example mode (Mata de Zarza, Veracruz) or blank. Typeset in Palatino Linotype.</p>
</div>'''


def portada(guia, t_es, t_en, h1_es, h1_en, sub_es, sub_en, img1, img2, otra):
    eb = ('Instructivo del Productor', 'Producer Guide') if guia == 'productor' else ('Instructivo del Científico', 'Scientist Guide')
    return f'''<section class="cover" id="portada">
  <div class="band">{banda()}</div>
  <div class="in">
    <div>
      <div class="kick"><img src="logo.svg" alt="Ratio Vitis"><div><div class="eyebrow" lang="es">{eb[0]}</div><div class="eyebrow" lang="en">{eb[1]}</div><div style="font-size:15px;color:var(--muted)">Ratio Vitis {VERSION_APP} · Ratio Complexus</div></div></div>
      <h1 lang="es">{h1_es}</h1>
      <h1 lang="en">{h1_en}</h1>
      <p class="sub" lang="es">{sub_es}</p>
      <p class="sub" lang="en">{sub_en}</p>
      <div class="meta">
        <div lang="es"><b>{EDICION[0]}</b> · {FECHA[0]} · describe Ratio Vitis {VERSION_APP}</div>
        <div lang="en"><b>{EDICION[1]}</b> · {FECHA[1]} · covers Ratio Vitis {VERSION_APP}</div>
        <div>{L('Texto CC BY 4.0 · app MIT', 'Text CC BY 4.0 · app MIT')}</div>
      </div>
      <div class="who">{AUTORES}<br>{otra}</div>
    </div>
    <div class="art" aria-hidden="true">
      <div class="frame"><img lang="es" src="instructivo/img/{img1}-es.jpg" alt=""><img lang="en" src="instructivo/img/{img1}-en.jpg" alt=""></div>
      <div class="frame b"><img lang="es" src="instructivo/img/{img2}-es.jpg" alt="" style="height:300px;object-fit:cover;object-position:top"><img lang="en" src="instructivo/img/{img2}-en.jpg" alt="" style="height:300px;object-fit:cover;object-position:top"></div>
    </div>
  </div>
  <div class="steps">{pasos()}</div>
</section>
'''


def pagina(guia, cuerpo, t_es, t_en, sub_es, sub_en, pdf_es, pdf_en, grupos, glos, desc):
    cien = guia == 'cientifico'
    estilo = css()
    return f'''<!doctype html>
<html lang="es" data-lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{t_es}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="logo.svg" type="image/svg+xml">
<style>
{estilo}
</style>
</head>
<body>

<header class="top">
  <button class="ib" id="menuBtn" aria-label="Índice / Contents">☰</button>
  <a class="brand" href="./" title="Ratio Vitis">
    <img src="logo.svg" alt="">
    <span>Ratio<i>Vitis</i> <small lang="es">· {sub_es}</small><small lang="en">· {sub_en}</small></span>
  </a>
  <span class="sp"></span>
  <a class="btn ghost no-print" href="./" target="_blank" rel="noopener">{L('Abrir la app', 'Open the app')} ↗</a>
  <div class="seg" role="group" aria-label="Idioma / Language"><button data-lang="es">ES</button><button data-lang="en">EN</button></div>
  <a class="btn pdf" id="pdfBtn" title="PDF" href="instructivo/{pdf_es}" download><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14"/></svg><span>PDF</span></a>
  <button class="ib" id="temaBtn" aria-label="Tema / Theme">☾</button>
  <div id="leido"></div>
</header>

<div class="layout">
<aside class="toc" id="toc">
  <div class="search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
    <input id="q" type="search" autocomplete="off" placeholder="Buscar en el instructivo…" aria-label="Buscar / Search">
    <div class="hits" id="hits"></div>
  </div>
  <ol id="tocList"></ol>
</aside>

<main>
{cuerpo}
</main>
</div>

<a class="ib totop" href="#portada" aria-label="Arriba / Top">↑</a>
<div id="zoom" role="dialog" aria-label="Imagen ampliada / Enlarged image"><div class="zi"></div></div>

<script>{js(t_es, t_en, pdf_es, pdf_en, grupos, glos, cien)}</script>
</body>
</html>
'''


def escribir(nombre, html):
    externos = sorted(set(re.findall(r'(?:src|href)="(https?://[^"/]+)', html)))
    open(os.path.join(RAIZ, nombre), 'w', encoding='utf-8', newline='\n').write(web(html, APP_WEB))
    faltan = [m for m in re.findall(r'data-fig="([\w-]+)"', html) if not os.path.exists(os.path.join(AQUI, '..', 'img', m + '-es.jpg'))]
    print(nombre, round(len(html.encode('utf-8')) / 1024), 'KB · enlaces externos:', externos, '· capturas que faltan:', faltan)


if __name__ == '__main__':
    quien = sys.argv[1:] or ['productor', 'cientifico']
    if 'productor' in quien:
        import productor; productor.armar()
    if 'cientifico' in quien:
        import cientifico; cientifico.armar()
