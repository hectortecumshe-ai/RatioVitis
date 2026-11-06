"""Contenido del Instructivo del Científico de Ratio Vitis (español e inglés): modelo, ecuaciones, validación y reproducibilidad.
Las ecuaciones son las del motor de la app (src/20_fao56.js, 21_suelo.js, 22_clima.js, 23_raspa.js, 24_campo.js, 25_estadistica.js, 31_red.js,
57s_sostenible.js, 57p_prospectiva.js); las referencias se leen de src/60_final.js."""
import os, re
from armar import *

T_ES, T_EN = 'Ratio Vitis · Instructivo del Científico', 'Ratio Vitis · Scientist Guide'

GLOS = [
 ['Coeficiente dual', 'Dual crop coefficient', 'Separa la ETc en transpiración (Ks·Kcb) y evaporación del suelo (Ke) (FAO-56, cap. 7).', 'Splits ETc into transpiration (Ks·Kcb) and soil evaporation (Ke) (FAO-56, ch. 7).'],
 ['Intermediación (Brandes)', 'Betweenness (Brandes)', 'Fracción de caminos más cortos que pasan por un nodo, normalizada por (n−1)(n−2).', 'Share of shortest paths through a node, normalised by (n−1)(n−2).'],
 ['Lazo de retroalimentación', 'Feedback loop', 'Ciclo dirigido simple de la red; su signo es el producto de los signos de sus aristas.', 'Simple directed cycle in the network; its sign is the product of its edge signs.'],
 ['Método delta', 'Delta method', 'Escenario climático construido sumando ΔT y escalando la lluvia del año observado.', 'Climate scenario built by adding ΔT and scaling rainfall of the observed year.'],
 ['mulberry32', 'mulberry32', 'Generador pseudoaleatorio de 32 bits con semilla; hace reproducible el sorteo.', 'Seeded 32-bit pseudo-random generator; makes the draw reproducible.'],
 ['Normalización min–máx', 'Min–max normalisation', 'Lleva un indicador a 0–1; invertida cuando menos es mejor.', 'Rescales an indicator to 0–1; reversed when less is better.'],
 ['Pedotransferencia', 'Pedotransfer function', 'Ecuación que estima la retención de agua a partir de arena, arcilla y materia orgánica (Saxton y Rawls, 2006).', 'Equation estimating water retention from sand, clay and organic matter (Saxton and Rawls, 2006).'],
 ['Reanálisis', 'Reanalysis', 'Reconstrucción del clima con un modelo y asimilación de observaciones (ERA5).', 'Climate reconstruction by a model with data assimilation (ERA5).'],
 ['Transpiración relativa', 'Relative transpiration', 'Tr/Tpot = 1 − ΣKcb·ET0(1−Ks)/ΣKcb·ET0; indicador de resiliencia hídrica.', 'Tr/Tpot = 1 − ΣKcb·ET0(1−Ks)/ΣKcb·ET0; a water-resilience indicator.'],
] + __import__('productor').GLOS


def referencias():
    s = open(os.path.join(RAIZ, 'src', '60_final.js'), encoding='utf-8').read()
    i = s.index('const REFS = [') + len('const REFS = ['); j = s.index('];', i)
    refs = re.findall(r"'((?:[^'\\]|\\.)*)'", s[i:j])
    enl = lambda r: re.sub(r'(https?://\S+?)([.,;]?)$', r'<a href="\1">\1</a>\2', r)
    return '<ol class="refs">' + ''.join(f'<li>{enl(r)}</li>' for r in refs) + '</ol>\n', len(refs)


def preliminares():
    c = P('Este instructivo es para quien usa Ratio Vitis en investigación o docencia: el tesista, el asesor, el comité, el revisor de una revista. Documenta el modelo de cada bloque, sus ecuaciones con número y fuente, los supuestos marcados, cómo se validó el motor y cómo reproducir cada número fuera de la app.',
          'This guide is for whoever uses Ratio Vitis in research or teaching: the thesis student, the adviser, the committee, a journal reviewer. It documents each block’s model, its equations with number and source, the flagged assumptions, how the engine was validated and how to reproduce every number outside the app.', 'lead')
    c += P('Ratio Vitis es la aplicación del objetivo 7 de la tesis de maestría de Jorge Hernández-González: evaluar la adaptabilidad de la uva en Mata de Zarza, Veracruz, como sistema complejo adaptativo. La hipótesis es que el manejo de la fertilización con abonos orgánicos que aumentan la materia orgánica del suelo da al viñedo mayor resiliencia a 1, 2 y 5 años (Hernández González, 2026).',
           'Ratio Vitis is the app of objective 7 of Jorge Hernández-González’s master’s thesis: to assess grapevine adaptability in Mata de Zarza, Veracruz, as a complex adaptive system. The hypothesis is that fertilisation with organic manures that raise soil organic matter gives the vineyard more resilience at 1, 2 and 5 years (Hernández González, 2026).')
    c += '<h3 id="rigor">' + L('Tres clases de dato', 'Three kinds of datum') + '</h3>\n'
    c += TABLA([('Etiqueta', 'Label'), ('Significa', 'Means'), ('Ejemplo', 'Example')], [
        [L('<b>● Dato publicado</b>', '<b>● Published data</b>'), ('Coeficiente, umbral o ecuación tomados de una fuente citada y cotejados con su texto.', 'Coefficient, threshold or equation taken from a cited source and checked against its text.'), ('Ky = 0.85 (FAO-56, Cuadro 24)', 'Ky = 0.85 (FAO-56, Table 24)')],
        [L('<b>◆ Lectura de Ratio Vitis</b>', '<b>◆ Ratio Vitis reading</b>'), ('Supuesto de la app para completar un cálculo; siempre marcado y editable.', 'App assumption to complete a calculation; always flagged and editable.'), ('RO = 0 y CR = 0 en el balance', 'RO = 0 and CR = 0 in the balance')],
        [L('<b>sin dato</b>', '<b>no data</b>'), ('No hay medición ni fuente; nada se calcula con ello.', 'No measurement or source; nothing is computed from it.'), ('Rendimiento antes de la cosecha', 'Yield before harvest')]])
    c += BOX('why', 'Arquitectura', 'Architecture', 'Un solo archivo HTML con CSS y JavaScript propios, sin bibliotecas ni recursos de terceros; todo el cálculo ocurre en el navegador. Las fuentes se arman con <code>armar.py</code> desde <code>src/</code>. Licencia MIT.', 'A single HTML file with its own CSS and JavaScript, no third-party libraries or resources; all computation runs in the browser. Sources are assembled with <code>armar.py</code> from <code>src/</code>. MIT licence.')
    return CHAP('leer', 'P', 'var(--acc)', 'Preliminares', 'Front matter', 'Cómo leer este instructivo', 'How to read this guide',
                'Para quién es, qué documenta y cómo distinguir dato, supuesto y vacío.', 'Who it is for, what it documents and how to tell data, assumption and gap apart.', c, inchap=False)


