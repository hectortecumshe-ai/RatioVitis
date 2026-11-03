// =====================================================================
// 45_graficos.js — gráficas propias en SVG (sin bibliotecas)
// =====================================================================
const NS = 'http://www.w3.org/2000/svg';
const f1 = (x,d=1)=> x==null||!isFinite(x) ? '—' : (+x).toLocaleString(LOC(),{minimumFractionDigits:d,maximumFractionDigits:d});
const f0 = (x)=> f1(x,0);
const colB = (id)=> (B5.find(b=>b.id===id)||{}).col || '#888';
const MESES = ()=> T('Ene Feb Mar Abr May Jun Jul Ago Sep Oct Nov Dic','Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec').split(' ');

// tooltip global
let TIP;
function tip(ev, html){ if(!TIP){ TIP=document.createElement('div'); TIP.className='tip'; document.body.appendChild(TIP); }
  if(!html){ TIP.classList.remove('on'); return; } TIP.innerHTML=html; TIP.classList.add('on');
  const x=Math.min(ev.clientX+14, innerWidth-TIP.offsetWidth-8), y=Math.min(ev.clientY+14, innerHeight-TIP.offsetHeight-8); TIP.style.left=x+'px'; TIP.style.top=y+'px'; }
function enlazarTips(raiz){ raiz.querySelectorAll('[data-tip]').forEach(el=>{ el.addEventListener('mousemove',e=>tip(e,el.getAttribute('data-tip'))); el.addEventListener('mouseleave',()=>tip(null)); }); }

// ---------- Trama de telar (decorativa) ----------
function trama(w=1200,h=320){ let s=`<svg class="trama" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">`;
  const cols=['var(--tierra)','var(--semilla)','var(--siembra)','var(--alim)','var(--vigil)'];
  for(let i=0;i<34;i++){ const x=w*0.42+i*22; s+=`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${cols[i%5]}" stroke-width="2" opacity=".35"/>`; }
  for(let j=0;j<16;j++){ const y=10+j*20; let d=`M ${w*0.42} ${y}`; for(let i=0;i<34;i++){ const x=w*0.42+i*22; d+=` Q ${x+11} ${y+((i+j)%2?7:-7)} ${x+22} ${y}`; }
    s+=`<path d="${d}" fill="none" stroke="${cols[j%5]}" stroke-width="3" opacity=".5"/>`; }
  return s+'</svg>'; }

