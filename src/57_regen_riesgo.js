"use strict";
/* =====================================================================
   Bloque 12 · REGENERACIÓN Y RESILIENCIA
   Bloque 13 · RIESGOS DEL VIÑEDO
   ---------------------------------------------------------------------
   Regeneración: siete perillas 0–4 sobre los principios de salud del suelo del
   USDA-NRCS (mínima perturbación, suelo cubierto, diversidad, raíces vivas) y lo
   que añade la literatura de agricultura regenerativa (integración animal, menos
   insumos de síntesis, materia orgánica; Newton et al., 2020; Schreefel et al.,
   2020). Sin Stack del conocimiento no hay valores sugeridos: cada perilla la
   mueves tú. IR = Σ s / (4·n) con las perillas respondidas; cortes de clase:
   lectura de Ratio Viña. Al lado, la evidencia medida: materia orgánica, CO₂
   de la biomasa (Bloque 6) y agua productiva (Bloque 4).
   Resiliencia hídrica: se mide sobre el balance diario FAO-56 del Bloque 4, sin
   umbrales nuevos. Episodio de estrés = días seguidos con Ks < 1 (Dr > RAW,
   Ec. 84); termina cuando la lluvia o el riego regresan Dr a RAW o menos.
   Autonomía = (RAW − Dr) / ETc media de los últimos 7 días: días hasta que
   empieza el estrés si no llueve ni se riega. Freno de la vid = Σ Kcb·ET₀·(1 − Ks):
   la transpiración que la vid dejó de gastar por el lazo de la escena 5.
   Riesgo: matriz de probabilidad × impacto 1–5 (IEC 31010:2019; ISO 31000:2018)
   dentro del marco del IPCC (2014). r = P · I · (1 − 0.4·CA) · (1 − 0.15·control);
   los factores 0.4 y 0.15 son supuestos de Ratio Viña. Junto a cada amenaza, la
   evidencia de tus propios datos (conteos y máximos medidos, sin umbrales nuevos).
   ===================================================================== */
const NIVEL04 = [E('Nulo','None'),E('Bajo','Low'),E('Medio','Medium'),E('Alto','High'),E('Muy alto','Very high')];
const NIVEL15 = [null,E('Muy bajo','Very low'),E('Bajo','Low'),E('Medio','Medium'),E('Alto','High'),E('Muy alto','Very high')];
const REGEN_IND = [
  {id:'labranza', pr:E('Mínima perturbación','Minimal disturbance'), n:E('Labranza mínima','Minimal tillage'), col:'#9a6a3a',
   q:E('¿Cuántos pasos de maquinaria o arado mueven el suelo entre hileras en cada ciclo? Menos pasos, menos erosión y más vida en el suelo.','How many machinery or plough passes move the inter-row soil each cycle? Fewer passes, less erosion and more soil life.')},
  {id:'cobertura', pr:E('Suelo cubierto','Soil cover'), n:E('Suelo cubierto todo el año','Soil covered all year'), col:'#7a9a3a',
   q:E('¿Cuántos meses del año el suelo está cubierto por cubierta vegetal, sarmientos picados o acolchado?','How many months a year is the soil covered by cover crop, chopped prunings or mulch?')},
  {id:'diversidad', pr:E('Diversidad','Diversity'), n:E('Diversidad de especies','Species diversity'), col:'#2f8f6a',
   q:E('¿Cuántas especies conviven en la parcela además de la vid (cubierta, árboles de borde, setos, animales)?','How many species share the plot besides the vine (cover crop, border trees, hedges, animals)?')},
  {id:'raices', pr:E('Raíces vivas','Living roots'), n:E('Raíces vivas el mayor tiempo','Living roots as long as possible'), col:'#5f8f3e',
   q:E('La vid es perenne; ¿cuántos meses hay además raíces vivas de la cubierta entre hileras?','The vine is perennial; for how many months are there also living cover-crop roots between rows?')},
  {id:'animales', pr:E('Integración animal','Livestock integration'), n:E('Animales integrados al viñedo','Animals integrated into the vineyard'), col:'#b0703e',
   q:E('¿Hay animales que pastorean la cubierta fuera de la temporada o aportan estiércol (por ejemplo, el abono ovino del experimento)?','Are there animals grazing the cover outside the season or providing manure (for example, the experiment’s sheep manure)?')},
  {id:'insumos', pr:E('Menos síntesis','Fewer synthetics'), n:E('Menos agroquímicos de síntesis','Fewer synthetic agrochemicals'), col:'#2f7d8a',
   q:E('¿Qué parte de la fertilización y la sanidad usa productos de síntesis frente a abonos y bioinsumos?','What share of fertilisation and crop protection uses synthetic products versus manures and bio-inputs?')},
  {id:'mo', pr:E('M. orgánica','Org. matter'), n:E('Materia orgánica y residuos','Organic matter and residues'), col:'#7a4f9a',
   q:E('¿Se devuelven al suelo los sarmientos, el estiércol o la composta, y se mide la materia orgánica?','Are prunings, manure or compost returned to the soil, and is organic matter measured?')}
];
const SIN_DATO_CL = {n:E('Sin dato','No data'), c:'info'};
const CLASE_IR = v=> v==null?SIN_DATO_CL : v<0.25?{n:E('Degradante','Degrading'),c:'bad'} : v<0.5?{n:E('Convencional','Conventional'),c:'warn'} : v<0.75?{n:E('En transición regenerativa','In regenerative transition'),c:'info'} : {n:E('Regenerativo','Regenerative'),c:'ok'};
function regeneracion(){ const R=S.regen||{};
  const ind=REGEN_IND.map(d=>{ const u=R[d.id], conf=u!=null&&u!==''; return {...d, s:conf?+u:null, conf}; });
  const con=ind.filter(x=>x.conf), IR=con.length?con.reduce((t,x)=>t+x.s,0)/(4*con.length):null;
  const base=S.regenBase||null;
  return {ind, IR, nConf:con.length, provisional:con.length<ind.length, clase:CLASE_IR(IR), base, dIR:base&&IR!=null?IR-base.IR:null, mo:S.regenMO||{}}; }