def modelo():
    c = P('El viñedo se representa como un sistema de cinco capas —suelo, planta, atmósfera, manejo y resultados— unidas por flujos de agua, energía, carbono y nutrientes. Los bloques 1 a 9 capturan las variables de cada capa; el Bloque 10 las une en una red dirigida con signos; los bloques 11 a 16 leen el sistema: tablero, regeneración, riesgos, sostenibilidad, prospectiva e informe.',
          'The vineyard is represented as a five-layer system —soil, plant, atmosphere, management and outcomes— joined by flows of water, energy, carbon and nutrients. Blocks 1 to 9 capture each layer’s variables; Block 10 joins them in a signed directed network; blocks 11 to 16 read the system: dashboard, regeneration, risks, sustainability, outlook and report.')
    c += FIG('vistas', '<b>La vista científica.</b> Cada bloque cierra con «El modelo del bloque»: ecuaciones, supuestos y fuentes.', '<b>The scientist view.</b> Each block closes with “The block model”: equations, assumptions and sources.')
    c += TABLA([('Bloque', 'Block'), ('Entradas', 'Inputs'), ('Salidas principales', 'Main outputs')], [
        ['1', ('Localidad INEGI o GPS; tipo de uva; marco; tratamientos, bloques y semilla', 'INEGI locality or GPS; grape type; spacing; treatments, blocks and seed'), ('Latitud, altitud, P, densidad, croquis', 'Latitude, altitude, P, density, layout')],
        ['2', ('Prueba del frasco, densidad aparente, θCC, θPMP, Zr, pH, CE, MO', 'Jar test, bulk density, θFC, θWP, Zr, pH, EC, OM'), ('Clase USDA, ADT, AFA, Yr por salinidad', 'USDA class, TAW, RAW, salinity Yr')],
        ['3', ('CSV diario: T, HR, u2, Rs o n, P, Tdew', 'Daily CSV: T, RH, u2, Rs or n, P, Tdew'), ('ET0, Winkler, GST, Huglin, CI, P/ET0', 'ET0, Winkler, GST, Huglin, CI, P/ET0')],
        ['4', ('Etapas, brotación, riegos, ψ, fenología', 'Stages, budburst, irrigations, ψ, phenology'), ('Dr, Ks, Kcb, Ke, ETc aj, T, E, DP', 'Dr, Ks, Kcb, Ke, ETc adj, T, E, DP')],
        ['5–7', ('Análisis foliar y de suelo, abonos; poda, AF, NDVI, MS; cosecha', 'Tissue and soil analyses, manures; pruning, LA, NDVI, DM; harvest'), ('SR, DOP, dosis; IAF, fc, C, CO₂, O₂; t ha⁻¹, Ravaz, WP, Ya/Ym', 'SR, DOP, dose; LAI, fc, C, CO₂, O₂; t ha⁻¹, Ravaz, WP, Ya/Ym')],
        ['8–9', ('Clima y balance; plantilla de campo', 'Climate and balance; field sheet'), ('Rn, LE, H, β; ANOVA, Tukey, ANCOVA, medidas repetidas', 'Rn, LE, H, β; ANOVA, Tukey, ANCOVA, repeated measures')],
        ['10–16', ('Todo lo anterior', 'All of the above'), ('Red, lazos, ISG, escenarios, informe y JSON', 'Network, loops, ISG, scenarios, report and JSON')]])
    return CHAP('modelo', '1', 'var(--b10)', 'Método', 'Method', 'El viñedo como sistema', 'The vineyard as a system',
                'Capas, flujos y bloques: qué entra y qué sale de cada uno.', 'Layers, flows and blocks: what goes into and comes out of each.', c)


