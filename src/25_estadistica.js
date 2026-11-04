"use strict";
/* =====================================================================
   ESTADÍSTICA · descriptiva e inferencial (Bloque 9), código propio
   · Distribuciones: t y F con la función beta incompleta regularizada (fracción continua);
     rango estudentizado (Tukey) por integración numérica de su definición.
   · ANOVA de bloques completos al azar sobre medias de parcela (unidad experimental);
     sin columna de bloque, ANOVA de una vía (diseño completamente al azar).
   · Tukey HSD (Tukey–Kramer si hay repeticiones desiguales) con letras de agrupación.
   · Levene centrado en la mediana (Brown y Forsythe) para homogeneidad de varianzas.
   · Correlación de Pearson con su prueba t.
   Validado contra SciPy en pruebas/verificar_estadistica.py.
   ===================================================================== */
const EST = (()=>{
  function lgamma(x){ const g=7, c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    if(x<0.5) return Math.log(Math.PI/Math.abs(Math.sin(Math.PI*x)))-lgamma(1-x); x-=1; let a=c[0]; const t=x+g+0.5; for(let i=1;i<9;i++) a+=c[i]/(x+i); return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a); }
  function betacf(a,b,x){ const MAXIT=300, EPS=1e-15, FPMIN=1e-300; let qab=a+b, qap=a+1, qam=a-1, c=1, d=1-qab*x/qap; if(Math.abs(d)<FPMIN) d=FPMIN; d=1/d; let h=d;
    for(let m=1;m<=MAXIT;m++){ const m2=2*m; let aa=m*(b-m)*x/((qam+m2)*(a+m2)); d=1+aa*d; if(Math.abs(d)<FPMIN) d=FPMIN; c=1+aa/c; if(Math.abs(c)<FPMIN) c=FPMIN; d=1/d; h*=d*c;
      aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2)); d=1+aa*d; if(Math.abs(d)<FPMIN) d=FPMIN; c=1+aa/c; if(Math.abs(c)<FPMIN) c=FPMIN; d=1/d; const del=d*c; h*=del; if(Math.abs(del-1)<EPS) break; } return h; }
  function betai(a,b,x){ if(x<=0) return 0; if(x>=1) return 1; const bt=Math.exp(lgamma(a+b)-lgamma(a)-lgamma(b)+a*Math.log(x)+b*Math.log(1-x));
    return x<(a+1)/(a+b+2) ? bt*betacf(a,b,x)/a : 1-bt*betacf(b,a,1-x)/b; }
  const pF = (F,d1,d2)=> F<=0?1: betai(d2/2, d1/2, d2/(d2+d1*F));          // P(F > f)
  const pT2 = (t,df)=> betai(df/2, 0.5, df/(df+t*t));                        // P(|T| > t)
  function qT(p2,df){ let lo=0, hi=1e3; for(let i=0;i<200;i++){ const m=(lo+hi)/2; if(pT2(m,df)>p2) lo=m; else hi=m; } return (lo+hi)/2; }   // t crítico bilateral
  /* Normal estándar: Φ con erfc de alta precisión (Numerical Recipes, Chebyshev) */
  function erfc(x){ const z=Math.abs(x), t=1/(1+0.5*z); const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
    return x>=0?r:2-r; }
  const Phi = z=> 0.5*erfc(-z/Math.SQRT2), phi = z=> Math.exp(-z*z/2)/Math.sqrt(2*Math.PI);
  /* Rango estudentizado: P(Q ≤ q | k, df) = ∫ f_s(s) · P_rango(q s) ds, con s = χ/√df */
  function pRango(w,k){ if(w<=0) return 0; const n=240, a=-8, b=8, h=(b-a)/n; let s=0;
    for(let i=0;i<=n;i++){ const z=a+i*h, f=phi(z)*Math.pow(Math.max(0,Phi(z)-Phi(z-w)),k-1), c=i===0||i===n?1:i%2?4:2; s+=c*f; } return Math.min(1,k*s*h/3); }
  function ptukey(q,k,df){ if(q<=0) return 0; if(df>5000) return pRango(q,k);
    const lc=(df/2)*Math.log(df)-lgamma(df/2)-(df/2-1)*Math.log(2), sd=1/Math.sqrt(2*df), a=Math.max(1e-9,1-12*sd), b=1+12*sd+(df<10?3:0), n=400, h=(b-a)/n; let s=0;
    for(let i=0;i<=n;i++){ const x=a+i*h, fs=Math.exp(lc+(df-1)*Math.log(x)-df*x*x/2), c=i===0||i===n?1:i%2?4:2; s+=c*fs*pRango(q*x,k); } return Math.min(1,s*h/3); }
  /* Descriptiva */
  function desc(v){ const x=v.filter(z=>z!=null&&isFinite(z)), n=x.length; if(!n) return null; const m=x.reduce((a,b)=>a+b,0)/n, s2=n>1?x.reduce((a,b)=>a+(b-m)*(b-m),0)/(n-1):null, sd=s2!=null?Math.sqrt(s2):null, se=sd!=null?sd/Math.sqrt(n):null, tc=n>1?qT(0.05,n-1):null;
    const o=[...x].sort((a,b)=>a-b), med=n%2?o[(n-1)/2]:(o[n/2-1]+o[n/2])/2;
    return {n, media:m, sd, se, cv:sd!=null&&m?100*sd/Math.abs(m):null, min:o[0], max:o[n-1], mediana:med, ic:tc!=null?[m-tc*se, m+tc*se]:null}; }
  /* ANOVA. obs: [{t, b, y}] (b puede faltar). Se promedian primero las observaciones de cada parcela (t, b). */
  function anova(obs){ const conB=obs.every(o=>o.b!=null&&o.b!==''), cel={};
    obs.forEach(o=>{ if(o.y==null||!isFinite(o.y)) return; const k=o.t+'\u0001'+(conB?o.b:''); (cel[k]=cel[k]||{t:o.t,b:conB?o.b:null,v:[]}).v.push(o.y); });
    const par=Object.values(cel).map(c=>({t:c.t,b:c.b,y:c.v.reduce((a,b)=>a+b,0)/c.v.length,n:c.v.length}));
    const ts=[...new Set(par.map(p=>p.t))], N=par.length, gm=par.reduce((a,p)=>a+p.y,0)/N, med={};
    ts.forEach(t=>{ const l=par.filter(p=>p.t===t); med[t]={media:l.reduce((a,p)=>a+p.y,0)/l.length, r:l.length}; });
    const sst=par.reduce((a,p)=>a+(p.y-gm)**2,0), sstr=ts.reduce((a,t)=>a+med[t].r*(med[t].media-gm)**2,0); let ssb=0, gb=0, bs=[], completo=true;
    if(conB){ bs=[...new Set(par.map(p=>p.b))]; completo = bs.every(b=>ts.every(t=>par.some(p=>p.b===b&&p.t===t))) && par.length===bs.length*ts.length;
      if(completo){ ssb=bs.reduce((a,b)=>{ const l=par.filter(p=>p.b===b), m=l.reduce((s,p)=>s+p.y,0)/l.length; return a+l.length*(m-gm)**2; },0); gb=bs.length-1; } }
    const usaB=conB&&completo, gt=ts.length-1, ge=N-1-gt-(usaB?gb:0), sse=sst-sstr-(usaB?ssb:0);
    if(ge<1||ts.length<2) return {err:'gl'};
    const mse=sse/ge, F=(sstr/gt)/mse, Fb=usaB?(ssb/gb)/mse:null;
    return {diseno:usaB?'bca':'dca', incompleto:conB&&!completo, par, ts, med, gm, N, gt, gb:usaB?gb:null, ge, sst, sstr, ssb:usaB?ssb:null, sse, mse, F, p:pF(F,gt,ge), Fb, pb:usaB?pF(Fb,gb,ge):null, cv:100*Math.sqrt(mse)/Math.abs(gm)}; }
  /* Tukey HSD sobre medias de tratamiento */
  function tukey(a, alfa=0.05){ const k=a.ts.length, pares=[];
    for(let i=0;i<k;i++) for(let j=i+1;j<k;j++){ const ti=a.ts[i], tj=a.ts[j], d=a.med[ti].media-a.med[tj].media, se=Math.sqrt(a.mse/2*(1/a.med[ti].r+1/a.med[tj].r)), q=Math.abs(d)/se;
      pares.push({a:ti, b:tj, dif:d, q, p:Math.max(0,1-ptukey(q,k,a.ge))}); }
    return {pares, letras:letras(a, pares, alfa)}; }
  /* Letras: medias ordenadas de mayor a menor; cada grupo es un tramo contiguo sin diferencias significativas */
  function letras(a, pares, alfa){ const o=[...a.ts].sort((x,y)=>a.med[y].media-a.med[x].media), sig=(x,y)=>{ const p=pares.find(z=>(z.a===x&&z.b===y)||(z.a===y&&z.b===x)); return p&&p.p<alfa; };
    const tramos=[]; for(let i=0;i<o.length;i++){ let j=i; while(j+1<o.length && o.slice(i,j+2).every((x,ii,arr)=>arr.every(y=>x===y||!sig(x,y)))) j++; if(!tramos.some(t=>t[0]<=i&&t[1]>=j)) tramos.push([i,j]); }
    const L={}; o.forEach(t=>L[t]=''); tramos.forEach((t,n)=>{ for(let i=t[0];i<=t[1];i++) L[o[i]]+=String.fromCharCode(97+n); }); return L; }
  /* Levene con mediana (Brown–Forsythe), sobre todas las observaciones */
  function levene(grupos){ const g=grupos.filter(v=>v.length>1); if(g.length<2) return null; const z=g.map(v=>{ const o=[...v].sort((a,b)=>a-b), m=o.length%2?o[(o.length-1)/2]:(o[o.length/2-1]+o[o.length/2])/2; return v.map(x=>Math.abs(x-m)); });
    const N=z.reduce((s,v)=>s+v.length,0), k=z.length, zm=z.map(v=>v.reduce((a,b)=>a+b,0)/v.length), zg=z.flat().reduce((a,b)=>a+b,0)/N;
    const num=z.reduce((s,v,i)=>s+v.length*(zm[i]-zg)**2,0)/(k-1), den=z.reduce((s,v,i)=>s+v.reduce((a,x)=>a+(x-zm[i])**2,0),0)/(N-k), W=num/den; return {W, gl1:k-1, gl2:N-k, p:pF(W,k-1,N-k)}; }
  function pearson(x,y){ const p=x.map((v,i)=>[v,y[i]]).filter(q=>q[0]!=null&&q[1]!=null&&isFinite(q[0])&&isFinite(q[1])), n=p.length; if(n<3) return null;
    const mx=p.reduce((a,q)=>a+q[0],0)/n, my=p.reduce((a,q)=>a+q[1],0)/n; let sxy=0,sxx=0,syy=0; p.forEach(([a,b])=>{ sxy+=(a-mx)*(b-my); sxx+=(a-mx)**2; syy+=(b-my)**2; });
    if(!(sxx>0&&syy>0)) return null; const r=sxy/Math.sqrt(sxx*syy), t=r*Math.sqrt((n-2)/Math.max(1e-300,1-r*r)); return {r, n, p:Math.abs(r)>=1?0:pT2(Math.abs(t),n-2)}; }
  /* Medias de parcela: obs [{t, b, y, x?, d?}] → una media por (t, b[, d]) de y y de la covariable x */
  function mediasParcela(obs, conFecha){ const cel={}; obs.forEach(o=>{ if(o.y==null) return; const k=[o.t,o.b,conFecha?o.d:''].join('\u0001'); const c=cel[k]=cel[k]||{t:o.t,b:o.b,d:o.d,ys:[],xs:[]}; c.ys.push(o.y); if(o.x!=null) c.xs.push(o.x); });
    return Object.values(cel).map(c=>({t:c.t,b:c.b,d:c.d,y:c.ys.reduce((a,b)=>a+b,0)/c.ys.length,x:c.xs.length?c.xs.reduce((a,b)=>a+b,0)/c.xs.length:null,n:c.ys.length})); }
  /* Sumas de cuadrados y productos de un diseño en bloques balanceado para el par (u, v) */
  function scBCA(par, u, v){ const ts=[...new Set(par.map(p=>p.t))], bs=[...new Set(par.map(p=>p.b))], N=par.length, mu=par.reduce((s,p)=>s+p[u],0)/N, mv=par.reduce((s,p)=>s+p[v],0)/N;
    const m=(l,k)=>l.reduce((s,p)=>s+p[k],0)/l.length, tot=par.reduce((s,p)=>s+(p[u]-mu)*(p[v]-mv),0);
    const tr=ts.reduce((s,t)=>{ const l=par.filter(p=>p.t===t); return s+l.length*(m(l,u)-mu)*(m(l,v)-mv); },0), bl=bs.reduce((s,b)=>{ const l=par.filter(p=>p.b===b); return s+l.length*(m(l,u)-mu)*(m(l,v)-mv); },0);
    return {tot, tr, bl, err:tot-tr-bl}; }
  /* ANCOVA en bloques completos al azar (covariable x de parcela): método de las sumas de productos del error (Steel y Torrie) */
  function ancovaBCA(obs, alfa=0.05){ const par=mediasParcela(obs,false).filter(p=>p.x!=null), ts=[...new Set(par.map(p=>p.t))], bs=[...new Set(par.map(p=>p.b))];
    if(ts.length<2||bs.length<2||par.length!==ts.length*bs.length) return {err:'incompleto'};
    const yy=scBCA(par,'y','y'), xx=scBCA(par,'x','x'), xy=scBCA(par,'x','y'), gt=ts.length-1, gb=bs.length-1, ge=gt*gb-1;
    if(!(xx.err>1e-12)) return {err:'covariable'};
    const gamma=xy.err/xx.err, sse=yy.err-xy.err*xy.err/xx.err, mse=sse/ge;
    const Syy=yy.tr+yy.err, Sxx=xx.tr+xx.err, Sxy=xy.tr+xy.err, sstAdj=(Syy-Sxy*Sxy/Sxx)-sse, F=(sstAdj/gt)/mse, Fcov=(xy.err*xy.err/xx.err)/mse;
    const gx=par.reduce((s,p)=>s+p.x,0)/par.length, med={}; ts.forEach(t=>{ const l=par.filter(p=>p.t===t), my=l.reduce((s,p)=>s+p.y,0)/l.length, mx=l.reduce((s,p)=>s+p.x,0)/l.length; med[t]={media:my, mx, aj:my-gamma*(mx-gx), r:l.length}; });
    const pares=[]; for(let i=0;i<ts.length;i++) for(let j=i+1;j<ts.length;j++){ const a=med[ts[i]], b=med[ts[j]], d=a.aj-b.aj, sed=Math.sqrt(mse*(1/a.r+1/b.r+(a.mx-b.mx)**2/xx.err)), q=Math.abs(d)*Math.SQRT2/sed;
      pares.push({a:ts[i], b:ts[j], dif:d, q, p:Math.max(0,1-ptukey(q,ts.length,ge))}); }
    const L=letras({ts, med:Object.fromEntries(ts.map(t=>[t,{media:med[t].aj}]))}, pares, alfa);
    return {ts, med, gamma, gt, ge, sse, mse, sstAdj, F, p:pF(F,gt,ge), Fcov, pcov:pF(Fcov,1,ge), pares, letras:L, N:par.length}; }
  /* Medidas repetidas como parcelas divididas en el tiempo: tratamiento contra el error a (bloque × tratamiento); fecha y T × F contra el error b */
  function parcelasTiempo(obs){ const par=mediasParcela(obs,true), ts=[...new Set(par.map(p=>p.t))], bs=[...new Set(par.map(p=>p.b))], ds=[...new Set(par.map(p=>p.d))].sort();
    const t=ts.length, b=bs.length, d=ds.length; if(t<2||b<2||d<2||par.length!==t*b*d) return {err:'incompleto'};
    const N=par.length, gm=par.reduce((s,p)=>s+p.y,0)/N, ss=(keys)=>{ const g={}; par.forEach(p=>{ const k=keys.map(k=>p[k]).join('\u0001'); (g[k]=g[k]||[]).push(p.y); }); return Object.values(g).reduce((s,l)=>s+l.length*((l.reduce((a,c)=>a+c,0)/l.length)-gm)**2,0); };
    const sst=par.reduce((s,p)=>s+(p.y-gm)**2,0), sB=ss(['b']), sT=ss(['t']), sBT=ss(['b','t'])-sB-sT, sF=ss(['d']), sTF=ss(['t','d'])-sT-sF, sEb=sst-sB-sT-sBT-sF-sTF;
    const g={B:b-1, T:t-1, Ea:(b-1)*(t-1), F:d-1, TF:(t-1)*(d-1), Eb:t*(b-1)*(d-1)}, msEa=sBT/g.Ea, msEb=sEb/g.Eb;
    const fila=(n,sc,gl,den,glden)=>({n, sc, gl, cm:sc/gl, F:den!=null?(sc/gl)/den:null, p:den!=null?pF((sc/gl)/den,gl,glden):null});
    return {ts, bs, ds, N, filas:[fila('B',sB,g.B,msEa,g.Ea), fila('T',sT,g.T,msEa,g.Ea), fila('Ea',sBT,g.Ea,null), fila('F',sF,g.F,msEb,g.Eb), fila('TF',sTF,g.TF,msEb,g.Eb), fila('Eb',sEb,g.Eb,null)], msEa, msEb, g, sst,
      medTF:Object.fromEntries(ts.map(tt=>[tt, ds.map(dd=>{ const l=par.filter(p=>p.t===tt&&p.d===dd); return l.reduce((s,p)=>s+p.y,0)/l.length; })]))}; }
  return {lgamma, betai, pF, pT2, qT, Phi, ptukey, desc, anova, tukey, levene, pearson, mediasParcela, ancovaBCA, parcelasTiempo};
})();
