"use strict";
/* =====================================================================
   6b. GRÁFICAS DEL SISTEMA (mapa con localidad, red ponderada, calor, modelo, ODS)
   ===================================================================== */
const REG_BX = {N:{n:E('Norte','North'),col:'#b05434'}, CN:{n:E('Centro norte','Centre-north'),col:'#c27c0e'}, C:{n:E('Centro','Centre'),col:'#2f7d8a'}, S:{n:E('Sur','South'),col:'#5f8f3e'}};
const edoDe = (c)=> TERR.estados.find(e=>e[0]===c);
const EDO_VACIO = ['', '—', '', '', null, ''];   // estado sin elegir
const isoA = (c)=> (edoDe(c)||[])[5];
const proyecta = (lon,lat)=> [PROY.a*(lon+102)*Math.pow(Math.cos(lat*Math.PI/180),PROY.k)+PROY.b, PROY.c*lat+PROY.d];

/* Mapa real de México (contornos Natural Earth, dominio público) con la región, el estado y la localidad */
function mapaTelar(edoSel, punto){
  const W=MAPA_MX.w, H=MAPA_MX.h, regDe=Object.fromEntries(TERR.estados.map(e=>[e[5],e[3]])), cveDe=Object.fromEntries(TERR.estados.map(e=>[e[5],e[0]]));
  const selIso=isoA(edoSel), selReg=(edoDe(edoSel)||[])[3];
  let s=`<svg class="mapa" viewBox="0 0 ${W} ${H}" role="img" aria-label="${T('Mapa de México','Map of Mexico')}">`;
  s+=Object.entries(MAPA_MX.edo).map(([k,d])=>{ const rg=regDe[k], R=REG_BX[rg]||{col:'#ccc'};
    return `<path d="${d}" data-edo="${cveDe[k]}" class="edo ${rg===selReg?'sel':''} ${k===selIso?'edosel':''}" style="--rc:${R.col}"><title>${esc((edoDe(cveDe[k])||[])[1]||k)} · ${esc(tx(R.n))}</title></path>`; }).join('');
  if(punto && punto[0]!=null){ const [x,y]=proyecta(punto[0],punto[1]);
    s+=`<g class="pin" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="16" class="onda"/><circle r="16" class="onda d2"/><circle r="6.5" fill="var(--accent)" stroke="#fff" stroke-width="2.5"/></g>`; }
  return s+'</svg>'; }