def ecuaciones():
    c = H3('m-sitio', '2.1', 'Sitio y diseño', 'Site and design')
    c += EQ('P = 101.3 ((293 − 0.0065 z) / 293)<sup>5.26</sup> ; γ = 0.665 × 10<sup>−3</sup> P', 'FAO-56, Ec. 7–8')
    c += P('El sorteo de bloques completos al azar baraja los tratamientos dentro de cada bloque con el generador mulberry32 inicializado por una semilla de texto; la misma semilla reproduce el croquis. La plantilla de campo exporta una fila por planta con bloque, parcela y tratamiento.',
           'The randomised complete block draw shuffles treatments within each block with the mulberry32 generator seeded from a text seed; the same seed reproduces the layout. The field sheet exports one row per vine with block, plot and treatment.')
    c += H3('m-suelo', '2.2', 'Suelo', 'Soil')
    c += EQ('ADT = 1000 (θ<sub>CC</sub> − θ<sub>PMP</sub>) Z<sub>r</sub> ; AFA = p · ADT', 'FAO-56, Ec. 82–83')
    c += EQ('Y<sub>r</sub> = 100 − b (CE<sub>e</sub> − CE<sub>e,umbral</sub>) ; vid: 1.5 dS m<sup>−1</sup>, b = 9.6', 'FAO-56, cap. 8')
    c += P('La clase textural sigue el triángulo del USDA. Sin θCC y θPMP medidas se usa el centro del rango del Cuadro 19 de FAO-56 para la clase, marcado como sugerido. Los umbrales de densidad aparente por textura son de USDA-NRCS; el pH ideal de 5.5–6.5, de NC State Extension.',
           'Texture class follows the USDA triangle. Without measured θFC and θWP the centre of the FAO-56 Table 19 range for the class is used, flagged as suggested. Bulk-density thresholds by texture are from USDA-NRCS; the 5.5–6.5 ideal pH, from NC State Extension.')
    c += H3('m-clima', '2.3', 'Clima', 'Climate')
    c += EQ('ET<sub>0</sub> = [0.408 Δ (R<sub>n</sub> − G) + γ (900/(T + 273)) u<sub>2</sub> (e<sub>s</sub> − e<sub>a</sub>)] / [Δ + γ (1 + 0.34 u<sub>2</sub>)]', 'FAO-56, Ec. 6')
    c += P('Con datos faltantes se siguen las rutas de FAO-56: e<sub>a</sub> del punto de rocío (Ec. 14) o de HRmáx y HRmín (Ec. 17); R<sub>s</sub> de horas de sol (Ec. 35) o de Hargreaves con k<sub>Rs</sub> = 0.16 en el interior y 0.19 en la costa (Ec. 50); viento de otra altura llevado a 2 m (Ec. 47); sin viento, 2 m s<sup>−1</sup>. La app dice, día por día, qué ruta usó.',
           'With missing data the FAO-56 routes are followed: e<sub>a</sub> from dew point (Eq. 14) or from RHmax and RHmin (Eq. 17); R<sub>s</sub> from sunshine hours (Eq. 35) or Hargreaves with k<sub>Rs</sub> = 0.16 inland and 0.19 on the coast (Eq. 50); wind from another height taken to 2 m (Eq. 47); without wind, 2 m s<sup>−1</sup>. The app reports, day by day, which route it used.')
    c += EQ('W = Σ<sub>1 abr</sub><sup>31 oct</sup> max(0, T<sub>med</sub> − 10) ; GST = media de T<sub>med</sub> del 1 abr al 31 oct', 'Amerine y Winkler (1944); del Río et al. (2023)')
    c += EQ('HI = Σ<sub>1 abr</sub><sup>30 sep</sup> [(T<sub>med</sub> − 10) + (T<sub>máx</sub> − 10)] / 2 · d ; CI = T<sub>mín</sub> media de septiembre', 'Tonietto y Carbonneau (2004)')
    c += TABLA([('Clase', 'Class'), ('Winkler (°C·d)', 'Winkler (°C·d)'), ('GST (°C)', 'GST (°C)')], [
        [('Demasiado frío', 'Too cold'), '&lt; 850', '&lt; 13'], [('Región I · Frío', 'Region I · Cold'), '850–1389', '13–15'], [('Región II · Intermedio', 'Region II · Intermediate'), '1390–1667', '15–17'],
        [('Región III · Templado', 'Region III · Temperate'), '1668–1944', '17–19'], [('Región IV · Cálido', 'Region IV · Warm'), '1945–2222', '19–21'], [('Región V · Muy cálido', 'Region V · Very warm'), '2223–2700', '21–24'], [('Demasiado cálido', 'Too hot'), '&gt; 2700', '&gt; 24']])
    c += P('Los límites de Winkler y GST se cotejaron con las leyendas de las Figuras 6 y 7 del PDF de del Río et al. (2023). Cada clase de Winkler y de GST es independiente: la tabla las pone en la misma fila solo por orden. Un índice se calcula si su periodo tiene al menos 90 % de días con dato (criterio de Ratio Vitis); en el hemisferio sur los periodos se desplazan seis meses.',
           'Winkler and GST limits were checked against the legends of Figures 6 and 7 in the PDF of del Río et al. (2023). Winkler and GST classes are independent: the table puts them on the same row only by order. An index is computed if its period has at least 90 % of days with data (Ratio Vitis criterion); in the southern hemisphere periods shift by six months.')
    c += H3('m-raspa', '2.4', 'RASPA: balance con coeficiente dual', 'SPAC: dual-coefficient balance')
    c += EQ('ET<sub>c aj</sub> = (K<sub>s</sub> K<sub>cb</sub> + K<sub>e</sub>) ET<sub>0</sub>', 'FAO-56, Ec. 80')
    c += EQ('K<sub>s</sub> = (ADT − D<sub>r</sub>) / ((1 − p) ADT) si D<sub>r</sub> &gt; AFA ; si no, K<sub>s</sub> = 1', 'FAO-56, Ec. 84')
    c += EQ('D<sub>r,i</sub> = D<sub>r,i−1</sub> − (P − RO)<sub>i</sub> − I<sub>i</sub> + ET<sub>c,i</sub> + DP<sub>i</sub>', 'FAO-56, Ec. 85')
    c += EQ('K<sub>e</sub> = min[K<sub>r</sub> (K<sub>c,máx</sub> − K<sub>cb</sub>), f<sub>ew</sub> K<sub>c,máx</sub>]', 'FAO-56, Ec. 71')
    c += P('K<sub>cb</sub> inicial, medio y final, p y altura del Cuadro 17 y 22 de FAO-56 para uva de mesa o de vino; etapas del Cuadro 11; f<sub>w</sub> del Cuadro 20 según el riego. Supuestos marcados: RO = 0 y CR = 0; con goteo, la lluvia moja toda la superficie (f<sub>w</sub> = 1). El ajuste de K<sub>cb</sub> medio y final por viento y humedad (Ec. 70) es opcional, y f<sub>c</sub> puede escribirse o estimarse con la Ec. 76.',
           'Initial, mid and late K<sub>cb</sub>, p and height from FAO-56 Tables 17 and 22 for table or wine grapes; stages from Table 11; f<sub>w</sub> from Table 20 by irrigation type. Flagged assumptions: RO = 0 and CR = 0; with drip, rain wets the whole surface (f<sub>w</sub> = 1). Adjusting mid and late K<sub>cb</sub> for wind and humidity (Eq. 70) is optional, and f<sub>c</sub> can be entered or estimated with Eq. 76.')
    c += TABLA([('Escala de ψ', 'ψ scale'), ('Clases', 'Classes'), ('Fuente', 'Source')], [
        [('Hoja al alba', 'Predawn leaf'), '≥ −0.3 · −0.3 a −0.5 · −0.5 a −0.8 · &lt; −0.8 MPa', 'IVES; Carbonneau'],
        [('Tallo a mediodía', 'Midday stem'), '≥ −0.6 · −0.7 a −1.1 · −1.2 a −1.6 · &lt; −1.6 MPa', 'IVES; Deloire'],
        [('Tallo, riego (vino)', 'Stem, irrigation (wine)'), '0 a −0.80 · −0.81 a −1.20 · −1.21 a −1.60 MPa', 'UC ANR'],
        [('Tallo, cinco niveles', 'Stem, five levels'), '&gt; −0.411 · −0.674 · −0.936 · −1.2 · &lt; −1.2 MPa', 'Uriarte et al. (2025)']])
    c += H3('m-campo', '2.5', 'Fertilidad, biomasa, productividad y energía', 'Fertility, biomass, productivity and energy')
    c += EQ('DOP = C · 100 / C<sub>ref</sub> − 100 ; Σ|DOP| = desequilibrio global', 'Montañés et al. (1993); C<sub>ref</sub>: Benito et al. (2015), Tabla 9')
    c += EQ('dosis (kg planta<sup>−1</sup>) = N<sub>obj</sub> / [(N % / 100)(1 − H % / 100)] / 1000', '')
    c += EQ('IAF = AF / (d<sub>h</sub> d<sub>p</sub>) ; f<sub>c</sub> = 0.98 (NDVI − 0.15) ; ΔC = ΔMS · f<sub>C</sub> ; CO<sub>2</sub> = ΔC · 44/12 ; O<sub>2</sub> = CO<sub>2</sub> · 32/44', 'Er-Raki et al. (2013); Hernández González (2026)')
    c += EQ('1 − Y<sub>a</sub>/Y<sub>m</sub> = K<sub>y</sub> (1 − ET<sub>c aj</sub>/ET<sub>c</sub>) ; K<sub>y</sub>(uva) = 0.85', 'FAO-56, Ec. 90 y Cuadro 24')
    c += P('ET<sub>c</sub> sin estrés se reconstruye del balance como ET<sub>c aj</sub> + Σ K<sub>cb</sub>(1 − K<sub>s</sub>) ET<sub>0</sub>, porque K<sub>e</sub> no depende de K<sub>s</sub>. Ravaz = rendimiento / poda (5–10) y área foliar/fruto (0.8 · 1.2 · 1.6 m² kg⁻¹) de UC Davis; °Brix de cosecha en uva de mesa 14–17.5 (Permanhani et al., 2016). Rangos de suficiencia foliar de Garnacha tinta (Benito et al., 2015, Tablas 5–8) y de NC State para peciolo en floración.',
           'Stress-free ET<sub>c</sub> is rebuilt from the balance as ET<sub>c adj</sub> + Σ K<sub>cb</sub>(1 − K<sub>s</sub>) ET<sub>0</sub>, because K<sub>e</sub> does not depend on K<sub>s</sub>. Ravaz = yield / pruning (5–10) and leaf area/fruit (0.8 · 1.2 · 1.6 m² kg⁻¹) from UC Davis; table-grape harvest °Brix 14–17.5 (Permanhani et al., 2016). Leaf sufficiency ranges for red Grenache (Benito et al., 2015, Tables 5–8) and NC State for petiole at bloom.')
    c += EQ('LE = λ ET<sub>c</sub> , λ = 2.45 MJ kg<sup>−1</sup> ; H = R<sub>n</sub> − G − LE , G ≈ 0 (diario) ; β = H / LE', 'FAO-56, Ec. 42; OENO One')
    c += H3('m-est', '2.6', 'Estadística', 'Statistics')
    c += EQ('y<sub>ij</sub> = μ + τ<sub>i</sub> + β<sub>j</sub> + γ(x<sub>ij</sub> − x̄) + ε<sub>ij</sub>', 'ANCOVA en bloques; Steel y Torrie (1980)')
    c += P('Descriptiva, ANOVA de bloques al azar, Levene (mediana), Tukey con la distribución del rango estudentizado, Pearson, ANCOVA con una covariable y medidas repetidas como parcelas divididas en el tiempo (tratamiento contra el error a; fecha y tratamiento × fecha contra el error b). El modelo mixto de la propuesta (planta como efecto aleatorio) se ajusta fuera, en R (lme4, emmeans), con el CSV ordenado que exporta el bloque.',
           'Descriptives, randomised-block ANOVA, Levene (median), Tukey with the studentized range distribution, Pearson, single-covariate ANCOVA and repeated measures as split plots in time (treatment against error a; date and treatment × date against error b). The proposal’s mixed model (vine as random effect) is fitted outside, in R (lme4, emmeans), from the tidy CSV the block exports.')
    c += H3('m-red', '2.7', 'Red del sistema', 'System network')
    c += EQ('C<sub>B</sub>(v) = 2 / ((n − 1)(n − 2)) · Σ<sub>s≠v≠t</sub> σ<sub>st</sub>(v) / σ<sub>st</sub>', 'Brandes (2001)')
    c += P('Los nodos son variables de los bloques 1 a 9 y las aristas, relaciones dirigidas con signo del catálogo de la red (<code>src/31_red.js</code>), cada una con su tipo y su fuente. Se enumeran los ciclos dirigidos simples de longitud ≤ 7; el signo del lazo es el producto de los signos de sus aristas (negativo: se compensa; positivo: se refuerza).',
           'Nodes are variables of blocks 1 to 9 and edges are signed directed relations from the network catalogue (<code>src/31_red.js</code>), each with its type and source. Simple directed cycles of length ≤ 7 are enumerated; a loop’s sign is the product of its edge signs (negative: balancing; positive: reinforcing).')
    c += FIG('retro', '<b>Lazos y variables puente</b> con los datos de Mata de Zarza.', '<b>Loops and bridge variables</b> with Mata de Zarza data.')
    c += H3('m-sost', '2.8', 'Regeneración, riesgos y sostenibilidad', 'Regeneration, risks and sustainability')
    c += EQ('IR = Σ s<sub>k</sub> / (4 n) ; r = P · I · (1 − 0.4 CA) · (1 − 0.15 c)', 'Newton et al. (2020); IEC 31010:2019')
    c += EQ('I<sub>n</sub> = (x − x<sub>mín</sub>)/(x<sub>máx</sub> − x<sub>mín</sub>) ; ID = Σ w<sub>i</sub> I<sub>n,i</sub> / Σ w<sub>i</sub> ; ISG = Σ w<sub>D</sub> ID / Σ w<sub>D</sub>', 'Sarandón (2002); Hernández González (2026), 6.8')
    c += P('Sostenible: ISG ≥ 0.5 y toda ID ≥ 0.5; escala 0–4 = ISG × 4. Huella: N<sub>2</sub>O = N (0.010 + 0.11·0.010 + 0.24·0.011) 44/28 con GWP de 273 (IPCC, 2019; Forster et al., 2021), CO<sub>2</sub> de la urea y del combustible (IPCC, 2006). Los coeficientes 0.4 y 0.15 del riesgo son supuestos marcados, los mismos de Ratio Viña.',
           'Sustainable: ISG ≥ 0.5 and every ID ≥ 0.5; 0–4 scale = ISG × 4. Footprint: N<sub>2</sub>O = N (0.010 + 0.11·0.010 + 0.24·0.011) 44/28 with a GWP of 273 (IPCC, 2019; Forster et al., 2021), CO<sub>2</sub> from urea and fuel (IPCC, 2006). The risk coefficients 0.4 and 0.15 are flagged assumptions, the same as Ratio Viña.')
    c += H3('m-prosp', '2.9', 'Prospectiva', 'Outlook')
    c += EQ('θ<sub>1500t</sub> = −0.024 S + 0.487 C + 0.006 MO + 0.005 S·MO − 0.013 C·MO + 0.068 S·C + 0.031 ; θ<sub>1500</sub> = θ<sub>1500t</sub> + (0.14 θ<sub>1500t</sub> − 0.02)', 'Saxton y Rawls (2006), Ec. 1')
    c += EQ('θ<sub>33t</sub> = −0.251 S + 0.195 C + 0.011 MO + 0.006 S·MO − 0.027 C·MO + 0.452 S·C + 0.299 ; θ<sub>33</sub> = θ<sub>33t</sub> + (1.283 θ<sub>33t</sub><sup>2</sup> − 0.374 θ<sub>33t</sub> − 0.015)', 'Saxton y Rawls (2006), Ec. 2')
    c += P('MO(t) = MO<sub>0</sub> + r·t por tratamiento (MO acotada a 8 %). Al θ medido se le suma solo Δθ = θ(MO(t)) − θ(MO<sub>0</sub>), con S y C de la prueba del frasco. Cada escenario perturba el año base por el método delta: T + ΔT (IPCC, 2018: 0.2 °C por década; humedad relativa constante, por lo que T<sub>dew</sub> se desplaza igual), lluvia × (1 + ΔP) y riego × f<sub>I</sub>; el balance FAO-56 se corre otra vez. Resiliencia: Tr/Tpot, días con K<sub>s</sub> &lt; 1 y freno Σ K<sub>cb</sub>ET<sub>0</sub>(1 − K<sub>s</sub>). El ISG se recalcula con una normalización común a todos los años y escenarios. La hipótesis se contrasta con el ρ de Spearman entre MO(5) y Tr/Tpot(5) por escenario.',
           'OM(t) = OM<sub>0</sub> + r·t per treatment (OM capped at 8 %). Only Δθ = θ(OM(t)) − θ(OM<sub>0</sub>) is added to the measured θ, with S and C from the jar test. Each scenario perturbs the base year by the delta method: T + ΔT (IPCC, 2018: 0.2 °C per decade; constant relative humidity, so T<sub>dew</sub> shifts equally), rain × (1 + ΔP) and irrigation × f<sub>I</sub>; the FAO-56 balance is run again. Resilience: Tr/Tpot, days with K<sub>s</sub> &lt; 1 and brake Σ K<sub>cb</sub>ET<sub>0</sub>(1 − K<sub>s</sub>). The ISG is recomputed with a normalisation common to all years and scenarios. The hypothesis is tested with Spearman’s ρ between OM(5) and Tr/Tpot(5) per scenario.')
    c += FIG('supuestos', '<b>Supuestos de los escenarios.</b> Solo ΔT tiene fuente (IPCC, 2018); los demás están marcados como editables.', '<b>Scenario assumptions.</b> Only ΔT is sourced (IPCC, 2018); the rest are flagged as editable.')
    return CHAP('ecuaciones', '2', 'var(--b4)', 'Método', 'Method', 'Ecuaciones por bloque', 'Equations by block',
                'Cada ecuación con su número en la fuente; son las mismas que corre el motor.', 'Each equation with its number in the source; they are the ones the engine runs.', c)


