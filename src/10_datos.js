"use strict";
/* =====================================================================
   1. DATOS BASE · CONFIGURACIÓN, IDIOMA Y ESTADO
   Ratio Vitis — Ratio Complexus («lo que está tejido junto»)
   El viñedo medido: relación agua–suelo–planta–atmósfera, fertilidad,
   biomasa, productividad y energía como sistema complejo adaptativo.
   App hermana de Ratio Viña: el Stack del conocimiento local vive solo allá.
   ===================================================================== */
const CONFIG = {
  app:'Ratio Vitis', version:'0.1.0', anio:2026, doi:'',
  repo:'https://github.com/hectortecumshe-ai/RatioVitis',
  autores:'Héctor Tecumshé Mojica-Zárate · Jorge Hernández-González · Oscar Díaz-José · Adán Guillermo Ramírez-García',
  citaAutores:{es:'Mojica-Zárate, H. T., Hernández-González, J., Díaz-José, O., y Ramírez-García, A. G.',en:'Mojica-Zárate, H. T., Hernández-González, J., Díaz-José, O., & Ramírez-García, A. G.'},
  titulo:{es:'El viñedo medido como sistema complejo adaptativo: relación agua–suelo–planta–atmósfera, fertilidad, biomasa, productividad y energía',en:'The measured vineyard as a complex adaptive system: soil–plant–atmosphere water relations, fertility, biomass, productivity and energy'}
};
CONFIG.url = 'https://hectortecumshe-ai.github.io/RatioVitis/';
CONFIG.qr = '__QR__';   // lo pone armar.py con el código QR de herramientas/qr-app.svg (codificador propio)

let LANG = 'es', MODO = 'prod';
try{ LANG = localStorage.getItem('vitis_lang') || ((navigator.language||'es').slice(0,2)==='en'?'en':'es'); MODO = localStorage.getItem('vitis_modo') || 'prod'; }catch(e){}
const T = (es,en)=> LANG==='en' ? en : es;
const tx = o => o==null ? '' : (typeof o==='string' ? o : (LANG==='en' ? (o.en??o.es) : (o.es??o.en)));
const E = (es,en)=>({es,en});
const LOC = ()=> LANG==='en' ? 'en-US' : 'es-MX';
const num = v=> v===''||v==null||!isFinite(+v) ? null : +v;

/* Tipo de uva: define los coeficientes de FAO-56 (Cuadros 12, 17 y 22) */
const TIPOS_UVA = [{id:'mesa', n:E('Uva de mesa o pasa','Table or raisin grape')}, {id:'vino', n:E('Uva para vino','Wine grape')}];

let S;
function estadoInicial(){ return {
  formato:1,
  bloque:'inicio', visitados:{},
  proyecto:{nombre:'', responsable:'', fecha:new Date().toISOString().slice(0,10), notas:''},
  edo:'', mun:'', loc:'',                                   // localidad del INEGI (da latitud y altitud)
  sitio:{lat:'', z:'', manual:false},                       // latitud y altitud escritas por el usuario
  vina:{tipo:'', variedad:'', portainjerto:'', anioPlant:'', entre:'', sobre:'', conduccion:'', riego:''},   // Bloque 1
  exp:{trats:[], bloques:'', plantasParcela:'', bordo:'', etiquetaBloque:'', semilla:'', sorteo:null},        // diseño experimental
  suelo:{textura:'', jarArena:'', jarLimo:'', jarArcilla:'', daMasa:'', daVol:'', da:'', cc:'', pmp:'', zr:'', ze:'', rew:'', infVol:'', infT:'', ph:'', ce:'', mo:''},   // Bloque 2
  clima:{dias:[], fuente:'', kRs:''},                       // Bloque 3: registros diarios de la estación
  raspa:{etapas:'', brot:'', ajustar:false, fc:'', riegos:[], psi:[], dr0:''},     // Bloque 4
  revisado:{}
}; }
/* EJ = modo ejemplo: nunca se guarda y no toca el proyecto del usuario */
let EJ = false, S_USUARIO = null;
function guardar(){ if(EJ) return; try{ localStorage.setItem('vitis_v1', JSON.stringify(S)); }catch(e){} }
function fusionar(base, g){ const s=Object.assign(base, g); ['proyecto','sitio','vina','exp','suelo','clima','raspa'].forEach(k=>{ s[k]=Object.assign(estadoInicial()[k], g[k]||{}); }); return s; }
function cargar(){ try{ const g=JSON.parse(localStorage.getItem('vitis_v1')||'null'); if(g && g.formato) return fusionar(estadoInicial(), g); }catch(e){} return estadoInicial(); }
const LUGARES = [];   // sin accesos directos: cada localidad se elige en el mapa o en la lista

/* Sitio: latitud y altitud de la localidad del INEGI, o las que escribió el usuario */
function sitio(){ const l=locSel(); const lat=S.sitio.manual?num(S.sitio.lat):(l?l[5]:null), z=S.sitio.manual?num(S.sitio.z):(l?l[3]:null);
  return {lat, z, ok:lat!=null&&z!=null, kRs:num(S.clima.kRs)||0.16}; }
const tipoUva = ()=> S.vina.tipo ? FAO.UVA[S.vina.tipo] : null;