/* Red del sistema: disposición por fuerzas, nodos por categoría, grosor por peso */
function redSistema(st, opt={}){
  const W=opt.w||900, H=opt.h||600, n=st.nodos.length; if(!n) return `<div class="empty"><p>${T('Sin elementos en interacción todavía.','No interacting elements yet.')}</p></div>`;
  const idx=new Map(st.nodos.map((d,i)=>[d.id,i])); const cats=Object.keys(CATS);
  // posición inicial: categorías en sectores para una disposición legible y determinista
  const P=st.nodos.map((d,i)=>{ const c=cats.indexOf(d.cat), a=2*Math.PI*(c+0.5)/cats.length+((i%7)-3)*0.06; const r=Math.min(W,H)*(0.22+0.06*((i*37)%5)/4); return {x:W/2+Math.cos(a)*r*1.35, y:H/2+Math.sin(a)*r}; });
  const wmax=Math.max(...st.aristas.map(e=>e.w),1e-9), k=Math.sqrt(W*H/n)*0.55;
  for(let it=0;it<320;it++){ const F=P.map(()=>({x:0,y:0})), temp=10*(1-it/320)+0.3;
    for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){ const dx=P[i].x-P[j].x, dy=P[i].y-P[j].y, d=Math.max(2,Math.hypot(dx,dy)), f=k*k/d; F[i].x+=dx/d*f; F[i].y+=dy/d*f; F[j].x-=dx/d*f; F[j].y-=dy/d*f; }
    st.aristas.forEach(e=>{ const i=idx.get(e.a), j=idx.get(e.b); const dx=P[i].x-P[j].x, dy=P[i].y-P[j].y, d=Math.max(2,Math.hypot(dx,dy)), f=d*d/k*0.16*(0.35+e.w/wmax); F[i].x-=dx/d*f; F[i].y-=dy/d*f; F[j].x+=dx/d*f; F[j].y+=dy/d*f; });
    P.forEach((p,i)=>{ const m=Math.hypot(F[i].x,F[i].y)||1; p.x+=F[i].x/m*Math.min(m,temp*3); p.y+=F[i].y/m*Math.min(m,temp*3); p.x+=(W/2-p.x)*0.015; p.y+=(H/2-p.y)*0.015; p.x=Math.max(26,Math.min(W-26,p.x)); p.y=Math.max(22,Math.min(H-22,p.y)); }); }
  { const xs=P.map(p=>p.x), ys=P.map(p=>p.y), x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys), mg=40;
    P.forEach(p=>{ p.x=mg+(p.x-x0)/((x1-x0)||1)*(W-2*mg); p.y=mg-6+(p.y-y0)/((y1-y0)||1)*(H-2*mg); }); }
  const clave=opt.clave||'grado', mx=Math.max(...st.nodos.map(d=>d[clave]),1e-9), foco=opt.foco||null;
  const vecinos=new Set(); if(foco) st.aristas.forEach(e=>{ if(e.a===foco) vecinos.add(e.b); if(e.b===foco) vecinos.add(e.a); });
  const top=new Set([...st.nodos].sort((a,b)=>b[clave]-a[clave]).slice(0,opt.etiquetas||14).map(d=>d.id));
  let s=`<svg class="chart red" viewBox="0 0 ${W} ${H}" role="img">`;
  st.aristas.forEach((e,q)=>{ const i=idx.get(e.a), j=idx.get(e.b); const on=!foco||e.a===foco||e.b===foco;
    s+=`<line x1="${P[i].x.toFixed(1)}" y1="${P[i].y.toFixed(1)}" x2="${P[j].x.toFixed(1)}" y2="${P[j].y.toFixed(1)}" stroke="${on&&foco?'var(--accent)':'var(--border-strong)'}" stroke-width="${(0.4+3.6*e.w/wmax).toFixed(2)}" opacity="${on?(foco?.9:.45):.06}" class="arista" style="animation-delay:${(q%60)*8}ms" data-tip="${esc('<b>'+nombreEl(e.a)+' — '+nombreEl(e.b)+'</b><br>'+T('Peso','Weight')+': '+f1(e.w,2)+'<br>'+e.n+' '+T('actividades en común','shared activities'))}"/>`; });
  st.nodos.forEach((d,i)=>{ const r=6+18*Math.sqrt(d[clave]/mx); const on=!foco||d.id===foco||vecinos.has(d.id);
    const t=`<b>${esc(d.nombre)}</b><br>${esc(tx(CATS[d.cat].n))}<br>${T('Grado ponderado','Weighted degree')}: ${f1(d.grado,2)}<br>${T('Intermediación','Betweenness')}: ${f1(d.inter,1)}<br>${T('Vector propio','Eigenvector')}: ${f1(d.eig,2)}<br>${T('Participa en','Takes part in')} ${d.part} ${T('actividades','activities')}`;
    s+=`<g class="nodo" data-nodo="${esc(d.id)}" data-tip="${esc(t)}" opacity="${on?1:.15}" style="animation-delay:${i*14}ms"><circle cx="${P[i].x.toFixed(1)}" cy="${P[i].y.toFixed(1)}" r="${r.toFixed(1)}" fill="${d.col}" stroke="var(--card)" stroke-width="2"/>`+
      (top.has(d.id)||d.id===foco ? `<text x="${P[i].x.toFixed(1)}" y="${(P[i].y+r+12).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" class="halo">${esc(d.nombre.slice(0,26))}</text>` : '')+`</g>`; });
  return s+'</svg>'; }

/* Mapa de calor (matriz de correlación o de vínculos entre categorías) */
function calor(M, etq, opt={}){ const n=etq.length, c=opt.celda||34, L=opt.izq||190, Tp=opt.arriba||150, W=L+n*c+10, H=Tp+n*c+10;
  const mn=opt.min??-1, mx=opt.max??1; const col=(v)=>{ if(opt.seq){ const t=Math.max(0,Math.min(1,(v-mn)/(mx-mn||1))); return `rgba(var(--primary-rgb),${(0.06+0.9*t).toFixed(2)})`; }
    return v>=0 ? `rgba(var(--primary-rgb),${(0.06+0.9*Math.min(1,v)).toFixed(2)})` : `rgba(var(--accent-rgb),${(0.06+0.9*Math.min(1,-v)).toFixed(2)})`; };
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
  etq.forEach((e,i)=>{ s+=`<text x="${L-6}" y="${Tp+i*c+c/2+4}" text-anchor="end" font-size="11.5">${esc(e.slice(0,28))}</text><text transform="translate(${L+i*c+c/2+4} ${Tp-6}) rotate(-60)" font-size="11.5">${esc(e.slice(0,24))}</text>`; });
  M.forEach((r,i)=>r.forEach((v,j)=>{ s+=`<rect x="${L+j*c}" y="${Tp+i*c}" width="${c-2}" height="${c-2}" rx="4" fill="${col(v)}" data-tip="${esc('<b>'+etq[i]+'</b> · <b>'+etq[j]+'</b><br>'+(opt.etqV||'φ')+' = '+f1(v,2))}"/>`;
    if(c>=30) s+=`<text x="${L+j*c+c/2-1}" y="${Tp+i*c+c/2+3}" text-anchor="middle" font-size="9.5" class="m">${opt.seq?f1(v,1):f1(v,2)}</text>`; }));
  return s+'</svg>'; }

