"""Capturas de los instructivos de Ratio Vitis: id → parámetros de captura.html.
b bloque · v vista (prod|cien) · h alto · sel desplazarse a (CSS o «@3.2» = tarjeta cuyo título empieza así) · off margen
m marcas numeradas separadas por «|» · prep preparaciones (vacio = app en blanco; si no, modo ejemplo de Mata de Zarza)."""
CAPTURAS = {
  # 0 · primeros pasos
  'inicio':     dict(b='inicio', prep='vacio', m='.langsw:not(.modesw)|#modesw|#btnTema|#btnAyuda|#nav|.progress'),
  'ejemplo':    dict(b='inicio', prep='vacio', h=640, m='.hero [data-entrar-ej]'),
  'fuentesej':  dict(b='inicio', sel='.ej-inv', off=140, h=640),
  'ayuda':      dict(b='clima', prep='ayuda', q='[data-q="winkler"]', sel='@3.3', off=420, h=700),
  'vistas':     dict(b='raspa', v='cien', sel='@4.3', off=140, h=900),
  'franja':     dict(b='clima', h=420, m='#franjaEj|.avance'),
  # 1 · viñedo y experimento
  'sitio':      dict(b='vina', sel='@1.1', off=140, h=760),
  'vinedo':     dict(b='vina', sel='@1.2', off=140, h=640),
  'diseno':     dict(b='vina', sel='@1.3', off=140, h=980),
  'variables':  dict(b='vina', sel='@1.4', off=140, h=900),
  # 2 · suelo
  'textura':    dict(b='suelo', sel='@2.1', off=140, h=720),
  'agua':       dict(b='suelo', sel='@2.3', off=140, h=620),
  # 3 · clima
  'clima':      dict(b='clima', sel='@3.1', off=140, h=980),
  'indices':    dict(b='clima', sel='@3.3', off=140, h=560),
  # 4 · RASPA
  'etapas':     dict(b='raspa', sel='@4.1', off=140, h=560),
  'balance':    dict(b='raspa', sel='@4.3', off=140, h=1100),
  'psi':        dict(b='raspa', sel='@4.4', off=140, h=560),
  # 5 a 9 · campo
  'fert':       dict(b='fert', sel='@5.2', off=140, h=760),
  'abonos':     dict(b='fert', sel='@5.3', off=140, h=560),
  'bio':        dict(b='bio', sel='@6.1', off=140, h=640),
  'carbono':    dict(b='bio', sel='@6.3', off=140, h=900),
  'prod':       dict(b='prod', sel='@7.2', off=140, h=640),
  'energia':    dict(b='energia', sel='@8.1', off=140, h=760),
  'est':        dict(b='est', h=900),
  # 10 · sistema complejo
  'sca':        dict(b='sca', prep='quieto', h=900),
  'retro':      dict(b='sca', prep='quieto', sel='@10.1', off=140, h=640),
  # 11 a 16 · resultados
  'tablero':    dict(b='tablero', h=1000),
  'regen':      dict(b='regen', h=1000),
  'riesgos':    dict(b='riesgos', h=1000),
  'sost':       dict(b='sost', h=1000),
  'prosp':      dict(b='prosp', h=1000),
  'supuestos':  dict(b='prosp', sel='@15.4', off=140, h=860),
  'informe':    dict(b='informe', h=1000),
  'validacion': dict(b='validacion', h=1000),
  'teoria':     dict(b='teoria', h=900),
  'oscuro':     dict(b='raspa', prep='oscuro', sel='@4.3', off=140, h=900),
}