/* ---------------- Resiliencia hídrica sobre el balance FAO-56 ---------------- */
function resiliencia(){ const r=RASPA.correr(); if(r.falta) return null; const b=r.b, ep=[]; let cur=null;
  b.forEach((d,i)=>{ if(d.Ks<1){ if(!cur) cur={i0:i, f0:d.f, n:0, minKs:1}; cur.n++; cur.minKs=Math.min(cur.minKs,d.Ks); }
    else if(cur){ const x=b[i-1], P=x.P+d.P, I=x.I+d.I; cur.fin=d.f; cur.por=P===0&&I===0?'seca':I>P?'riego':'lluvia'; ep.push(cur); cur=null; } });
  if(cur){ cur.abierto=true; ep.push(cur); }
  const u=b[b.length-1], ult=b.slice(-7), etcM=ult.reduce((s,d)=>s+d.etc,0)/ult.length;
  const freno=b.reduce((s,d)=>s+d.kcb*d.et0*(1-d.Ks),0), Tpot=b.reduce((s,d)=>s+d.kcb*d.et0,0);
  return {r, ep, cerrados:ep.filter(e=>!e.abierto), largo:ep.length?Math.max(...ep.map(e=>e.n)):0, medio:ep.length?ep.reduce((s,e)=>s+e.n,0)/ep.length:null,
    porLluvia:ep.filter(e=>e.por==='lluvia').length, porRiego:ep.filter(e=>e.por==='riego').length, abierto:ep.some(e=>e.abierto),
    autonomia:etcM>0?Math.max(0,u.RAW-u.Dr)/etcM:null, TAW:u.TAW, RAW:u.RAW, Dr:u.Dr, etcM, freno, Tpot}; }