/* Histograma de la distribución de grados */
function histograma(vals, opt={}){ const W=opt.w||460, H=230, L=40, B=34; if(!vals.length) return ''; const mx=Math.max(...vals), cajas=Math.min(12,mx+1), ancho=(mx+1)/cajas;
  const c=new Array(cajas).fill(0); vals.forEach(v=>c[Math.min(cajas-1,Math.floor(v/ancho))]++); const cm=Math.max(...c,1), bw=(W-L-10)/cajas;
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img"><line class="ax" x1="${L}" y1="${H-B}" x2="${W-6}" y2="${H-B}"/>`;
  c.forEach((v,i)=>{ const h=(H-B-14)*v/cm; s+=`<rect class="creceV" x="${L+i*bw+2}" y="${H-B-h}" width="${bw-4}" height="${h}" rx="3" fill="var(--primary)" style="animation-delay:${i*40}ms" data-tip="${esc(T('Grado','Degree')+' '+f0(i*ancho)+'–'+f0((i+1)*ancho-1)+': '+v+' '+T('elementos','elements'))}"/>`+
    `<text x="${L+i*bw+bw/2}" y="${H-B+14}" text-anchor="middle" font-size="10.5" class="m">${f0(i*ancho)}</text>${v?`<text x="${L+i*bw+bw/2}" y="${H-B-h-4}" text-anchor="middle" font-size="10.5">${v}</text>`:''}`; });
  return s+`<text x="${(L+W)/2}" y="${H-4}" text-anchor="middle" font-size="12" class="m">${T('vecinos por elemento','neighbours per element')}</text></svg>`; }

