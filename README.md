<p align="center"><img src="logo.svg" width="96" alt="Ratio Vitis"></p>

# Ratio Vitis

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.24048724.svg)](https://doi.org/10.5281/zenodo.24048724)

👉 **https://hectortecumshe-ai.github.io/RatioVitis/**

**El viñedo medido como sistema complejo adaptativo: relación agua–suelo–planta–atmósfera, fertilidad, biomasa, productividad y energía.** Aplicación de **Ratio Complexus**, el ala de la suite [Ratio](https://hectortecumshe-ai.github.io/) dedicada a los sistemas complejos adaptativos. Es la hermana cuantitativa de [Ratio Viña](https://hectortecumshe-ai.github.io/RatioVina/): Ratio Viña recoge lo que sabe la gente del viñedo; Ratio Vitis mide lo que pasa en él.

Es la aplicación del objetivo 7 de la tesis de maestría de Jorge Hernández-González (Universidad Autónoma Chapingo), sobre la adaptabilidad de la uva en Mata de Zarza, Veracruz.

Está hecha para productores y para científicos, en español y en inglés. Un solo archivo HTML, sin servidor, sin instalación, sin cookies y sin recursos de terceros.

## Qué contiene (versión 0.1.0)

| Bloque | Contenido |
|---|---|
| 1 · Viñedo y experimento | Localidad del INEGI o GPS, tipo de uva, marco, conducción y riego; diseño en bloques completos al azar con sorteo reproducible, croquis y plantilla de campo; variables del estudio que se encienden o apagan |
| 2 · Suelo | Prueba del frasco y clase USDA, densidad aparente, θCC y θPMP (medidos o sugeridos del Cuadro 19 de FAO-56), ADT y AFA, infiltración, pH, CE y salinidad |
| 3 · Clima | CSV diario; ET0 de FAO Penman–Monteith con las rutas de FAO-56 para datos faltantes; Winkler, GST, Huglin y frescor nocturno con sus clases; exportación a PhenologyPro |
| 4 · RASPA | Balance hídrico diario con coeficiente dual de FAO-56: Kcb, Ke, Ks, agotamiento, transpiración y evaporación; riegos; potencial hídrico con cuatro escalas publicadas; fenología |
| 5 · Fertilidad | Análisis de suelo y foliar; rangos de suficiencia, índice DOP (Montañés et al., 1993; Benito et al., 2015) y dosis de abono igualada en nitrógeno |
| 6 · Biomasa | Poda, área foliar, IAF, NDVI y fracción cubierta, sarmiento, materia seca, carbono, CO₂ y O₂ |
| 7 · Productividad | Rendimiento, °Brix, Ravaz, área foliar/fruto, productividad del agua y pérdida de rendimiento por agua (Ky = 0.85, FAO-56) |
| 8 · Energía | Radiación neta, calor latente y sensible, relación de Bowen |
| 9 · Estadística | Descriptiva, ANOVA en bloques, Levene, Tukey, Pearson, ANCOVA y medidas repetidas; exportación a las apps LABG |
| 10 · Sistema complejo | Red dirigida con signo, intermediación, lazos de retroalimentación y el Recorrido del viñedo |
| 11–16 | Tablero, regeneración y resiliencia, riesgos, sostenibilidad por tratamiento (MESMIS, Sarandón, AMIBA, huella de carbono), prospectiva a 1, 2 y 5 años e informe con CSV y JSON reproducible |

## Caso de referencia

**Mata de Zarza, Puente Nacional, Veracruz**: uva de mesa Perlet plantada en febrero de 2025, con el experimento de abonos (excreta de ovino, cerdo o ave con pulpa de café, y testigo) en tres hileras. Datos de la *Guía práctica para el establecimiento de uva en Mata de Zarza, Veracruz* (Mojica-Zárate et al., 2026), de la propuesta de tesis (Hernández González, 2026) y del reanálisis ERA5 de 2025 (Hersbach et al., 2020) vía Open-Meteo. Se consulta en un **modo ejemplo** que nunca se guarda; la app arranca en blanco. Lo que aún no se ha medido aparece como «sin dato».

## Rigor y validación

Cada coeficiente, umbral y fórmula viene de una fuente citada y cotejada con su texto (● Dato publicado). Los supuestos necesarios para completar un cálculo están marcados (◆ Lectura de Ratio Vitis) y son editables. La app corre **35 comprobaciones** cada vez que se abre la Validación: ejemplos resueltos de FAO-56, la ET0 de 300 días contra un motor independiente en Python, la estadística contra SciPy y numpy, y la red contra NetworkX (`pruebas/`).

## Instructivos

- [Instructivo del Productor](https://hectortecumshe-ai.github.io/RatioVitis/instructivo-productor.html) · DOI [10.5281/zenodo.24048727](https://doi.org/10.5281/zenodo.24048727) · [PDF](instructivo/RatioVitis-Instructivo-Productor.pdf) · [Producer Guide (PDF)](instructivo/RatioVitis-Producer-Guide.pdf)
- [Instructivo del Científico](https://hectortecumshe-ai.github.io/RatioVitis/instructivo-cientifico.html) · DOI [10.5281/zenodo.24048729](https://doi.org/10.5281/zenodo.24048729) · [PDF](instructivo/RatioVitis-Instructivo-Cientifico.pdf) · [Scientist Guide (PDF)](instructivo/RatioVitis-Scientist-Guide.pdf)

## Cómo citarla

Mojica-Zárate, H. T., Hernández-González, J., Díaz-José, O., y Ramírez-García, A. G. (2026). *Ratio Vitis: el viñedo medido como sistema complejo adaptativo: relación agua–suelo–planta–atmósfera, fertilidad, biomasa, productividad y energía* (versión 0.1.0) [Software]. Zenodo. https://doi.org/10.5281/zenodo.24048724

## Armar desde las fuentes

```
python armar.py                       # src/ → index.html
python instructivo/fuente/armar.py    # instructivos HTML
```

## English

**Ratio Vitis** measures the vineyard as a complex adaptive system: soil–plant–atmosphere water relations (FAO-56 dual crop coefficient), soil, daily climate and viticultural indices, fertility (sufficiency ranges and DOP), biomass and carbon, productivity, energy balance, statistics for randomised block trials, a signed system network with feedback loops, sustainability (MESMIS, Sarandón) and 1-, 2- and 5-year scenarios. Bilingual (Spanish/English), producer and scientist views, a single offline HTML file. Reference case: Perlet table grapes in Mata de Zarza, Veracruz, Mexico.

## Licencia

Código bajo licencia [MIT](LICENSE). Instructivos bajo CC BY 4.0.

Autores: Héctor Tecumshé Mojica-Zárate ([ORCID 0000-0002-9067-3983](https://orcid.org/0000-0002-9067-3983)) · Jorge Hernández-González · Oscar Díaz-José · Adán Guillermo Ramírez-García.