/* Línea de Ks diario con los episodios sombreados */
function lineaKs(rs){ const b=rs.r.b, W=760, H=220, L=44, R=12, Tp=14, Bt=34, n=b.length, x=i=>L+i*(W-L-R)/Math.max(1,n-1), y=v=>Tp+(1-v)*(H-Tp-Bt);
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${T('Coeficiente de estrés diario','Daily stress coefficient')}">`;
  rs.ep.forEach(e=>{ s+=`<rect x="${x(e.i0).toFixed(1)}" y="${Tp}" width="${Math.max(2,x(e.i0+e.n-1)-x(e.i0)).toFixed(1)}" height="${H-Tp-Bt}" fill="#c0772b" fill-opacity=".14" data-tip="${esc(e.f0+' · '+e.n+' '+T('días','days')+' · Ks '+T('mínimo','minimum')+' '+fmt(e.minKs,2)+(e.abierto?' · '+T('sigue abierto','still open'):' · '+T('terminó por','ended by')+' '+(e.por==='riego'?T('riego','irrigation'):e.por==='lluvia'?T('lluvia','rain'):T('—','—'))))}"/>`; });
  [0,0.5,1].forEach(v=>{ s+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end" font-size="11" class="m">${v}</text>`; });
  s+=`<path d="${b.map((d,i)=>`${i?'L':'M'}${x(i).toFixed(1)} ${y(d.Ks).toFixed(1)}`).join('')}" fill="none" stroke="#2f5d50" stroke-width="2"/>`;
  [0, Math.floor(n/2), n-1].forEach(i=>{ s+=`<text x="${x(i)}" y="${H-12}" text-anchor="middle" font-size="11" class="m">${b[i].f}</text>`; });
  return s+`<text x="12" y="${Tp+(H-Tp-Bt)/2}" font-size="12" font-weight="700" transform="rotate(-90 12 ${Tp+(H-Tp-Bt)/2})" text-anchor="middle">Ks</text></svg>`; }

/* ---------------- Riesgos ---------------- */
const CAT_R = {clima:{n:E('Climáticos','Climatic'),col:'#2d78b0'}, bio:{n:E('Biológicos','Biological'),col:'#5f8f3e'}, mercado:{n:E('Mercado','Market'),col:'#c98b21'}, social:{n:E('Sociales','Social'),col:'#b05434'}, inst:{n:E('Institucionales','Institutional'),col:'#5a6b8a'}, recursos:{n:E('Recursos naturales','Natural resources'),col:'#7a4f9a'}};
/* Evidencia de tus datos: solo conteos y máximos medidos; nunca un umbral nuevo */
const _dias = ()=>S.clima.dias||[];
const EVID = {
  sequia:()=>{ const z=resiliencia(); return z?T(`${z.r.diasEstres} de ${z.r.dias} días con Ks < 1; episodio más largo: ${z.largo} días`,`${z.r.diasEstres} of ${z.r.dias} days with Ks < 1; longest episode: ${z.largo} days`):null; },
  agua:()=>{ const z=resiliencia(); return z?T(`riego de la temporada: ${fmt(z.r.tot.I,0)} mm frente a ${fmt(z.r.tot.etc,0)} mm de ET del viñedo`,`season irrigation: ${fmt(z.r.tot.I,0)} mm against ${fmt(z.r.tot.etc,0)} mm vineyard ET`):null; },
  helada:()=>{ const d=_dias(); if(!d.length) return null; const n=d.filter(x=>x.tmin<=0).length, m=Math.min(...d.map(x=>x.tmin)); return T(`${n} días con Tmin ≤ 0 °C en tu registro; mínima ${fmt(m,1)} °C`,`${n} days with Tmin ≤ 0 °C in your record; minimum ${fmt(m,1)} °C`); },
  calor:()=>{ const d=_dias(); if(!d.length) return null; const m=d.reduce((a,x)=>x.tmax>a.tmax?x:a); return T(`máxima de tu registro: ${fmt(m.tmax,1)} °C (${m.f})`,`maximum in your record: ${fmt(m.tmax,1)} °C (${m.f})`); },
  lluvia:()=>{ const d=_dias().filter(x=>x.prec!=null); if(!d.length) return null; const m=d.reduce((a,x)=>x.prec>a.prec?x:a); return T(`lluvia diaria máxima: ${fmt(m.prec,0)} mm (${m.f})`,`maximum daily rain: ${fmt(m.prec,0)} mm (${m.f})`); },
  salinidad:()=>{ const s=SUELO.salinidad(num(S.suelo.ce)); return s?T(`CEe ${fmt(num(S.suelo.ce),1)} dS m⁻¹ → rendimiento relativo ${fmt(s.yr,0)} % (FAO-56)`,`ECe ${fmt(num(S.suelo.ce),1)} dS m⁻¹ → relative yield ${fmt(s.yr,0)} % (FAO-56)`):null; },
  compacta:()=>{ const da=RED.valores().da, c=SUELO.claseDa(da, sueloHidrico().tex); return c?T(`densidad aparente ${fmt(da,2)} g cm⁻³: `,`bulk density ${fmt(da,2)} g cm⁻³: `)+tx(c.t).toLowerCase():null; },
  arcilla:()=>{ const t=sueloHidrico().tex; return t?T('textura de tu suelo: ','your soil texture: ')+tx(SUELO.CLASES[t]||E(t,t)):null; }
};
const RIESGOS = [
  {id:'sequia', cat:'clima', n:E('Sequía o lluvias tardías','Drought or late rains')},
  {id:'helada', cat:'clima', n:E('Helada','Frost')},
  {id:'granizo', cat:'clima', n:E('Granizo','Hail')},
  {id:'lluvia', cat:'clima', n:E('Lluvias intensas o inundación','Heavy rain or flooding')},
  {id:'calor', cat:'clima', n:E('Ola de calor','Heatwave')},
  {id:'frio', cat:'clima', n:E('Falta de frío invernal: dormancia incompleta y brotación irregular','Lack of winter chill: incomplete dormancy and uneven budburst'), f:'Kok, 2014'},
  {id:'ciclon', cat:'clima', n:E('Ciclones y huracanes','Cyclones and hurricanes')},
  {id:'plagas', cat:'bio', n:E('Plagas','Pests')},
  {id:'enferm', cat:'bio', n:E('Enfermedades de hongos (cenicilla, mildiu, pudriciones del racimo)','Fungal diseases (powdery mildew, downy mildew, bunch rots)'), f:'Keller, 2020'},
  {id:'pierce', cat:'bio', n:E('Enfermedad de Pierce (Xylella fastidiosa) y sus insectos vectores','Pierce’s disease (Xylella fastidiosa) and its insect vectors'), f:'Keller, 2020'},
  {id:'hormiga', cat:'bio', n:E('Hormiga cortadora en la planta joven','Leaf-cutter ants on young vines'), f:'Mojica-Zárate et al., 2026'},
  {id:'fauna', cat:'bio', n:E('Daño por animales domésticos y fauna silvestre','Damage by livestock and wildlife'), f:'Mojica-Zárate et al., 2026'},
  {id:'material', cat:'bio', n:E('Material vegetal enfermo o mal enraizado','Diseased or poorly rooted planting material'), f:'Mojica-Zárate et al., 2026'},
  {id:'deriva', cat:'bio', n:E('Deriva de herbicidas de parcelas vecinas (la vid es muy sensible)','Herbicide drift from neighbouring plots (grapevines are very sensitive)'), f:E('Lectura de Ratio Viña','Ratio Viña reading')},
  {id:'malezas', cat:'bio', n:E('Malezas resistentes o invasoras','Resistant or invasive weeds')},
  {id:'precio', cat:'mercado', n:E('Caída del precio de venta','Fall in sale price')},
  {id:'insumos', cat:'mercado', n:E('Alza de insumos y servicios','Rise in input and service costs')},
  {id:'nuevo', cat:'mercado', n:E('Cultivo nuevo en la región: mercado y canales de venta por construir','New crop in the region: market and sales channels still to be built'), f:'Mojica-Zárate et al., 2026'},
  {id:'venta', cat:'mercado', n:E('Intermediarismo o falta de comprador','Middlemen or no buyer')},
  {id:'manoobra', cat:'social', n:E('Falta de mano de obra y de relevo generacional','Labour shortage and no generational succession')},
  {id:'adopcion', cat:'social', n:E('Abandono del cultivo por falta de experiencia o de resultados en los primeros años','Abandoning the crop for lack of experience or early results'), f:'Mojica-Zárate et al., 2026'},
  {id:'insegur', cat:'social', n:E('Inseguridad o robo','Insecurity or theft')},
  {id:'apoyos', cat:'inst', n:E('Retiro de programas y apoyos','Withdrawal of programmes and support')},
  {id:'tierra', cat:'inst', n:E('Conflictos de tenencia de la tierra','Land tenure conflicts')},
  {id:'erosion', cat:'recursos', n:E('Erosión y pérdida de fertilidad','Erosion and fertility loss')},
  {id:'agua', cat:'recursos', n:E('Escasez de agua para riego','Irrigation water scarcity'), f:'Mojica-Zárate et al., 2026'},
  {id:'salinidad', cat:'recursos', n:E('Salinidad del suelo o del agua de riego','Soil or irrigation-water salinity'), f:'FAO-56'},
  {id:'compacta', cat:'recursos', n:E('Compactación del suelo','Soil compaction'), f:'USDA-NRCS'},
  {id:'arcilla', cat:'recursos', n:E('Suelos arcillosos o mal drenados: encharcamiento y asfixia de raíces','Clay or poorly drained soils: waterlogging and root asphyxia'), f:'Mojica-Zárate et al., 2026'}
];
const NIVEL_R = r=> r<=4?{n:E('Bajo','Low'),c:'#3f9b5f'} : r<=9?{n:E('Medio','Medium'),c:'#d9b13a'} : r<=15?{n:E('Alto','High'),c:'#e0803a'} : {n:E('Muy alto','Very high'),c:'#c43a2f'};
const CLASE_RG = v=> v<0.16?{n:E('Bajo','Low'),c:'ok'} : v<0.36?{n:E('Medio','Medium'),c:'warn'} : v<0.6?{n:E('Alto','High'),c:'bad'} : {n:E('Muy alto','Very high'),c:'bad'};
/* Capacidad adaptativa: por ahora solo la regeneración; los subindicadores de Sarandón se suman con el bloque de Sostenibilidad */
function capacidadAdaptativa(rg){ const parts=rg.IR!=null?[{n:E('Regeneración','Regeneration'), v:rg.IR}]:[];
  if(typeof sarandonCA==='function') parts.push(...sarandonCA());
  return {CA:parts.length?parts.reduce((t,x)=>t+x.v,0)/parts.length:0, parts, sinDato:!parts.length}; }
function riesgos(opt={}){ const U=S.riesgo||{}, rg=opt.rg||regeneracion(), cap=capacidadAdaptativa(rg), dP=opt.dClima||0;
  const L=RIESGOS.map(d=>{ const u=U[d.id]||{}, off=u.off===true, conf=off||(u.p!=null&&u.i!=null), p0=u.p!=null?+u.p:3, i=u.i!=null?+u.i:3, ctl=u.c!=null?+u.c:0;
    const p=d.cat==='clima'?Math.min(5,p0+dP):p0, r=p*i*(1-0.4*cap.CA)*(1-0.15*ctl), ev=EVID[d.id]?EVID[d.id]():null;
    return {...d, p, i, ctl, off, r, nivel:NIVEL_R(r), conf, ev}; });
  const act=L.filter(x=>!x.off&&x.conf), idx=act.length?act.reduce((t,x)=>t+x.r,0)/(25*act.length):null, nConf=L.filter(x=>x.conf).length;
  const porCat=Object.keys(CAT_R).map(k=>{ const l=act.filter(x=>x.cat===k); return {k, v:l.length?l.reduce((t,x)=>t+x.r,0)/(25*l.length):null, n:l.length}; });
  return {L, act, idx, nConf, porCat, CA:cap.CA, sinCA:cap.sinDato, partsCA:cap.parts, top:[...act].sort((a,b)=>b.r-a.r)}; }

/* ---------------- Gráficas ---------------- */
function matrizRiesgo(rs, opt={}){ const c=opt.celda||64, L=86, Tp=16, W=L+5*c+20, H=Tp+5*c+56;
  let s=`<svg class="chart matriz-r" viewBox="0 0 ${W} ${H}" role="img" aria-label="${T('Matriz de probabilidad e impacto','Likelihood and impact matrix')}">`;
  for(let p=1;p<=5;p++) for(let i=1;i<=5;i++){ const x=L+(i-1)*c, y=Tp+(5-p)*c, nv=NIVEL_R(p*i); s+=`<rect x="${x}" y="${y}" width="${c-3}" height="${c-3}" rx="6" fill="${nv.c}" fill-opacity=".22" stroke="${nv.c}" stroke-opacity=".5"/>`; }
  const celdas={}; rs.act.forEach(x=>{ const k=Math.round(x.p)+'-'+x.i; (celdas[k]=celdas[k]||[]).push(x); });
  Object.entries(celdas).forEach(([k,l])=>{ const [p,i]=k.split('-').map(Number), x=L+(i-1)*c+(c-3)/2, y=Tp+(5-p)*c+(c-3)/2;
    s+=`<circle cx="${x}" cy="${y}" r="${12+Math.min(10,l.length*2)}" fill="${NIVEL_R(p*i).c}" data-tip="${esc(l.map(z=>tx(z.n)).join(' · '))}"/><text x="${x}" y="${y+4.5}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${l.length}</text>`; });
  for(let p=1;p<=5;p++) s+=`<text x="${L-8}" y="${Tp+(5-p)*c+c/2}" text-anchor="end" font-size="11.5" class="m">${p} · ${esc(tx(NIVEL15[p]))}</text>`;
  for(let i=1;i<=5;i++) s+=`<text x="${L+(i-1)*c+c/2-1}" y="${Tp+5*c+14}" text-anchor="middle" font-size="11.5" class="m">${i}</text>`;
  s+=`<text x="${L+2.5*c}" y="${H-8}" text-anchor="middle" font-size="12" font-weight="700">${T('Impacto','Impact')} →</text><text x="14" y="${Tp+2.5*c}" text-anchor="middle" font-size="12" font-weight="700" transform="rotate(-90 14 ${Tp+2.5*c})">${T('Probabilidad','Likelihood')} →</text>`;
  return s+'</svg>'; }
const radarRegen = rg => radar(rg.ind.map(x=>(x.s??0)/4), rg.ind.map(x=>tx(x.pr)), rg.ind.map(x=>x.col), {w:440});
function medidorIR(v, etq){ if(v==null) return `<svg class="chart medidor" viewBox="0 0 260 186" role="img"><path d="M30,130 A100,100 0 0 1 230,130" stroke="var(--border)" stroke-width="18" fill="none" stroke-dasharray="6 6"/><text x="130" y="150" text-anchor="middle" font-size="28" font-weight="700" class="m">—</text><text x="130" y="176" text-anchor="middle" font-size="11.5" class="m">${esc(T('sin dato','no data'))}</text></svg>`;
  const C=130, R=100, a0=Math.PI, ang=a0-Math.PI*Math.max(0,Math.min(1,v)), x=C+0.78*R*Math.cos(ang), y=130-0.78*R*Math.sin(ang);
  const arco=(f0,f1,col)=>{ const s0=a0-Math.PI*f0, s1=a0-Math.PI*f1; return `<path d="M${C+R*Math.cos(s0)},${130-R*Math.sin(s0)} A${R},${R} 0 0 1 ${C+R*Math.cos(s1)},${130-R*Math.sin(s1)}" stroke="${col}" stroke-width="18" fill="none"/>`; };
  return `<svg class="chart medidor" viewBox="0 0 260 186" role="img">${arco(0,.25,'#c43a2f')}${arco(.25,.5,'#e0a33a')}${arco(.5,.75,'#7fb35a')}${arco(.75,1,'#2f8f6a')}
    <line x1="${C}" y1="130" x2="${x}" y2="${y}" stroke="var(--text)" stroke-width="3.5" stroke-linecap="round"/><circle cx="${C}" cy="130" r="7" fill="var(--text)"/>
    <text x="${C}" y="166" text-anchor="middle" font-size="28" font-weight="700">${fmt(100*v,0)}</text><text x="${C}" y="182" text-anchor="middle" font-size="11.5" class="m">${esc(etq)}</text><text x="22" y="148" text-anchor="middle" font-size="11" class="m">0</text><text x="238" y="148" text-anchor="middle" font-size="11" class="m">100</text></svg>`; }

/* ---------------- Bloque 12 · Regeneración y resiliencia ---------------- */
function renderRegen(el){ const rg=regeneracion(), rz=resiliencia(), v=RED.valores(), U=unidades(), den=densidad(), fC=num(S.bio.fC);
  const msT=(u,k)=>{ const o=((S.bio.ms||{})[u]||{})[k]||{}; const l=Object.values(o).map(num).filter(x=>x!=null); return l.length?l.reduce((a,b)=>a+b,0):null; };
  const co2=U.map(u=>{ const c=CAMPO.carbono(msT(u.id,'ini'), msT(u.id,'fin'), fC); return {u, ha:c&&den?c.co2*den/1e6:null}; }).filter(x=>x.ha!=null);
  const perilla=x=>`<div class="perilla ${x.conf?'confirmada':'sin-confirmar'}" style="--pc:${x.col}"><div class="row between"><b>${esc(tx(x.n))}</b><span class="pv">${x.s==null?'—':x.s+' · '+esc(tx(NIVEL04[x.s]))}</span></div>
    <span class="estado-p">${x.conf?'✓ '+T('Tu respuesta','Your answer'):T('Sin responder: mueve la perilla','Not answered: move the knob')}</span>
    <input type="range" min="0" max="4" step="1" value="${x.s??2}" data-regen="${x.id}" aria-label="${esc(tx(x.n))}">
    <div class="marcas"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span></div>
    <p class="nota">${esc(tx(x.q))}</p>${x.conf?`<button type="button" class="btn sm ghost" data-regen-reset="${x.id}">${T('Quitar mi respuesta','Clear my answer')}</button>`:''}</div>`;
  const ep=rz?rz.ep:[], mo=rg.mo, dMO=mo.b!=null&&mo.a!=null&&mo.b!==''&&mo.a!==''?(+mo.a)-(+mo.b):null;
  el.innerHTML=`${cabecera('regen',T('¿Tu viñedo se regenera o se desgasta con cada ciclo, y qué tan rápido se recupera de un golpe de sequía? Arriba, siete perillas que respondes tú; abajo, la resiliencia medida día a día con el balance de agua del Bloque 4.','Does your vineyard regenerate or wear out each cycle, and how fast does it recover from a drought spell? Above, seven knobs you answer; below, resilience measured day by day with the Block 4 water balance.'))}
  ${consejo(T('Mueve cada perilla como si ajustaras el volumen: 0 es nada, 4 es lo máximo. Guarda una línea base hoy y vuelve el próximo ciclo para ver si tu viñedo se regenera.','Move each knob like a volume control: 0 is nothing, 4 is the maximum. Save a baseline today and come back next cycle to see whether your vineyard is regenerating.'),
    T('Siete indicadores ordinales 0–4 sobre los principios de salud del suelo (USDA-NRCS) y las definiciones de agricultura regenerativa por procesos y resultados (Newton et al., 2020; Schreefel et al., 2020). IR = Σs/(4n) con las perillas respondidas. Resiliencia hídrica sobre el balance diario FAO-56: episodios Ks < 1 (Ec. 84), autonomía (RAW − Dr)/ETc y freno Σ Kcb·ET₀·(1 − Ks).','Seven ordinal 0–4 indicators based on soil health principles (USDA-NRCS) and process- and outcome-based definitions of regenerative agriculture (Newton et al., 2020; Schreefel et al., 2020). IR = Σs/(4n) over answered knobs. Water resilience from the daily FAO-56 balance: Ks < 1 episodes (Eq. 84), autonomy (RAW − Dr)/ETc and brake Σ Kcb·ET₀·(1 − Ks).'))}
  <div class="card concepto-ra"><h3>${T('¿Qué es la agricultura regenerativa?','What is regenerative agriculture?')}</h3>
    <p>${T('Un viñedo regenerativo no solo se mantiene: con cada ciclo mejora el suelo, el agua y la biodiversidad de los que depende. Sus definiciones combinan dos cosas: los <b>procesos</b> (lo que haces) y los <b>resultados</b> (lo que cambia en tu parcela) (Newton et al., 2020); y su base es el suelo (Schreefel et al., 2020).','A regenerative vineyard does not just maintain itself: each cycle it improves the soil, water and biodiversity it depends on. Its definitions combine two things: <b>processes</b> (what you do) and <b>outcomes</b> (what changes in your plot) (Newton et al., 2020); and its base is the soil (Schreefel et al., 2020).')}</p>
    <div class="grid g2"><div><b>1 · ${T('Procesos','Processes')}</b><br><span class="nota">${T('Mínima perturbación, suelo cubierto, diversidad y raíces vivas (los principios de salud del suelo del USDA-NRCS), más integración animal, menos insumos de síntesis y devolución de materia orgánica. Los calificas tú con siete perillas.','Minimal disturbance, soil cover, diversity and living roots (the USDA-NRCS soil health principles), plus livestock integration, fewer synthetic inputs and returning organic matter. You rate them with seven knobs.')}</span></div>
    <div><b>2 · ${T('Resultados','Outcomes')}</b><br><span class="nota">${T('Más materia orgánica y carbono en el sistema, y un mejor ciclo del agua. Ratio Vitis los mide con tus datos: análisis de suelo, biomasa (Bloque 6) y balance de agua diario (Bloque 4).','More organic matter and carbon in the system, and a better water cycle. Ratio Vitis measures them with your data: soil tests, biomass (Block 6) and daily water balance (Block 4).')}</span></div></div></div>
  <div class="grid g2"><div class="card" style="text-align:center"><h3>${T('Índice de procesos regenerativos','Regenerative process index')}${ayuda('regen')}</h3>${medidorIR(rg.IR, tx(rg.clase.n))}
     <p><span class="badge ${rg.clase.c}" style="font-size:14px">${esc(tx(rg.clase.n))}</span>${rg.provisional&&rg.IR!=null?` <span class="badge provisional">${T(`${rg.nConf} de 7 perillas`,`${rg.nConf} of 7 knobs`)}</span>`:''}</p>
     ${rg.dIR!=null?`<p>${T('Cambio frente a la línea base','Change from baseline')} (${esc(rg.base.fecha)}): <b style="color:var(--${rg.dIR>=0?'ok':'bad'}-text)">${rg.dIR>=0?'+':''}${fmt(100*rg.dIR,0)}</b></p>`:''}
     <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap"><button class="btn sm" id="rgBase">${rg.base?T('Actualizar línea base','Update baseline'):T('Guardar como línea base','Save as baseline')}</button>${rg.base?`<button class="btn ghost sm" id="rgBaseX">${T('Quitar línea base','Remove baseline')}</button>`:''}</div>
     <p class="nota">${T('Clases (lectura de Ratio Viña): < 25 degradante · 25–49 convencional · 50–74 en transición regenerativa · ≥ 75 regenerativo.','Classes (Ratio Viña reading): < 25 degrading · 25–49 conventional · 50–74 regenerative transition · ≥ 75 regenerative.')}</p></div>
   <div class="card"><h3>${T('Perfil de regeneración','Regeneration profile')}</h3>${radarRegen(rg)}</div></div>
  <div class="card"><h3>1 · ${T('Procesos regenerativos: las siete prácticas','Regenerative processes: the seven practices')}</h3><div class="perillas">${rg.ind.map(perilla).join('')}</div></div>
  <div class="card"><h3>2 · ${T('Resultados regenerativos medidos','Measured regenerative outcomes')}</h3><p class="nota">${T('Un proceso solo es regenerativo si se nota en el resultado. Guarda tus números de cada ciclo para ver la trayectoria.','A process is only regenerative if it shows in the outcome. Keep each cycle’s numbers to see the trajectory.')}</p><div class="grid g3">
    <div><h4>${T('Materia orgánica del suelo','Soil organic matter')}</h4><div class="grid g2"><label class="f"><span>${T('% MO línea base','% SOM baseline')}</span><input type="number" step="0.1" min="0" id="moB" value="${esc(mo.b??'')}"></label><label class="f"><span>${T('% MO actual','Current % SOM')}</span><input type="number" step="0.1" min="0" id="moA" value="${esc(mo.a??'')}"></label></div>
      ${dMO!=null?`<p>${T('Cambio','Change')}: <b style="color:var(--${dMO>=0?'ok':'bad'}-text)">${dMO>=0?'+':''}${fmt(dMO,2)}</b> ${T('puntos','points')}</p>`:`<p class="nota">${T('Dos análisis de suelo (antes y ahora) son la prueba más directa de regeneración.','Two soil tests (before and now) are the most direct proof of regeneration.')}</p>`}</div>
    <div><h4>${T('CO₂ fijado en la biomasa','CO₂ fixed in biomass')}</h4>${co2.length?co2.map(x=>`<p style="margin:.2em 0">${esc(x.u.n)}: <b>${fmt(x.ha,2)}</b> t CO₂ ha⁻¹</p>`).join('')+`<p class="nota">${T('Del Bloque 6: ΔMS · fC · 44/12.','From Block 6: ΔDM · fC · 44/12.')}</p>`:`<p class="sindato">${T('Captura la materia seca inicial y final y la fracción de carbono en el','Enter initial and final dry matter and carbon fraction in')} <a href="#bio" data-ir="bio">${T('Bloque 6','Block 6')}</a>.</p>`}</div>
    <div><h4>${T('Ciclo del agua: agua productiva','Water cycle: productive water')}</h4>${rz&&rz.r.fracE!=null?`<p><b>${fmt(100*(1-rz.r.fracE),0)} %</b> ${T('de la evapotranspiración pasó por la vid','of evapotranspiration went through the vine')}</p><p><b>${fmt(rz.r.tot.DP,0)} mm</b> ${T('se perdieron por debajo de la raíz','were lost below the root zone')}</p>`:`<p class="sindato">${T('Necesita el balance del','Needs the balance from')} <a href="#raspa" data-ir="raspa">${T('Bloque 4','Block 4')}</a>.</p>`}</div></div></div>
  <div class="card"><h3>${T('Resiliencia hídrica: cómo absorbe un golpe de sequía y se recupera','Water resilience: how it absorbs a drought spell and recovers')}${ayuda('resil')}</h3>
    ${rz?`<div class="kpis">
      <div class="kpi"><div class="l">${T('Tamaño del tanque (ADT)','Tank size (TAW)')}</div><div class="v">${fmt(rz.TAW,0)} mm</div><div class="s">${T('fácilmente aprovechable','readily available')} ${fmt(rz.RAW,0)} mm</div></div>
      <div class="kpi"><div class="l">${T('Episodios de estrés','Stress episodes')}</div><div class="v">${ep.length}</div><div class="s">${ep.length?T('medio','mean')+' '+fmt(rz.medio,1)+' · '+T('más largo','longest')+' '+rz.largo+' '+T('días','days'):''}</div></div>
      <div class="kpi"><div class="l">${T('¿Qué los terminó?','What ended them?')}</div><div class="v">${rz.porRiego} · ${rz.porLluvia}</div><div class="s">${T('riego · lluvia','irrigation · rain')}${rz.abierto?' · '+T('uno sigue abierto','one still open'):''}</div></div>
      <div class="kpi"><div class="l">${T('Autonomía hoy','Autonomy today')}</div><div class="v">${rz.autonomia!=null?fmt(rz.autonomia,1)+' '+T('días','days'):'—'}</div><div class="s">${T('antes del estrés sin lluvia ni riego','before stress without rain or irrigation')}</div></div>
      <div class="kpi"><div class="l">${T('Freno de la vid','Vine brake')}</div><div class="v">${fmt(rz.freno,0)} mm</div><div class="s">${rz.Tpot>0?fmt(100*rz.freno/rz.Tpot,0)+' % '+T('de la transpiración posible','of possible transpiration'):''}</div></div></div>
      ${lineaKs(rz)}
      <p class="nota">${T('La línea es el coeficiente de estrés hídrico de cada día (1 = sin estrés). Las franjas son los episodios con Ks < 1; pasa el cursor para ver cuánto duraron y qué los terminó. El «freno» es la transpiración que la vid dejó de gastar al cerrar estomas: el lazo que se compensa del Recorrido, medido en milímetros.','The line is each day’s water-stress coefficient (1 = no stress). Bands are episodes with Ks < 1; hover to see how long they lasted and what ended them. The «brake» is the transpiration the vine saved by closing stomata: the balancing loop of the Walk-through, measured in millimetres.')}</p>`
      :`<p class="sindato">${T('Necesita el balance de agua del','Needs the water balance from')} <a href="#raspa" data-ir="raspa">${T('Bloque 4','Block 4')}</a>.</p>`}</div>
  ${siguiente('regen')}`;
  $$('[data-regen]',el).forEach(i=>i.oninput=()=>{ i.closest('.perilla').querySelector('.pv').textContent=i.value+' · '+tx(NIVEL04[+i.value]); });
  $$('[data-regen]',el).forEach(i=>i.onchange=()=>{ S.regen=S.regen||{}; S.regen[i.dataset.regen]=+i.value; guardar(); render(); });
  $$('[data-regen-reset]',el).forEach(b=>b.onclick=()=>{ delete S.regen[b.dataset.regenReset]; guardar(); render(); });
  $('#rgBase',el).onclick=()=>{ if(rg.IR==null) return toast(T('Primero responde las perillas','First answer the knobs')); S.regenBase={fecha:new Date().toISOString().slice(0,10), IR:rg.IR, ind:rg.ind.map(x=>({id:x.id,s:x.s}))}; guardar(); render(); toast(T('Línea base guardada','Baseline saved')); };
  if($('#rgBaseX',el)) $('#rgBaseX',el).onclick=()=>{ if(confirm(T('¿Quitar la línea base?','Remove the baseline?'))){ S.regenBase=null; guardar(); render(); } };
  ['moB','moA'].forEach(k=>$('#'+k,el).onchange=e=>{ S.regenMO=S.regenMO||{}; S.regenMO[k==='moB'?'b':'a']=e.target.value; guardar(); render(); });
  enlazarTips(el); }

/* ---------------- Bloque 13 · Riesgos ---------------- */
function renderRiesgos(el){ const rs=riesgos(), cls=rs.idx!=null?CLASE_RG(rs.idx):SIN_DATO_CL, filtro=renderRiesgos.cat||'todos';
  const fila=x=>`<tr class="${x.off?'r-off':''} ${x.conf?'r-conf':'r-sinconf'}"><td><input type="checkbox" data-roff="${x.id}" ${x.off?'':'checked'} aria-label="${T('Aplica','Applies')}"></td>
    <td><span class="punto" style="background:${CAT_R[x.cat].col}"></span>${esc(tx(x.n))}${x.f?` <small class="muted">(${esc(tx(x.f))})</small>`:''} ${x.off?'':x.conf?`<span class="estado-p ok">✓ ${T('respondido','answered')}</span>`:`<span class="estado-p">${T('sin responder','not answered')}</span>`}
      ${x.ev?`<small class="muted">◆ ${T('Tus datos','Your data')}: ${esc(x.ev)}</small>`:''}</td>
    <td class="perilla-c"><input type="range" min="1" max="5" step="1" value="${Math.round(x.p)}" data-rp="${x.id}" ${x.off?'disabled':''}><small>${Math.round(x.p)} · ${esc(tx(NIVEL15[Math.round(x.p)]))}</small></td>
    <td class="perilla-c"><input type="range" min="1" max="5" step="1" value="${x.i}" data-ri="${x.id}" ${x.off?'disabled':''}><small>${x.i} · ${esc(tx(NIVEL15[x.i]))}</small></td>
    <td class="perilla-c"><input type="range" min="0" max="3" step="1" value="${x.ctl}" data-rc="${x.id}" ${x.off?'disabled':''}><small>${[T('ninguno','none'),T('bajo','low'),T('medio','medium'),T('alto','high')][x.ctl]}</small></td>
    <td class="r">${x.conf&&!x.off?`<b style="color:${x.nivel.c}">${fmt(x.r,1)}</b><br><small>${esc(tx(x.nivel.n))}</small>`:'—'}</td></tr>`;
  const lista=rs.L.filter(x=>filtro==='todos'||x.cat===filtro);
  el.innerHTML=`${cabecera('riesgos',T('¿Qué puede salir mal en tu viñedo y qué tan grave sería? Cada amenaza se mide con dos perillas: qué tan probable es (1 a 5) y cuánto daño haría (1 a 5). Junto a cada una ves lo que dicen tus propios datos, para que la calificación no sea a ciegas.','What could go wrong in your vineyard and how serious would it be? Each hazard is measured with two knobs: how likely it is (1 to 5) and how much damage it would do (1 to 5). Beside each one you see what your own data say, so the rating is not blind.'))}
  ${consejo(T('Empieza por los riesgos que ya viviste. Si uno no aplica, desmárcalo. La tercera perilla es el control que ya tienes (malla antigranizo, seguro, pozo propio, venta anticipada…). Solo cuentan los riesgos que respondes.','Start with risks you have already lived through. If one does not apply, untick it. The third knob is the control you already have (hail net, insurance, own well, forward sale…). Only the risks you answer count.'),
    T('Matriz de probabilidad × impacto 5 × 5 (IEC 31010:2019; ISO 31000:2018) en el marco de riesgo del IPCC (2014): amenaza, exposición y vulnerabilidad. r = P·I·(1 − 0.4·CA)·(1 − 0.15·control); índice = media de r / 25 de los riesgos respondidos. Los factores 0.4 y 0.15 son supuestos de Ratio Viña. La evidencia (◆) son conteos y máximos de tus datos, sin umbrales nuevos.','5 × 5 likelihood × impact matrix (IEC 31010:2019; ISO 31000:2018) within the IPCC (2014) risk framework: hazard, exposure and vulnerability. r = P·I·(1 − 0.4·CA)·(1 − 0.15·control); index = mean r / 25 over answered risks. Factors 0.4 and 0.15 are Ratio Viña assumptions. Evidence (◆) is counts and maxima from your data, with no new thresholds.'))}
  <div class="kpis"><div class="kpi" style="border-top:4px solid var(--${cls.c}-text,var(--border))"><div class="l">${T('Índice de riesgo','Risk index')}${ayuda('riesgo')}</div><div class="v">${rs.idx!=null?fmt(100*rs.idx,0):'—'}</div><div class="s"><span class="badge ${cls.c}">${esc(tx(cls.n))}</span> ${T('de 0 a 100','from 0 to 100')}</div></div>
   <div class="kpi"><div class="l">${T('Capacidad adaptativa','Adaptive capacity')}${ayuda('CA')}</div><div class="v">${rs.sinCA?'—':fmt(100*rs.CA,0)}</div><div class="s">${rs.sinCA?T('responde la regeneración (Bloque 12)','answer regeneration (Block 12)'):rs.partsCA.map(p=>esc(tx(p.n))+' '+fmt(100*p.v,0)).join(' · ')}</div></div>
   <div class="kpi"><div class="l">${T('Respondidos','Answered')}</div><div class="v">${rs.nConf} / ${rs.L.length}</div><div class="s">${rs.act.filter(x=>x.r>9).length} ${T('altos o muy altos','high or very high')}</div></div>
   <div class="kpi"><div class="l">${T('Mayor riesgo','Highest risk')}</div><div class="v" style="font-size:18px">${rs.top[0]?esc(tx(rs.top[0].n)):'—'}</div><div class="s">${rs.top[0]?fmt(rs.top[0].r,1)+' / 25':''}</div></div></div>
  <div class="grid g2"><div class="card"><h3>${T('Matriz de riesgos','Risk matrix')}</h3>${matrizRiesgo(rs)}<p class="nota">${T('Cada círculo indica cuántos riesgos respondidos caen en esa celda; pasa el cursor para ver cuáles.','Each circle shows how many answered risks fall in that cell; hover to see which.')}</p></div>
   <div class="card"><h3>${T('Riesgo por categoría','Risk by category')}</h3>${rs.act.length?barrasH(rs.porCat.filter(c=>c.v!=null).map(c=>({l:tx(CAT_R[c.k].n), v:100*c.v, c:CAT_R[c.k].col, vl:fmt(100*c.v,0)})),{max:100, izq:170})
     +`<h4 style="margin:10px 0 4px">${T('Los cinco riesgos mayores','The five highest risks')}</h4><ol>${rs.top.slice(0,5).map(x=>`<li>${esc(tx(x.n))} <b style="color:${x.nivel.c}">${fmt(x.r,1)}</b></li>`).join('')}</ol>`:`<p class="sindato">${T('Responde al menos un riesgo.','Answer at least one risk.')}</p>`}</div></div>
  <div class="card"><div class="row between"><h3 style="margin:0">${T('Perillas de cada riesgo','Knobs for each risk')}</h3><div class="basesw">${[['todos',T('Todos','All')],...Object.entries(CAT_R).map(([k,c])=>[k,tx(c.n)])].map(([k,n])=>`<button data-rcat="${k}" class="${k===filtro?'on':''}">${esc(n)}</button>`).join('')}</div></div>
   <div class="tbl-c"><table class="tbl riesgos-t"><thead><tr><th>${T('Aplica','Applies')}</th><th>${T('Riesgo','Risk')}</th><th>${T('Probabilidad','Likelihood')}</th><th>${T('Impacto','Impact')}</th><th>${T('Control','Control')}</th><th class="r">${T('Riesgo','Risk')} /25</th></tr></thead><tbody>${lista.map(fila).join('')}</tbody></table></div>
   <div class="row" style="gap:8px;margin-top:8px"><button class="btn ghost sm" id="rReset">${T('Borrar mis respuestas','Clear my answers')}</button></div></div>
  ${siguiente('riesgos')}`;
  // mover una perilla de un riesgo lo da por respondido con las otras dos tal como se ven
  const set=(id,k,val)=>{ S.riesgo=S.riesgo||{}; const u=S.riesgo[id]=S.riesgo[id]||{}, x=rs.L.find(y=>y.id===id); if(k!=='off'){ if(u.p==null) u.p=Math.round(x.p); if(u.i==null) u.i=x.i; } u[k]=val; guardar(); render(); };
  $$('[data-rp]',el).forEach(i=>i.onchange=()=>set(i.dataset.rp,'p',+i.value));
  $$('[data-ri]',el).forEach(i=>i.onchange=()=>set(i.dataset.ri,'i',+i.value));
  $$('[data-rc]',el).forEach(i=>i.onchange=()=>set(i.dataset.rc,'c',+i.value));
  $$('[data-roff]',el).forEach(i=>i.onchange=()=>set(i.dataset.roff,'off',!i.checked));
  $$('[data-rcat]',el).forEach(b=>b.onclick=()=>{ renderRiesgos.cat=b.dataset.rcat; render(); });
  $('#rReset',el).onclick=()=>{ if(confirm(T('¿Borrar tus respuestas en todos los riesgos?','Clear your answers on all risks?'))){ S.riesgo={}; guardar(); render(); } };
  enlazarTips(el); }

/* Tarjeta para el Tablero */
function tarjetaRegenRiesgo(){ const rg=regeneracion(), rs=riesgos({rg}), rz=resiliencia(), crg=rs.idx!=null?CLASE_RG(rs.idx):SIN_DATO_CL;
  return `<div class="card t12"><h3>${T('Regeneración, resiliencia y riesgo','Regeneration, resilience and risk')}</h3><div class="kpis" style="margin:8px 0">
    <div class="kpi" data-ir="regen" style="cursor:pointer"><div class="l">${T('Regeneración (Bloque 12)','Regeneration (Block 12)')}</div><div class="v">${rg.IR!=null?fmt(100*rg.IR,0):'—'}</div><div class="s"><span class="badge ${rg.clase.c}">${esc(tx(rg.clase.n))}</span></div></div>
    <div class="kpi" data-ir="regen" style="cursor:pointer"><div class="l">${T('Autonomía hídrica hoy','Water autonomy today')}</div><div class="v">${rz&&rz.autonomia!=null?fmt(rz.autonomia,1)+' '+T('días','days'):'—'}</div><div class="s">${rz?rz.ep.length+' '+T('episodios de estrés','stress episodes'):''}</div></div>
    <div class="kpi" data-ir="riesgos" style="cursor:pointer"><div class="l">${T('Riesgo (Bloque 13)','Risk (Block 13)')}</div><div class="v">${rs.idx!=null?fmt(100*rs.idx,0):'—'}</div><div class="s"><span class="badge ${crg.c}">${esc(tx(crg.n))}</span> · ${rs.nConf} ${T('respondidos','answered')}</div></div>
    <div class="kpi"><div class="l">${T('Capacidad adaptativa','Adaptive capacity')}</div><div class="v">${rs.sinCA?'—':fmt(100*rs.CA,0)}</div><div class="s">0–100</div></div></div>
    ${rg.IR!=null||rs.act.length?`<div class="grid g2"><div>${rg.IR!=null?radarRegen(rg):''}</div><div>${rs.act.length?matrizRiesgo(rs,{celda:54}):''}</div></div>`:''}</div>`; }