def caso():
    c = P('El modo ejemplo carga un estado aparte que nunca se guarda. Sus fuentes son tres, y lo que no tiene medición queda «sin dato»:',
          'Example mode loads a separate state that is never saved. It has three sources, and whatever has no measurement stays “no data”:')
    c += TABLA([('Dato', 'Datum'), ('Valor', 'Value'), ('Fuente', 'Source')], [
        [('Sitio', 'Site'), ('Mata de Zarza, Puente Nacional, Ver.; 19.230° N, 467 m', 'Mata de Zarza, Puente Nacional, Ver.; 19.230° N, 467 m'), 'INEGI'],
        [('Uva, conducción, pie', 'Grape, training, rootstock'), ('Mesa; espaldera; pie franco', 'Table; vertical trellis; own-rooted'), 'Mojica-Zárate et al. (2026)'],
        [('Marco', 'Spacing'), ('3.0 × 1.40 m (2,381 plantas ha⁻¹)', '3.0 × 1.40 m (2,381 vines ha⁻¹)'), 'Mojica-Zárate et al. (2026)'],
        [('Plantación; riego', 'Planting; irrigation'), ('Febrero de 2025 (día aproximado: 24); goteo', 'February 2025 (approximate day: 24); drip'), 'Mojica-Zárate et al. (2026)'],
        [('Suelo', 'Soil'), ('Clase arcillosa; θ del Cuadro 19 (sugerido); Zr 0.70 m (◆)', 'Clay class; θ from Table 19 (suggested); Zr 0.70 m (◆)'), 'Mojica-Zárate et al. (2026); FAO-56'],
        [('Variedad y diseño', 'Variety and design'), ('Perlet; BCA 4 × 3, parcelas de 7, bordo 1; sorteo del croquis', 'Perlet; RCBD 4 × 3, 7-vine plots, 1 border; draw from the layout'), 'Hernández González (2026)'],
        [('Clima diario', 'Daily climate'), ('2025, 365 días: Tmáx, Tmín, HRmáx, HRmín, Tdew, u10, Rs, P', '2025, 365 days: Tmax, Tmin, RHmax, RHmin, Tdew, u10, Rs, P'), 'ERA5 (Hersbach et al., 2020) vía Open-Meteo (Zippenfeld, 2023)'],
        [('Etapas', 'Stages'), ('Latitudes bajas, 20/40/120/60 d, desde la plantación (◆)', 'Low latitudes, 20/40/120/60 d, from planting (◆)'), 'FAO-56, Cuadro 11']])
    c += P('El clima es la celda ERA5 de 19.25° N y 96.75° O ajustada a 467 m, descargada el 5 de noviembre de 2026; el viento a 10 m se lleva a 2 m con la Ec. 47. Resultados que da la app:',
           'The climate is the ERA5 cell at 19.25° N, 96.75° W adjusted to 467 m, downloaded on 5 November 2026; 10 m wind is taken to 2 m with Eq. 47. Results the app gives:')
    c += TABLA([('Salida', 'Output'), ('Valor', 'Value')], [
        [('ET0 anual 2025 (media diaria)', 'Annual ET0 2025 (daily mean)'), '1,386 mm (3.80 mm d⁻¹)'], [('Lluvia 2025', 'Rain 2025'), '1,765 mm'],
        ['Winkler · GST', L('3,308 °C·d · 25.5 °C; ambos «demasiado cálido»', '3,308 °C·d · 25.5 °C; both “too hot”')], ['Huglin · CI', '3,307 (HI+3) · 21.6 °C (CI−2)'],
        [('ADT · AFA', 'TAW · RAW'), '98 mm · 34 mm'], [('ETc aj desde la plantación', 'ETc adj from planting'), L('1,085 mm: T 620 mm, E 465 mm (43 % evaporación)', '1,085 mm: T 620 mm, E 465 mm (43 % evaporation)')],
        [('Días con Ks &lt; 1 · Ks mínimo', 'Days with Ks &lt; 1 · min Ks'), L('125 de 311 · 0.22 (sin riegos registrados)', '125 of 311 · 0.22 (no irrigation recorded)')],
        [('ETc aj/ETc · Ya/Ym (Ky 0.85)', 'ETc adj/ETc · Ya/Ym (Ky 0.85)'), '0.89 · 0.90'], [('Rn · LE · H · β', 'Rn · LE · H · β'), '3,755 · 2,657 · 1,098 MJ m⁻² · 0.41']])
    c += BOX('warn', 'Límites del caso', 'Limits of the case', 'Sin riegos registrados el balance trata a la vid como de temporal, aunque la guía indica riego constante los tres primeros meses; y los K<sub>cb</sub> son de vid adulta para plantas de uno a dos años. Ambas cosas sobrestiman el estrés y la transpiración de 2025. Se corrigen capturando los riegos y f<sub>c</sub> o NDVI.',
             'With no irrigation recorded the balance treats the vine as rainfed, although the guide calls for constant irrigation during the first three months; and the K<sub>cb</sub> are for mature vines while the plants are one to two years old. Both overstate 2025 stress and transpiration. They are corrected by entering irrigations and f<sub>c</sub> or NDVI.')
    c += FIG('balance', '<b>Balance hídrico de 2025 en Mata de Zarza.</b>', '<b>2025 water balance in Mata de Zarza.</b>')
    c += FIG('energia', '<b>Reparto de energía de 2025.</b>', '<b>2025 energy partition.</b>')
    return CHAP('caso', '3', 'var(--b3)', 'El caso', 'The case', 'Mata de Zarza, Veracruz', 'Mata de Zarza, Veracruz',
                'Qué datos tiene el modo ejemplo, de dónde vienen y qué resulta.', 'What data the example mode has, where they come from and what results.', c)