/* Modelo esquemático del sistema complejo adaptativo (Bloque 10) */
function modeloSCA(R){ const W=980, H=560; const cnt=(c)=>R.nodos.filter(d=>d.cat===c).length;
  const caja=(x,y,w,h,col,tit,sub,cl='')=>`<g class="caja ${cl}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${col}" fill-opacity=".13" stroke="${col}" stroke-width="2"/><text x="${x+w/2}" y="${y+24}" text-anchor="middle" font-size="15" font-weight="700" style="fill:${col}">${esc(tit)}</text><text x="${x+w/2}" y="${y+44}" text-anchor="middle" font-size="12" class="m">${esc(sub)}</text></g>`;
  const fl=(d,col='var(--border-strong)',das='',cl='flujo')=>`<path d="${d}" fill="none" stroke="${col}" stroke-width="2.6" ${das?`stroke-dasharray="${das}"`:''} marker-end="url(#fl)" class="${cl}"/>`;
  let s=`<svg class="chart modelo" viewBox="0 0 ${W} ${H}" role="img"><defs><marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>`;
  s+=`<rect x="6" y="6" width="${W-12}" height="${H-12}" rx="22" fill="none" stroke="var(--border)" stroke-dasharray="6 6"/><text x="24" y="30" font-size="13" font-weight="700" class="m">${T('ENTORNO: clima y perturbaciones','ENVIRONMENT: climate and disturbances')} (${cnt('perturbaciones')})</text>`;
  s+=caja(40,60,200,70,CATS.naturales.col,T('Recursos naturales','Natural resources'),cnt('naturales')+' '+T('elementos','elements'));
  s+=caja(40,160,200,70,CATS.insumos.col,T('Insumos y equipo','Inputs and equipment'),(cnt('insumos')+cnt('equipo'))+' '+T('elementos','elements'));
  s+=caja(40,260,200,70,CATS.financieros.col,T('Recursos financieros','Financial resources'),cnt('financieros')+' '+T('elementos','elements'));
  s+=caja(370,50,240,80,CATS.actores.col,T('Agentes: actores','Agents: actors'),cnt('actores')+' '+T('grupos','groups')+' · '+T('deciden y aprenden','decide and learn'));
  s+=caja(370,150,240,80,CATS.conocimientos.col,T('Stack de conocimiento','Knowledge stack'),T('tácito · cultural · técnico · ambiental','tacit · cultural · technical · environmental'));
  s+=caja(330,260,320,110,'#2f5d50',T('Manejo: 5B → pasos → actividades','Management: 5B → steps → activities'),R.acts.length+' '+T('actividades activas','active activities')+' · '+R.acts.filter(a=>a.tipo==='inn').length+' '+T('innovadas','innovated'),'nucleo');
  s+=caja(740,60,200,70,CATS.instituciones.col,T('Instituciones','Institutions'),cnt('instituciones')+' '+T('vinculadas','linked'));
  s+=caja(740,160,200,70,CATS.politicas.col,T('Políticas y programas','Policies and programmes'),cnt('politicas')+' '+T('programas','programmes'));
  s+=caja(740,280,200,70,CATS.productos.col,T('Productos','Products'),T('grano · forraje · semilla','grain · fodder · seed'));
  s+=caja(740,400,200,70,'#2f8f4a',T('Mercado y bienestar','Market and well-being'),T('ingresos · ODS','income · SDGs'));
  s+=caja(330,410,320,90,'#7a4f9a',T('Emergencia y adaptación','Emergence and adaptation'),T('innovación local · resiliencia · sostenibilidad','local innovation · resilience · sustainability'));
  s+=fl('M240 95 C300 95 300 300 330 300')+fl('M240 195 C290 195 290 305 330 305')+fl('M240 295 C290 295 300 315 330 315')+fl('M490 130 V150')+fl('M490 230 V260')+fl('M740 95 C680 95 640 90 610 90')+fl('M740 195 C690 195 680 280 650 290')+fl('M650 315 H740')+fl('M840 350 V400')+fl('M490 370 V410');
  // retroalimentaciones
  s+=fl('M740 315 C700 520 120 540 140 330','var(--accent)','7 6','retro')+`<text x="420" y="532" font-size="12.5" font-weight="700" style="fill:var(--accent-text)">↺ ${T('poda → cosecha del año siguiente · sarmientos → suelo','pruning → next year’s crop · prunings → soil')}</text>`;
  s+=fl('M740 440 C620 470 260 460 140 330','var(--warn)','3 5','retro')+`<text x="300" y="486" font-size="12" style="fill:var(--warn-text)">↺ ${T('balance de resultados → decisiones del ciclo siguiente','results balance → next-cycle decisions')}</text>`;
  return s+'</svg>'; }

/* Rueda de los 17 ODS con su grado de cumplimiento */
function ruedaODS(cum){ const W=520, C=W/2, R0=90, R1=210; let s=`<svg class="chart" viewBox="0 0 ${W} ${W}" role="img">`;
  ODS.forEach(([o,es,en,col],i)=>{ const a0=-Math.PI/2+2*Math.PI*i/17+0.012, a1=-Math.PI/2+2*Math.PI*(i+1)/17-0.012, v=cum[o]&&cum[o].v!=null?cum[o].v/100:null;
    const arco=(r0,r1)=>`M${C+r0*Math.cos(a0)},${C+r0*Math.sin(a0)} L${C+r1*Math.cos(a0)},${C+r1*Math.sin(a0)} A${r1},${r1} 0 0 1 ${C+r1*Math.cos(a1)},${C+r1*Math.sin(a1)} L${C+r0*Math.cos(a1)},${C+r0*Math.sin(a1)} A${r0},${r0} 0 0 0 ${C+r0*Math.cos(a0)},${C+r0*Math.sin(a0)}Z`;
    s+=`<path d="${arco(R0,R1)}" fill="${col}" opacity=".16"/>`;
    if(v!=null) s+=`<path class="aparece" d="${arco(R0,R0+(R1-R0)*v)}" fill="${col}" style="animation-delay:${i*40}ms" data-tip="${esc('<b>ODS '+o+'</b> '+(LANG==='en'?en:es)+'<br>'+f0(v*100)+' %')}"/>`;
    const am=(a0+a1)/2; s+=`<text x="${C+(R1+16)*Math.cos(am)}" y="${C+(R1+16)*Math.sin(am)+4}" text-anchor="middle" font-size="13" font-weight="700" style="fill:${col}">${o}</text>`; });
  const vals=Object.values(cum).filter(x=>x.v!=null).map(x=>x.v); const m=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
  s+=`<circle cx="${C}" cy="${C}" r="${R0-8}" fill="var(--card)" stroke="var(--border)"/><text x="${C}" y="${C-4}" text-anchor="middle" font-size="34" font-weight="700" style="fill:var(--primary-dark)">${m!=null?f0(m)+' %':'—'}</text><text x="${C}" y="${C+20}" text-anchor="middle" font-size="12.5" class="m">${vals.length} ${T('de 17 ODS con evidencia','of 17 SDGs with evidence')}</text>`;
  return s+'</svg>'; }