// ---------- Rueda del calendario del Stack ----------
function ruedaStack(siembraDia, filtroB){
  const W=560, C=W/2, R0=92, dR=30; const anillos=B5.map(b=>b.id);
  let s=`<svg class="chart" viewBox="0 0 ${W} ${W}" role="img" aria-label="${T('Calendario anual de los 38 pasos','Annual calendar of the 38 steps')}">`;
  const ang=(d)=> (d/365)*2*Math.PI - Math.PI/2; // enero arriba
  const pt=(d,r)=>[C+r*Math.cos(ang(d)), C+r*Math.sin(ang(d))];
  anillos.forEach((id,k)=>{ const r=R0+k*dR+dR/2; s+=`<circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="${colB(id)}" stroke-opacity=".18" stroke-width="${dR-4}"/>`; });
  MESES().forEach((m,i)=>{ const d=MES_DIA[i]; const [x1,y1]=pt(d,R0-6), [x2,y2]=pt(d,R0+anillos.length*dR+4); s+=`<line class="grid" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    const [tx,ty]=pt(d+15,R0+anillos.length*dR+20); s+=`<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" font-size="14" class="m">${m}</text>`; });
  // arco de siembra
  const [sx,sy]=pt(siembraDia,R0-14); s+=`<circle cx="${sx}" cy="${sy}" r="6" fill="var(--accent)"/>`;
  PASOS.forEach(p=>{ const d=diaPaso(p,siembraDia), k=anillos.indexOf(p.b), r=R0+k*dR+dR/2; const [x,y]=pt(d,r);
    const dim = filtroB && filtroB!==p.b ? .15 : 1;
    const t=`<b>${p.n}. ${esc(T(p.es,p.en))}</b><br>${esc(T((B5.find(b=>b.id===p.b)||{}).es,(B5.find(b=>b.id===p.b)||{}).en))}${p.dds?`<br>${p.dds.join('–')} DDS`:''}${p.iic?`<br>IIC ${f1(p.iic)}`:''}<br><span class="nota">${p.a.length} ${T('actividades','activities')}</span>`;
    s+=`<g data-tip="${esc(t)}" opacity="${dim}" style="cursor:pointer" data-paso="${p.n}"><circle cx="${x}" cy="${y}" r="${p.iic?12:10}" fill="${colB(p.b)}" stroke="var(--card)" stroke-width="2"/>`+
       `<text x="${x}" y="${y+.5}" text-anchor="middle" dominant-baseline="middle" font-size="10.5" font-weight="700" style="fill:#fff">${p.n}</text></g>`; });
  s+=`<text x="${C}" y="${C-14}" text-anchor="middle" font-size="40" font-weight="700" style="fill:var(--primary-dark)">38</text>`+
     `<text x="${C}" y="${C+12}" text-anchor="middle" font-size="14" class="m">${T('pasos','steps')}</text>`+
     `<text x="${C}" y="${C+32}" text-anchor="middle" font-size="14" class="m">83 ${T('actividades','activities')}</text></svg>`;
  return s; }

// ---------- Flujo 5B → clústeres de conocimiento (Figura 3) ----------
function flujoBC(){ const W=640,H=330, x1=150, x2=490, cl=CLUSTERS; const bs=B5;
  const cnt={}; PASOS.forEach(p=>{ const k=p.b+'|'+p.c; cnt[k]=(cnt[k]||0)+1; });
  const tb={}, tc={}; PASOS.forEach(p=>{ tb[p.b]=(tb[p.b]||0)+1; tc[p.c]=(tc[p.c]||0)+1; });
  const esc1=(H-60)/38, gap=8; let y=20; const yb={}; bs.forEach(b=>{ yb[b.id]={y, h:(tb[b.id]||0)*esc1, o:0}; y+=(tb[b.id]||0)*esc1+gap; });
  y=20; const yc={}; cl.forEach(c=>{ yc[c.id]={y, h:(tc[c.id]||0)*esc1, o:0}; y+=(tc[c.id]||0)*esc1+gap; });
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
  bs.forEach(b=>{ cl.forEach(c=>{ const v=cnt[b.id+'|'+c.id]; if(!v) return; const h=v*esc1; const a=yb[b.id], z=yc[c.id];
    const ya=a.y+a.o, yz=z.y+z.o; a.o+=h; z.o+=h; const mx=(x1+x2)/2;
    s+=`<path d="M${x1},${ya} C${mx},${ya} ${mx},${yz} ${x2},${yz} L${x2},${yz+h} C${mx},${yz+h} ${mx},${ya+h} ${x1},${ya+h} Z" fill="${b.col}" fill-opacity=".38" data-tip="${esc(T(b.es,b.en)+' → C'+c.id+': '+v+' '+T('pasos','steps'))}"/>`; }); });
  bs.forEach(b=>{ const a=yb[b.id]; if(!a.h) return; s+=`<rect x="${x1-10}" y="${a.y}" width="10" height="${a.h}" fill="${b.col}"/><text x="${x1-16}" y="${a.y+a.h/2}" text-anchor="end" dominant-baseline="middle" font-size="13">${esc(T(b.es,b.en))} (${tb[b.id]})</text>`; });
  cl.forEach(c=>{ const z=yc[c.id]; s+=`<rect x="${x2}" y="${z.y}" width="10" height="${z.h}" fill="${c.col}"/><text x="${x2+16}" y="${z.y+z.h/2}" dominant-baseline="middle" font-size="13">C${c.id} · ${tc[c.id]} ${T('pasos','steps')}</text>`; });
  return s+'</svg>'; }

// ---------- Barras horizontales genéricas ----------
function barrasH(items, opt={}){ const W=opt.w||620, fila=opt.fila||26, izq=opt.izq||250, H=items.length*fila+28, max=opt.max||Math.max(...items.map(i=>i.v),1);
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
  [0,.25,.5,.75,1].forEach(t=>{ const x=izq+t*(W-izq-50); s+=`<line class="grid" x1="${x}" y1="6" x2="${x}" y2="${H-20}"/><text x="${x}" y="${H-4}" text-anchor="middle" font-size="11" class="m">${f0(t*max)}</text>`; });
  items.forEach((it,i)=>{ const y=8+i*fila, w=(it.v/max)*(W-izq-50);
    s+=`<text x="${izq-8}" y="${y+fila/2-2}" text-anchor="end" dominant-baseline="middle" font-size="13">${esc(it.l)}</text>`+
       `<rect x="${izq}" y="${y+3}" width="${Math.max(1,w)}" height="${fila-10}" rx="3" fill="${it.c||'var(--primary)'}" ${it.t?`data-tip="${esc(it.t)}"`:''}/>`+
       `<text x="${izq+w+6}" y="${y+fila/2-2}" dominant-baseline="middle" font-size="12.5" font-weight="700">${esc(it.vl!=null?it.vl:f1(it.v))}</text>`; });
  return s+'</svg>'; }

// ---------- Red (disposición por fuerzas, determinista) ----------
function disponerRed(nodos, aristas, W, H){ const n=nodos.length; const P=nodos.map((d,i)=>({x:W/2+Math.cos(2*Math.PI*i/n)*W*0.3, y:H/2+Math.sin(2*Math.PI*i/n)*H*0.3}));
  const idx=new Map(nodos.map((d,i)=>[d.id,i])); const k=Math.sqrt(W*H/Math.max(n,1))*0.95;
  for(let it=0;it<300;it++){ const F=P.map(()=>({x:0,y:0})), temp=8*(1-it/300)+0.4;
    for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){ const dx=P[i].x-P[j].x, dy=P[i].y-P[j].y, d=Math.max(1,Math.hypot(dx,dy)), f=k*k/d; F[i].x+=dx/d*f; F[i].y+=dy/d*f; F[j].x-=dx/d*f; F[j].y-=dy/d*f; }
    aristas.forEach(e=>{ const i=idx.get(e.a), j=idx.get(e.b); if(i==null||j==null) return; const dx=P[i].x-P[j].x, dy=P[i].y-P[j].y, d=Math.max(1,Math.hypot(dx,dy)), f=d*d/k*0.35*(0.6+0.4*(+e.w||1)/3);
      F[i].x-=dx/d*f; F[i].y-=dy/d*f; F[j].x+=dx/d*f; F[j].y+=dy/d*f; });
    P.forEach((p,i)=>{ const m=Math.hypot(F[i].x,F[i].y)||1; p.x+=F[i].x/m*Math.min(m,temp*4); p.y+=F[i].y/m*Math.min(m,temp*4);
      p.x+= (W/2-p.x)*0.01; p.y+=(H/2-p.y)*0.01; p.x=Math.max(50,Math.min(W-50,p.x)); p.y=Math.max(40,Math.min(H-40,p.y)); }); }
  return P; }
function anillo(nodos, centro, W, H){ const otros=nodos.filter(d=>d.id!==centro), R=Math.min(W,H)*0.34; let k=0;
  return nodos.map(d=>{ if(d.id===centro) return {x:W/2,y:H/2}; const a=-Math.PI/2+2*Math.PI*(k++)/otros.length; return {x:W/2+R*Math.cos(a)*1.25, y:H/2+R*Math.sin(a)}; }); }
function dibujarRed(nodos, aristas, met, opt={}){ const W=opt.w||640, H=opt.h||420; const P=opt.centro ? anillo(nodos, opt.centro, W, H) : disponerRed(nodos, aristas, W, H); const idx=new Map(nodos.map((d,i)=>[d.id,i]));
  const clave=opt.clave||'inter'; const vals=met.nodos.map(m=>m[clave]); const mx=Math.max(...vals,1e-9);
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
  aristas.forEach(e=>{ const i=idx.get(e.a), j=idx.get(e.b); if(i==null||j==null) return;
    s+=`<line x1="${P[i].x}" y1="${P[i].y}" x2="${P[j].x}" y2="${P[j].y}" stroke="var(--border-strong)" stroke-width="${1+(+e.w||1)*1.2}" ${e.dash?'stroke-dasharray="5 5"':''} opacity=".85"/>`; });
  nodos.forEach((d,i)=>{ const m=met.nodos[i]; const r=14+22*(m[clave]/mx); const col=d.col||'var(--primary)';
    const t=`<b>${esc(d.nombre||d.id)}</b><br>${T('Grado ponderado','Weighted degree')}: ${f1(m.grado)}<br>${T('Intermediación','Betweenness')}: ${f1(m.inter,2)}<br>${T('Cercanía','Closeness')}: ${f1(m.cerc,2)}`;
    s+=`<g data-tip="${esc(t)}"><circle cx="${P[i].x}" cy="${P[i].y}" r="${r}" fill="${col}" fill-opacity=".9" stroke="var(--card)" stroke-width="2"/>`+
       `<text x="${P[i].x}" y="${P[i].y+.5}" text-anchor="middle" dominant-baseline="middle" font-size="12.5" font-weight="700" style="fill:#fff">${esc(d.id)}</text>`+
       `<text x="${P[i].x}" y="${P[i].y+r+14}" text-anchor="middle" font-size="12" class="m">${esc((d.nombre||'').slice(0,28))}</text></g>`; });
  return s+'</svg>'; }

// ---------- Plano influencia–dependencia (MICMAC) ----------
function planoMicmac(res, etiquetas, um){ const W=620,H=470,L=60,B=48,R=20,Tp=20;
  const dom=(v)=>{ let a=Math.min(...v,um), b=Math.max(...v,um); const p=Math.max((b-a)*0.18, um*0.05); return [Math.max(0,a-p), b+p]; };
  const [x0,x1]=dom(res.map(r=>r.dep)), [y0,y1]=dom(res.map(r=>r.mot));
  const X=(v)=>L+(v-x0)/(x1-x0)*(W-L-R), Y=(v)=>H-B-(v-y0)/(y1-y0)*(H-B-Tp);
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
  const zonas=[['motriz',L,Tp,X(um)-L,Y(um)-Tp],['enlace',X(um),Tp,W-R-X(um),Y(um)-Tp],['autonoma',L,Y(um),X(um)-L,H-B-Y(um)],['dependiente',X(um),Y(um),W-R-X(um),H-B-Y(um)]];
  const cz={motriz:'var(--accent)',enlace:'var(--bad)',autonoma:'var(--muted)',dependiente:'var(--info)'};
  zonas.forEach(([z,x,y,w,h])=>{ s+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cz[z]}" fill-opacity=".06"/><text x="${x+8}" y="${y+18}" font-size="12.5" font-weight="700" style="fill:${cz[z]}">${esc(T(ZONAS_MICMAC[z][0],ZONAS_MICMAC[z][1]))}</text>`; });
  s+=`<line class="ax" x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}"/><line class="ax" x1="${L}" y1="${Tp}" x2="${L}" y2="${H-B}"/>`+
     `<line x1="${X(um)}" y1="${Tp}" x2="${X(um)}" y2="${H-B}" stroke="var(--border-strong)" stroke-dasharray="4 4"/><line x1="${L}" y1="${Y(um)}" x2="${W-R}" y2="${Y(um)}" stroke="var(--border-strong)" stroke-dasharray="4 4"/>`+
     [0,.5,1].map(t=>`<text x="${X(x0+t*(x1-x0))}" y="${H-B+15}" text-anchor="middle" font-size="11" class="m">${f1(x0+t*(x1-x0))}</text><text x="${L-6}" y="${Y(y0+t*(y1-y0))+4}" text-anchor="end" font-size="11" class="m">${f1(y0+t*(y1-y0))}</text>`).join('')+
     `<text x="${(L+W-R)/2}" y="${H-10}" text-anchor="middle" font-size="13" class="m">${T('Dependencia (%)','Dependence (%)')}</text>`+
     `<text transform="translate(16 ${(Tp+H-B)/2}) rotate(-90)" text-anchor="middle" font-size="13" class="m">${T('Influencia / motricidad (%)','Influence (%)')}</text>`;
  const usados=[]; res.forEach(r=>{ const x=X(r.dep); let y=Y(r.mot); let ly=y+4; while(usados.some(u=>Math.abs(u[0]-x)<90&&Math.abs(u[1]-ly)<13)) ly+=13; usados.push([x,ly]); s+=`<g data-tip="${esc('<b>'+etiquetas[r.i]+'</b><br>'+T('Influencia','Influence')+' '+f1(r.mot)+' %<br>'+T('Dependencia','Dependence')+' '+f1(r.dep)+' %')}"><circle cx="${x}" cy="${y}" r="7" fill="${cz[r.zona]}"/>`+
    `<text x="${x+10}" y="${ly}" font-size="12">${esc(etiquetas[r.i].slice(0,22))}</text></g>`; });
  return s+'</svg>'; }

// ---------- Radar ----------
function radar(vals, etiquetas, cols, opt={}){ const W=opt.w||420, C=W/2, R=W/2-70, n=vals.length; const a=(i)=>-Math.PI/2+2*Math.PI*i/n;
  let s=`<svg class="chart" viewBox="0 0 ${W} ${W}" role="img">`;
  [.25,.5,.75,1].forEach(t=>{ let d=''; for(let i=0;i<n;i++){ const x=C+R*t*Math.cos(a(i)), y=C+R*t*Math.sin(a(i)); d+=(i?'L':'M')+x+','+y; } s+=`<path d="${d}Z" fill="none" class="grid"/>`; });
  for(let i=0;i<n;i++){ const x=C+R*Math.cos(a(i)), y=C+R*Math.sin(a(i)); s+=`<line class="grid" x1="${C}" y1="${C}" x2="${x}" y2="${y}"/>`;
    const lx=C+(R+18)*Math.cos(a(i)), ly=C+(R+18)*Math.sin(a(i)); s+=`<text x="${lx}" y="${ly}" font-size="12" text-anchor="${Math.abs(Math.cos(a(i)))<.2?'middle':(Math.cos(a(i))>0?'start':'end')}" dominant-baseline="middle">${esc(etiquetas[i])}</text>`; }
  let d=''; vals.forEach((v,i)=>{ const x=C+R*Math.max(0,Math.min(1,v||0))*Math.cos(a(i)), y=C+R*Math.max(0,Math.min(1,v||0))*Math.sin(a(i)); d+=(i?'L':'M')+x+','+y; });
  s+=`<path d="${d}Z" fill="var(--primary)" fill-opacity=".22" stroke="var(--primary)" stroke-width="2"/>`;
  vals.forEach((v,i)=>{ const x=C+R*Math.max(0,Math.min(1,v||0))*Math.cos(a(i)), y=C+R*Math.max(0,Math.min(1,v||0))*Math.sin(a(i)); s+=`<circle cx="${x}" cy="${y}" r="4.5" fill="${cols?cols[i]:'var(--primary)'}"/>`; });
  return s+'</svg>'; }

// ---------- Líneas (escenarios) ----------
function lineas(series, opt={}){ const W=620,H=330,L=56,B=40,R=110,Tp=16; const H0=series[0].v.length-1; const all=series.flatMap(s=>s.v);
  let mn=Math.min(...all), mx=Math.max(...all); if(mx-mn<1e-9){ mx+=1; mn-=1; } const pad=(mx-mn)*0.08; mn-=pad; mx+=pad;
  const X=(t)=>L+t/H0*(W-L-R), Y=(v)=>H-B-(v-mn)/(mx-mn)*(H-B-Tp);
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img"><line class="ax" x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}"/><line class="ax" x1="${L}" y1="${Tp}" x2="${L}" y2="${H-B}"/>`;
  for(let k=0;k<=4;k++){ const v=mn+(mx-mn)*k/4; s+=`<line class="grid" x1="${L}" y1="${Y(v)}" x2="${W-R}" y2="${Y(v)}"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" class="m">${f1(v)}</text>`; }
  for(let t=0;t<=H0;t+=Math.max(1,Math.round(H0/6))) s+=`<text x="${X(t)}" y="${H-B+16}" text-anchor="middle" font-size="11" class="m">${(opt.t0||0)+t}</text>`;
  series.forEach(se=>{ s+=`<path d="${se.v.map((v,t)=>(t?'L':'M')+X(t)+','+Y(v)).join('')}" fill="none" stroke="${se.c}" stroke-width="2.5" ${se.dash?'stroke-dasharray="6 5"':''}/>`+
    `<text x="${X(H0)+6}" y="${Y(se.v[H0])+4}" font-size="12" style="fill:${se.c}" font-weight="700">${esc(se.l)}</text>`; });
  return s+'</svg>'; }