def validacion():
    c = P('La app corre sus pruebas cada vez que abres el bloque Validación: <b>35 comprobaciones</b>, todas correctas en la versión 0.1.0.',
          'The app runs its tests every time you open the Validation block: <b>35 checks</b>, all correct in version 0.1.0.')
    c += FIG('validacion', '<b>Validación.</b> Ejemplos resueltos de FAO-56, motor independiente, clases, estadística y red.', '<b>Validation.</b> FAO-56 worked examples, independent engine, classes, statistics and network.')
    c += TABLA([('Grupo', 'Group'), ('Qué se compara', 'What is compared'), ('Resultado', 'Result')], [
        [('FAO-56', 'FAO-56'), ('10 resultados de los ejemplos 2, 8, 14, 15, 18 y 20', '10 results of examples 2, 8, 14, 15, 18 and 20'), ('dentro del redondeo publicado', 'within the published rounding')],
        [('Motor independiente', 'Independent engine'), ('ET0 de 300 días aleatorios (14–33° de latitud, 0–2600 m, con Rs, horas de sol o Hargreaves) contra <code>pruebas/verificar_fao56.py</code>', 'ET0 of 300 random days (14–33° latitude, 0–2600 m, with Rs, sunshine or Hargreaves) against <code>pruebas/verificar_fao56.py</code>'), ('diferencia máxima 8.9 × 10⁻¹⁶ mm d⁻¹', 'maximum difference 8.9 × 10⁻¹⁶ mm d⁻¹')],
        [('Clases y fórmulas', 'Classes and formulas'), ('Textura USDA (5 casos), sorteo reproducible, Garnacha, carbono, Er-Raki, escala IVES, DOP, Winkler/GST y Ky', 'USDA texture (5 cases), reproducible draw, Grenache, carbon, Er-Raki, IVES scale, DOP, Winkler/GST and Ky'), ('exactos', 'exact')],
        [('Estadística', 'Statistics'), ('ANOVA (40), Tukey, Levene, Pearson (30), ANCOVA (25), medidas repetidas (20) contra SciPy y numpy (<code>pruebas/verificar_estadistica.py</code>)', 'ANOVA (40), Tukey, Levene, Pearson (30), ANCOVA (25), repeated measures (20) against SciPy and numpy (<code>pruebas/verificar_estadistica.py</code>)'), ('≤ 10⁻⁸ en F, p y Tukey', '≤ 10⁻⁸ in F, p and Tukey')],
        [('Red', 'Network'), ('Grado, intermediación y ciclos de 30 grafos aleatorios contra NetworkX (<code>pruebas/verificar_red.py</code>)', 'Degree, betweenness and cycles of 30 random graphs against NetworkX (<code>pruebas/verificar_red.py</code>)'), ('diferencia ≤ 3 × 10⁻¹⁷', 'difference ≤ 3 × 10⁻¹⁷')]])
    c += BOX('farm', 'Una prueba más con el caso', 'One more test with the case', 'La ET0 anual de Mata de Zarza 2025 calculada por la app (1,385.6 mm, con T<sub>dew</sub>) se recalculó con el motor independiente en Python y dio el mismo valor.', 'The app’s annual ET0 for Mata de Zarza 2025 (1,385.6 mm, using T<sub>dew</sub>) was recomputed with the independent Python engine and gave the same value.')
    c += H3('reproducir', '4.1', 'Reproducir cualquier número', 'Reproducing any number')
    c += P('En la vista científica, <span class="path">Informe<i>›</i>JSON reproducible</span> descarga entradas (el estado completo), parámetros, resultados y referencias; el Bloque 3 exporta el clima en el formato de PhenologyPro y el Bloque 9 el CSV ordenado para AgriDesign. Los guiones de <code>pruebas/</code> regeneran los casos de prueba:',
           'In the scientist view, <span class="path">Report<i>›</i>Reproducible JSON</span> downloads inputs (the full state), parameters, results and references; Block 3 exports climate in PhenologyPro format and Block 9 the tidy CSV for AgriDesign. The <code>pruebas/</code> scripts regenerate the test cases:')
    c += '<div class="code"><div class="bar">pruebas/</div><pre>python verificar_fao56.py        # ejemplos de FAO-56 y 300 días → casos_fao56.json\npython verificar_estadistica.py  # SciPy / numpy → casos_estadistica.json\npython verificar_red.py          # NetworkX → casos_red.json\npython ../armar.py               # incrusta los casos en index.html</pre></div>\n'
    c += H3('limites', '4.2', 'Limitaciones', 'Limitations')
    c += P('El balance usa una sola capa de suelo y no modela ascenso capilar ni escurrimiento; los índices vitícolas se diseñaron para climas templados; las referencias foliares son de Garnacha tinta en La Rioja; Ky es estacional, no por etapa; la prospectiva usa escenarios exploratorios, no pronósticos, y la pedotransferencia de Saxton y Rawls se calibró en suelos de EUA.',
           'The balance uses a single soil layer and does not model capillary rise or runoff; viticultural indices were designed for temperate climates; leaf references are for red Grenache in La Rioja; Ky is seasonal, not per stage; the outlook uses exploratory scenarios, not forecasts, and the Saxton and Rawls pedotransfer was calibrated on US soils.')
    return CHAP('validacion', '4', 'var(--b12)', 'Evidencia y uso', 'Evidence and use', 'Validación y reproducibilidad', 'Validation and reproducibility',
                'Cómo se comprobó el motor y cómo rehacer cada cálculo.', 'How the engine was checked and how to redo every calculation.', c)