/* Barras divergentes: lo que suma y lo que resta en cada compartimento */
function sumaResta(comp){ const W=620, fila=44, L=120, H=COMP.length*fila+40, mx=Math.max(1,...comp.map(c=>Math.max(c.pos,-c.neg))), X0=L+(W-L-20)/2, k=(W-L-30)/2/mx;
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img"><line x1="${X0}" y1="10" x2="${X0}" y2="${H-24}" class="ax"/>`;
  comp.forEach((c,i)=>{ const y=14+i*fila; s+=`<text x="${L-10}" y="${y+18}" text-anchor="end" font-size="13.5" font-weight="700" style="fill:${COMP_COL[i]}">${esc(tx(COMP[i]))}</text>`+
    `<rect class="crece" style="transform-origin:right center" x="${X0+c.neg*k}" y="${y+4}" width="${-c.neg*k}" height="22" rx="4" fill="var(--bad)" opacity=".8" data-tip="${esc(T('Resta','Subtracts')+': '+f0(c.neg))}"/>`+
    `<rect class="crece" x="${X0}" y="${y+4}" width="${c.pos*k}" height="22" rx="4" fill="var(--ok)" opacity=".85" data-tip="${esc(T('Suma','Adds')+': +'+f0(c.pos))}"/>`+
    `<text x="${X0+c.pos*k+6}" y="${y+20}" font-size="12" font-weight="700">${c.suma>0?'+':''}${f0(c.suma)}</text>`; });
  return s+`<text x="${X0-10}" y="${H-6}" text-anchor="end" font-size="12" style="fill:var(--bad-text)">← ${T('resta','subtracts')}</text><text x="${X0+10}" y="${H-6}" font-size="12" style="fill:var(--ok-text)">${T('suma','adds')} →</text></svg>`; }

/* Barras por paso: índice de sostenibilidad tradicional e innovado */
function barrasPasos(pp){ const W=980, H=280, L=40, B=40, n=pp.length, bw=(W-L-10)/n; const Y=(v)=>H-B-(H-B-14)*v;
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`; [0,.4,.5,.6,1].forEach(t=>{ s+=`<line class="grid" x1="${L}" y1="${Y(t)}" x2="${W-6}" y2="${Y(t)}" ${t===.5?'stroke-dasharray="4 4"':''}/><text x="${L-6}" y="${Y(t)+4}" text-anchor="end" font-size="10.5" class="m">${f1(t,1)}</text>`; });
  pp.forEach((p,i)=>{ const x=L+i*bw; const b=p.b?colB(p.b):'var(--primary)';
    if(p.trad!=null) s+=`<rect class="creceV" x="${x+2}" y="${Y(p.trad)}" width="${p.inn!=null?bw/2-3:bw-4}" height="${H-B-Y(p.trad)}" rx="2" fill="${b}" style="animation-delay:${i*12}ms" data-tip="${esc('<b>'+T('Paso','Step')+' '+p.n+'</b><br>'+T('Tradicional','Traditional')+': IS '+f1(p.trad,2)+(p.inn!=null?'<br>'+T('Innovado','Innovated')+': IS '+f1(p.inn,2):''))}"/>`;
    if(p.inn!=null) s+=`<rect class="creceV" x="${x+bw/2}" y="${Y(p.inn)}" width="${bw/2-3}" height="${H-B-Y(p.inn)}" rx="2" fill="var(--accent)" style="animation-delay:${i*12}ms"/>`;
    s+=`<text x="${x+bw/2}" y="${H-B+14}" text-anchor="middle" font-size="9.5" class="m">${p.n}</text>`; });
  return s+`<text x="${(L+W)/2}" y="${H-6}" text-anchor="middle" font-size="12" class="m">${T('pasos del Stack (1–38) · barra naranja: actividades innovadas','Stack steps (1–38) · orange bar: innovated activities')}</text></svg>`; }