def finales():
    refs, n = referencias()
    s = CHAP('referencias', 'R', 'var(--acc)', 'Evidencia y uso', 'Evidence and use', 'Referencias', 'References',
             f'Las {n} referencias que usa la app, en APA 7.', f'The {n} references the app uses, in APA 7.', refs, inchap=False)
    s += CHAP('glosario', 'G', 'var(--acc)', 'Evidencia y uso', 'Evidence and use', 'Glosario', 'Glossary', 'Términos del modelo y del viñedo.', 'Model and vineyard terms.', '<dl class="glos" id="glos"></dl>\n', inchap=False)
    c = '<h3 id="cita-app">' + L('Cómo citar la aplicación', 'How to cite the app') + '</h3>\n' + cita_app()
    c += '<h3 id="cita-guia">' + L('Cómo citar este instructivo', 'How to cite this guide') + '</h3>\n' + cita_guia('cientifico', T_ES, T_EN)
    c += f'<div class="qrbox">{qr_svg()}' + P('Escanea para abrir Ratio Vitis:<br><b>hectortecumshe-ai.github.io/RatioVitis</b>', 'Scan to open Ratio Vitis:<br><b>hectortecumshe-ai.github.io/RatioVitis</b>') + '</div>\n'
    c += '<h3 id="ficha">' + L('Ficha', 'Imprint') + '</h3>\n' + legal('cientifico', T_ES, T_EN)
    s += CHAP('creditos', 'C', 'var(--acc)', 'Evidencia y uso', 'Evidence and use', 'Cómo citar y créditos', 'How to cite and credits', 'Autores, licencias y código QR.', 'Authors, licences and QR code.', c, inchap=False)
    return s


def armar():
    otra = L('Hay otra guía para el trabajo de campo: el <a href="instructivo-productor.html">Instructivo del Productor</a>.', 'There is a companion guide for fieldwork: the <a href="instructivo-productor.html">Producer Guide</a>.')
    cuerpo = portada('cientifico', T_ES, T_EN, 'Del dato de campo <em>a la ecuación</em> <span class="a">y de vuelta</span>', 'From field datum <em>to equation</em> <span class="a">and back</span>',
                     'Modelo, ecuaciones, supuestos, validación y reproducibilidad de Ratio Vitis: el viñedo medido como sistema complejo adaptativo.',
                     'Model, equations, assumptions, validation and reproducibility of Ratio Vitis: the measured vineyard as a complex adaptive system.', 'vistas', 'validacion', otra)
    cuerpo += '<div class="doc">\n' + preliminares() + modelo() + ecuaciones() + caso() + validacion() + finales() + '</div>\n'
    html = pagina('cientifico', cuerpo, T_ES, T_EN, 'Instructivo del Científico', 'Scientist Guide', 'RatioVitis-Instructivo-Cientifico.pdf', 'RatioVitis-Scientist-Guide.pdf',
                  {'leer': ['Preliminares', 'Front matter'], 'modelo': ['Método', 'Method'], 'caso': ['El caso', 'The case'], 'validacion': ['Evidencia y uso', 'Evidence and use']}, GLOS,
                  'Instructivo del Científico de Ratio Vitis: modelo, ecuaciones, validación y reproducibilidad. · Ratio Vitis Scientist Guide.')
    escribir('instructivo-cientifico.html', html)
