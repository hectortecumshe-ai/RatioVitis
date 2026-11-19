"use strict";
/* =====================================================================
   MIS ENTREVISTAS · ENVIAR AL ADMINISTRADOR · FUNCIONAR SIN INTERNET
   - Cada entrevista (o registro de campo) se guarda sola en ESTE teléfono,
     aunque no haya internet; empezar otra no borra las anteriores.
   - «Enviar al administrador»: arma un solo archivo con las entrevistas
     elegidas y abre el menú de compartir del teléfono (WhatsApp, correo…).
     Sin menú de compartir (computadora), descarga el archivo y abre el
     correo o WhatsApp con el mensaje listo para adjuntarlo.
   - Lo que no se ha enviado queda «Pendiente» y la app lo recuerda.
   - El administrador recibe los archivos, los carga aquí y descarga una
     tabla consolidada (CSV) o los pasa al Atlas.
   - Nada sale del teléfono sin que la persona lo comparta: no hay servidor.
   ===================================================================== */
const ENT = {clave:'vitis', app:'Ratio Vitis', almacen:'vitis_v1', valido:s=>!!(s&&s.formato), estadoDe:d=>d&&(d.estado||(d.formato?d:null)), indicadores:[
  ['estado', ()=> (edoDe(S.edo)||[])[1]], ['municipio', ()=> (munSel()||[])[1]], ['localidad', ()=> (locSel()||[])[1]], ['tipo_uva', ()=> S.vina&&S.vina.tipo],
  ['llenado', ()=> avanceTotal()], ['indice_regeneracion', ()=> regeneracion().IR], ['regeneracion_confirmadas', ()=> regeneracion().nConf],
  ['indice_riesgo', ()=> riesgos().idx], ['riesgos_confirmados', ()=> riesgos().nConf],
  ['dias_con_estres_hidrico', ()=> { const z=resiliencia(); return z?z.r.diasEstres:null; }], ['episodio_estres_mas_largo_dias', ()=> { const z=resiliencia(); return z?z.largo:null; }]]};
const ENT_KEY = ENT.clave+'_entrevistas', ENT_ADM = ENT.clave+'_admin';
function entLista(){ try{ return JSON.parse(localStorage.getItem(ENT_KEY)||'[]'); }catch(e){ return []; } }
function entEscribir(L){ try{ localStorage.setItem(ENT_KEY, JSON.stringify(L)); return true; }catch(e){ toast(T('El teléfono ya no tiene espacio para más entrevistas: envía las pendientes y quita las ya enviadas.','This phone has no room for more interviews: send the pending ones and remove those already sent.')); return false; } }
function entAdmin(){ try{ return Object.assign({correo:'hectortecumshe@gmail.com', wa:'', encuestador:''}, JSON.parse(localStorage.getItem(ENT_ADM)||'{}')); }catch(e){ return {correo:'hectortecumshe@gmail.com', wa:'', encuestador:''}; } }
function entAdminGuardar(a){ try{ localStorage.setItem(ENT_ADM, JSON.stringify(a)); }catch(e){} }
const entId = ()=> Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const _entLocal = ()=> new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString();   // hora del teléfono, no UTC
const entHoy = ()=> _entLocal().slice(0,10);
const entAhora = ()=> _entLocal().slice(0,16).replace('T',' ');
/* ¿La entrevista ya tiene algo capturado? (se ignora la navegación y la fecha) */
function entLimpio(s){ const c=JSON.parse(JSON.stringify(s||{})); ['bloque','visitados','entrevista','revisado'].forEach(k=>delete c[k]); if(c.proyecto) delete c.proyecto.fecha; return JSON.stringify(c); }
function entTieneDatos(s){ try{ return entLimpio(s)!==entLimpio(estadoInicial()); }catch(e){ return true; } }
function entMeta(){ S.entrevista = S.entrevista || {}; return S.entrevista; }
function entTitulo(e){ const s=e.estado||{}, p=s.proyecto||{}; let lugar='';
  try{ const prev=S; S=Object.assign(estadoInicial(), s); try{ const l=typeof locSel==='function'?locSel():null, m=typeof munSel==='function'?munSel():null; lugar=[l&&l[1], m&&m[1]].filter(Boolean).join(', '); } finally{ S=prev; } }catch(err){}
  return [p.nombre, (s.entrevista||{}).codigo, lugar].filter(Boolean).join(' · ') || T('Entrevista sin nombre','Unnamed interview'); }
/* Sincroniza el proyecto abierto con la lista (se llama después de cada guardar) */
let _entT=null;
function entSync(inmediato){ if(EJ) return; clearTimeout(_entT); const f=()=>{ if(EJ || !entTieneDatos(S)) return; const m=entMeta(), L=entLista();
    if(!m.id){ m.id=entId(); m.creada=entAhora(); if(!m.encuestador) m.encuestador=entAdmin().encuestador||''; _guardarBase(); }
    const copia=JSON.parse(JSON.stringify(S)), i=L.findIndex(x=>x.id===m.id), prev=i>=0?L[i]:null;
    const cambio=!prev || entLimpio(prev.estado)!==entLimpio(copia) || JSON.stringify((prev.estado||{}).entrevista)!==JSON.stringify(copia.entrevista);
    if(!cambio) return;
    const e={id:m.id, creada:m.creada, mod:entAhora(), enviada:prev&&prev.enviada&&entLimpio(prev.estado)===entLimpio(copia)?prev.enviada:null, origen:prev?prev.origen:'propia', estado:copia};
    if(i>=0) L[i]=e; else L.unshift(e); entEscribir(L); entBoton(); };
  if(inmediato) f(); else _entT=setTimeout(f, 600); }
const _guardarBase = guardar;
guardar = function(){ _guardarBase(); entSync(); };
addEventListener('pagehide', ()=>entSync(true));
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') entSync(true); });
const entPendientes = ()=> entLista().filter(e=>!e.enviada && e.origen!=='recibida');

/* ---------------- Archivo para enviar ---------------- */
function entLote(ids){ const L=entLista().filter(e=>ids.includes(e.id)), a=entAdmin();
  return {app:ENT.app, version:CONFIG.version, lote:true, fecha:entHoy(), encuestador:a.encuestador||'', n:L.length,
    entrevistas:L.map(e=>({id:e.id, creada:e.creada, mod:e.mod, estado:e.estado}))}; }
/* .txt: el menú de compartir de Android acepta texto, no .json; dentro va el mismo JSON y la app lo lee igual */
function entNombre(n){ const a=(entAdmin().encuestador||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w\-]+/g,'_').slice(0,30);
  return `${ENT.app.replace(/\s+/g,'')}_${n}_${n===1?'entrevista':'entrevistas'}_${a?a+'_':''}${entHoy()}.txt`; }
function entMensaje(n){ const a=entAdmin();
  return T(`${ENT.app}: te envío ${n} ${n===1?'entrevista':'entrevistas'}${a.encuestador?' de '+a.encuestador:''} (${entHoy()}). El archivo adjunto se abre en ${ENT.app} → Mis entrevistas → Recibir archivos.`,
           `${ENT.app}: sending you ${n} ${n===1?'interview':'interviews'}${a.encuestador?' from '+a.encuestador:''} (${entHoy()}). Open the attached file in ${ENT.app} → My interviews → Receive files.`); }
function entMarcar(ids){ const L=entLista(), f=entAhora(); L.forEach(e=>{ if(ids.includes(e.id)) e.enviada=f; }); entEscribir(L); entBoton(); }
let _entEspera=null;   // envío sin menú de compartir: se confirma a mano
async function entEnviar(canal, ids){ if(!ids.length) return toast(T('Elige al menos una entrevista','Choose at least one interview'));
  entSync(true); const lote=entLote(ids), texto=JSON.stringify(lote), nombre=entNombre(ids.length), msg=entMensaje(ids.length), a=entAdmin();
  if(canal==='archivo'){ descargar(nombre, texto, 'text/plain'); return toast(T('Archivo guardado en Descargas del teléfono','File saved to the phone’s Downloads')); }
  if(canal==='correo' && !a.correo) toast(T('Escribe abajo el correo del administrador para que vaya en el mensaje','Write the administrator’s email below so it goes in the message'));
  let archivo=null; try{ archivo=new File([texto], nombre, {type:'text/plain'}); }catch(e){}
  if(archivo && navigator.canShare && navigator.canShare({files:[archivo]})){
    if(canal==='correo' && a.correo){ try{ await navigator.clipboard.writeText(a.correo); toast(T('Correo del administrador copiado: pégalo en «Para»','Administrator’s email copied: paste it into «To»')); }catch(e){} }
    try{ await navigator.share({files:[archivo], title:ENT.app, text:(canal==='correo'&&a.correo?T('Para: ','To: ')+a.correo+'\n':'')+msg});
      entMarcar(ids); renderEnt(); toast(T('Enviado. Si no había señal, WhatsApp o el correo lo mandarán cuando vuelva.','Sent. If there was no signal, WhatsApp or email will send it when it returns.')); }
    catch(e){ if(e && e.name!=='AbortError') toast(T('No se pudo compartir: ','Could not share: ')+e.message); }
    return; }
  /* Sin menú de compartir: se descarga el archivo y se abre el correo o WhatsApp con el mensaje */
  descargar(nombre, texto, 'text/plain'); _entEspera=ids;
  const cuerpo=msg+'\n\n'+T(`Adjunta el archivo «${nombre}» que se acaba de guardar en Descargas.`,`Attach the file «${nombre}» just saved in Downloads.`);
  if(canal==='correo') location.href=`mailto:${encodeURIComponent(a.correo||'')}?subject=${encodeURIComponent(ENT.app+' · '+T('entrevistas','interviews')+' '+entHoy())}&body=${encodeURIComponent(cuerpo)}`;
  else window.open(`https://wa.me/${(a.wa||'').replace(/\D/g,'')}?text=${encodeURIComponent(cuerpo)}`, '_blank', 'noopener');
  renderEnt(); }

/* ---------------- Recibir (administrador) ---------------- */
function entDeArchivo(d){ if(d && d.lote && Array.isArray(d.entrevistas)) return d.entrevistas.filter(e=>e&&e.estado&&ENT.valido(e.estado));
  const st=ENT.estadoDe(d); if(st && ENT.valido(st)) return [{id:(st.entrevista||{}).id||entId(), creada:(st.entrevista||{}).creada||'', mod:'', estado:st}];
  throw new Error(T('no es un archivo de ','not a file of ')+ENT.app); }
async function entRecibir(files){ const L=entLista(); let n=0, rep=0; const malos=[];
  for(const f of files){ try{ entDeArchivo(JSON.parse(await f.text())).forEach(e=>{ const m=e.estado.entrevista=e.estado.entrevista||{}; m.id=m.id||e.id;
      const x={id:m.id, creada:e.creada||m.creada||'', mod:e.mod||'', enviada:'recibida', origen:'recibida', archivo:f.name, recibida:entAhora(), estado:e.estado};
      const i=L.findIndex(y=>y.id===x.id); if(i>=0){ L[i]=x; rep++; } else { L.push(x); n++; } }); }
    catch(e){ malos.push(f.name+' ('+e.message+')'); } }
  entEscribir(L); renderEnt(); entBoton();
  toast(T(`${n} recibidas, ${rep} actualizadas`,`${n} received, ${rep} updated`)+(malos.length?' · '+T('no se pudieron leer: ','could not read: ')+malos.join(', '):'')); }
/* Tabla consolidada: una fila por entrevista con sus datos de control y los indicadores de la app */
function entCSV(){ const L=entLista(); if(!L.length) return toast(T('No hay entrevistas','No interviews'));
  const prev=S, prevEJ=EJ, filas=[]; let cols=null;
  try{ L.forEach(e=>{ S=Object.assign(estadoInicial(), JSON.parse(JSON.stringify(e.estado))); EJ=true; const m=S.entrevista||{}, p=S.proyecto||{};
      const base=[['id',e.id],['origen',e.origen||'propia'],['encuestador',m.encuestador||''],['codigo_entrevistado',m.codigo||''],['consentimiento',m.consentimiento?'si':'no'],
        ['creada',e.creada||''],['modificada',e.mod||''],['enviada',e.enviada||''],['proyecto',p.nombre||''],['fecha',p.fecha||'']];
      const ind=ENT.indicadores.map(([k,f])=>{ let v=''; try{ v=f(); if(v==null||(typeof v==='number'&&!isFinite(v))) v=''; else if(typeof v==='number') v=+v.toFixed(4); }catch(err){ v=''; } return [k,v]; });
      const r=base.concat(ind); if(!cols) cols=r.map(x=>x[0]); filas.push(r.map(x=>x[1])); }); }
  finally{ S=prev; EJ=prevEJ; }
  const t=csv([cols].concat(filas)); descargar(`${ENT.app.replace(/\s+/g,'')}_consolidado_${entHoy()}.csv`, t.charCodeAt(0)===0xFEFF?t:String.fromCharCode(0xFEFF)+t, 'text/csv'); }
function entAlAtlas(){ if(typeof atlasAgregar!=='function' || typeof resumenProyecto!=='function') return; const L=entLista(); let n=0, rep=0;
  L.forEach(e=>{ try{ const r=atlasAgregar([resumenProyecto(e.estado, entTitulo(e), false)]); n+=r.n; rep+=r.rep; }catch(err){} });
  toast(T(`Atlas: ${n} agregadas, ${rep} actualizadas`,`Atlas: ${n} added, ${rep} updated`)); }

/* ---------------- Abrir, nueva, quitar ---------------- */
function entAbrir(id){ entSync(true); const e=entLista().find(x=>x.id===id); if(!e) return;
  try{ localStorage.setItem(ENT.almacen, JSON.stringify(e.estado)); }catch(err){} S=cargar(); _guardarBase();
  $('#dlgEnt').close(); render(); scrollTo(0,0); toast(T('Entrevista abierta: ','Interview opened: ')+entTitulo(e)); }
function entNueva(){ entSync(true); const enc=entAdmin().encuestador||''; S=estadoInicial(); S.entrevista={encuestador:enc}; _guardarBase();
  $('#dlgEnt').close(); render(); scrollTo(0,0); toast(T('Entrevista nueva en blanco. Las anteriores siguen guardadas en Mis entrevistas.','New blank interview. The previous ones stay saved in My interviews.')); }
function entQuitar(id){ const L=entLista(), e=L.find(x=>x.id===id); if(!e) return;
  const aviso=e.enviada?T('¿Quitar esta entrevista de este teléfono? Ya se envió.','Remove this interview from this phone? It was already sent.'):T('Esta entrevista NO se ha enviado. Si la quitas se pierde. ¿Quitarla de todos modos?','This interview has NOT been sent. If you remove it, it is lost. Remove it anyway?');
  if(!confirm(aviso)) return; entEscribir(L.filter(x=>x.id!==id));
  if((S.entrevista||{}).id===id){ S=estadoInicial(); _guardarBase(); render(); } renderEnt(); entBoton(); }

/* ---------------- Botón de la barra y ventana ---------------- */
function entBoton(){ let b=$('#btnEnt'); const ay=$('#btnAyuda'); if(!b && ay){ b=document.createElement('button'); b.className='ibtn round ent-btn no-print'; b.id='btnEnt'; b.type='button';
    b.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 3h7l5 5v13H7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 3v5h5M10 13h6M10 17h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span class="ent-n" id="entN"></span>';
    b.onclick=()=>{ entSync(true); renderEnt(); const d=$('#dlgEnt'); if(d.showModal) d.showModal(); }; ay.parentNode.insertBefore(b, ay); }
  if(!b) return; const n=entPendientes().length; b.setAttribute('aria-label', T('Mis entrevistas','My interviews')+(n?' · '+n+' '+T('sin enviar','not sent'):'')); b.title=b.getAttribute('aria-label');
  const s=$('#entN'); if(s){ s.textContent=n||''; s.style.display=n?'':'none'; } }
function renderEnt(){ const d=$('#dlgEnt'); if(!d) return; const L=entLista(), a=entAdmin(), m=entMeta(), act=m.id, pend=entPendientes(), ofl=navigator.onLine===false;
  const sel=renderEnt.sel=renderEnt.sel||{}; L.forEach(e=>{ if(sel[e.id]==null) sel[e.id]=!e.enviada && e.origen!=='recibida'; });
  const fila=e=>{ const m2=e.estado.entrevista||{}; return `<div class="ent-it ${e.id===act?'ent-act':''}"><input type="checkbox" data-ent-sel="${e.id}" ${sel[e.id]?'checked':''} aria-label="${T('Elegir','Choose')}">
    <div class="ent-tx"><b>${esc(entTitulo(e))}</b>${e.id===act?` <span class="badge ok">${T('abierta','open')}</span>`:''}<br><span class="tiny muted">${esc(m2.encuestador||'')}${m2.encuestador?' · ':''}${esc(e.mod||e.creada||'')}</span><br>
     ${e.origen==='recibida'?`<span class="badge">${T('Recibida','Received')}</span>`:e.enviada?`<span class="badge ok">✓ ${T('Enviada','Sent')} · ${esc(e.enviada)}</span>`:`<span class="badge warn">${T('Pendiente de enviar','Not sent yet')}</span>`}</div>
    <div class="ent-ac"><button class="btn sm ghost" data-ent-abrir="${e.id}" ${e.id===act?'disabled':''}>${T('Abrir','Open')}</button><button class="btn sm ghost danger" data-ent-quitar="${e.id}" aria-label="${T('Quitar','Remove')}" title="${T('Quitar de este teléfono','Remove from this phone')}">✕</button></div></div>`; };
  const nSel=L.filter(e=>sel[e.id]).length;
  d.innerHTML=`<div class="dh"><h2>${T('Mis entrevistas','My interviews')}</h2><button class="ibtn round" onclick="this.closest('dialog').close()" aria-label="×">✕</button></div>
  <div class="db ent">
   <p class="ent-red ${ofl?'off':'on'}">${ofl?T('Sin internet. No pasa nada: todo se guarda en este teléfono y lo envías cuando tengas señal.','No internet. That is fine: everything is saved on this phone; send it when you have signal.'):T('Con internet. Todo se guarda en este teléfono hasta que lo envíes.','Online. Everything stays on this phone until you send it.')}</p>
   <div class="card"><h3>${T('Esta entrevista','This interview')}</h3>
    <div class="grid g2"><label class="f"><span>${T('Encuestador o encuestadora','Interviewer')}</span><input id="entEnc" value="${esc(m.encuestador||a.encuestador||'')}" autocomplete="name"></label>
     <label class="f"><span>${T('Código del entrevistado (sin nombre propio)','Respondent code (no personal name)')}</span><input id="entCod" value="${esc(m.codigo||'')}" placeholder="${T('p. ej. CAL-07','e.g. CAL-07')}"></label></div>
    <label class="ent-cons"><input type="checkbox" id="entCons" ${m.consentimiento?'checked':''}> ${T('La persona entrevistada dio su consentimiento informado: sabe para qué se usan sus respuestas y que puede dejar de contestar cuando quiera.','The respondent gave informed consent: they know what their answers are used for and that they can stop at any time.')}</label>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" id="entNueva">＋ ${T('Nueva entrevista','New interview')}</button></div>
    <p class="nota">${T('«Nueva entrevista» deja guardada la actual y abre una en blanco. Puedes hacer todas las que quieras sin internet.','«New interview» keeps the current one saved and opens a blank one. You can do as many as you like offline.')}</p></div>
   <div class="card"><h3>${T('Guardadas en este teléfono','Saved on this phone')} <span class="muted">(${L.length} · ${pend.length} ${T('sin enviar','not sent')})</span></h3>
    ${L.length?`<div class="ent-lista">${L.map(fila).join('')}</div>`:`<p class="sindato">${T('Aún no hay entrevistas. En cuanto captures algo, aparece aquí sola.','No interviews yet. As soon as you enter something it appears here.')}</p>`}
    ${L.length?`<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm ghost" id="entTodas">${T('Elegir pendientes','Choose pending')}</button><button class="btn sm ghost" id="entNinguna">${T('Quitar selección','Clear selection')}</button></div>`:''}</div>
   <div class="card"><h3>${T('Enviar al administrador','Send to the administrator')}</h3>
    <p>${T(`Elegidas: <b>${nSel}</b>. Se envían en un solo archivo.`,`Chosen: <b>${nSel}</b>. They go in a single file.`)}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" data-ent-canal="wa">${T('Enviar por WhatsApp','Send by WhatsApp')}</button><button class="btn" data-ent-canal="correo">${T('Enviar por correo','Send by email')}</button><button class="btn ghost" data-ent-canal="archivo">⤓ ${T('Guardar archivo en el teléfono','Save file on the phone')}</button></div>
    ${_entEspera?`<div class="ent-espera"><p>${T('Adjunta el archivo que se guardó en Descargas y envía el mensaje. Cuando lo hayas enviado:','Attach the file saved in Downloads and send the message. Once sent:')}</p><button class="btn sm" id="entYa">✓ ${T('Ya lo envié: marcar como enviadas','I sent it: mark as sent')}</button></div>`:''}
    <div class="grid g2" style="margin-top:10px"><label class="f"><span>${T('Correo del administrador','Administrator’s email')}</span><input id="entMail" type="email" inputmode="email" value="${esc(a.correo)}" placeholder="nombre@correo.com"></label>
     <label class="f"><span>${T('WhatsApp del administrador (con lada del país)','Administrator’s WhatsApp (with country code)')}</span><input id="entWa" type="tel" inputmode="tel" value="${esc(a.wa)}" placeholder="52 55 1234 5678"></label></div>
    <p class="nota">${T('En el celular se abre el menú de compartir con el archivo ya adjunto: elige WhatsApp o tu correo y luego al administrador. Si no hay señal, WhatsApp y el correo lo guardan y lo mandan solos al volver. En la computadora el archivo se descarga y se abre el correo o WhatsApp Web con el mensaje listo.','On a phone the share menu opens with the file attached: choose WhatsApp or your email, then the administrator. With no signal, WhatsApp and email keep it and send it when it returns. On a computer the file is downloaded and email or WhatsApp Web opens with the message ready.')}</p></div>
   <details class="card"><summary><b>${T('Para el administrador: recibir y analizar','For the administrator: receive and analyse')}</b></summary>
    <p>${T('Carga los archivos que te enviaron (puedes elegir varios a la vez). Luego descarga la tabla consolidada para R, Excel, SPSS o Python: una fila por entrevista, con encuestador, código, consentimiento y los indicadores de la app.','Load the files you received (several at once). Then download the consolidated table for R, Excel, SPSS or Python: one row per interview with interviewer, code, consent and the app’s indicators.')}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" id="entRec">⤒ ${T('Recibir archivos','Receive files')}</button><input type="file" id="entFile" accept=".txt,.json,text/plain,application/json" multiple hidden>
     <button class="btn ghost" id="entCsv">⤓ ${T('Tabla consolidada (CSV)','Consolidated table (CSV)')}</button><button class="btn ghost" data-ent-canal-todo="archivo">⤓ ${T('Todas en un archivo','All in one file')}</button>
     ${typeof atlasAgregar==='function'?`<button class="btn ghost" id="entAtlas">${T('Pasar todas al Atlas nacional','Send all to the national Atlas')}</button>`:''}</div></details>
  </div>`;
  const encG=()=>{ const v=$('#entEnc',d).value.trim(); entMeta().encuestador=v; const a2=entAdmin(); a2.encuestador=v; entAdminGuardar(a2); guardar(); };
  $('#entEnc',d).onchange=encG;
  $('#entCod',d).onchange=e=>{ entMeta().codigo=e.target.value.trim(); guardar(); };
  $('#entCons',d).onchange=e=>{ entMeta().consentimiento=e.target.checked; guardar(); };
  $('#entMail',d).onchange=e=>{ const a2=entAdmin(); a2.correo=e.target.value.trim(); entAdminGuardar(a2); };
  $('#entWa',d).onchange=e=>{ const a2=entAdmin(); a2.wa=e.target.value.trim(); entAdminGuardar(a2); };
  $('#entNueva',d).onclick=entNueva;
  $$('[data-ent-sel]',d).forEach(c=>c.onchange=()=>{ sel[c.dataset.entSel]=c.checked; renderEnt(); });
  if($('#entTodas',d)) $('#entTodas',d).onclick=()=>{ L.forEach(e=>sel[e.id]=!e.enviada&&e.origen!=='recibida'); renderEnt(); };
  if($('#entNinguna',d)) $('#entNinguna',d).onclick=()=>{ L.forEach(e=>sel[e.id]=false); renderEnt(); };
  $$('[data-ent-abrir]',d).forEach(b=>b.onclick=()=>entAbrir(b.dataset.entAbrir));
  $$('[data-ent-quitar]',d).forEach(b=>b.onclick=()=>entQuitar(b.dataset.entQuitar));
  $$('[data-ent-canal]',d).forEach(b=>b.onclick=()=>entEnviar(b.dataset.entCanal, L.filter(e=>sel[e.id]).map(e=>e.id)));
  $$('[data-ent-canal-todo]',d).forEach(b=>b.onclick=()=>entEnviar('archivo', L.map(e=>e.id)));
  if($('#entYa',d)) $('#entYa',d).onclick=()=>{ entMarcar(_entEspera||[]); _entEspera=null; renderEnt(); toast(T('Marcadas como enviadas','Marked as sent')); };
  const fi=$('#entFile',d); $('#entRec',d).onclick=()=>fi.click(); fi.onchange=()=>entRecibir([...fi.files]);
  $('#entCsv',d).onclick=entCSV; if($('#entAtlas',d)) $('#entAtlas',d).onclick=entAlAtlas; }
(function(){ if(!$('#dlgEnt')){ const d=document.createElement('dialog'); d.id='dlgEnt'; d.className='dlg-ent'; document.body.appendChild(d); }
  const st=document.createElement('style'); st.textContent=`.ent-btn{position:relative}.ent-btn svg{display:block;margin:auto}.ent-n{position:absolute;top:-4px;right:-4px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#c0772b;color:#fff;font:700 11px/17px system-ui,sans-serif;text-align:center}
  .dlg-ent{max-width:760px;width:calc(100% - 24px)}.ent .card{margin:10px 0}.ent-red{margin:0 0 8px;padding:8px 12px;border-radius:10px;font-size:14px}.ent-red.on{background:var(--ok-bg,#e6f2ea);color:var(--ok-text,#1f5e3f)}.ent-red.off{background:var(--warn-bg,#fbefd9);color:var(--warn-text,#7a4b10)}
  .ent-lista{display:flex;flex-direction:column;gap:8px;margin:8px 0}.ent-it{display:flex;gap:10px;align-items:flex-start;padding:10px;border:1px solid var(--border,#ddd);border-radius:12px}.ent-it.ent-act{background:color-mix(in srgb,var(--accent,#2f5d50) 8%,transparent)}.ent-it input{margin-top:5px;width:18px;height:18px}.ent-tx{flex:1;min-width:0;overflow-wrap:anywhere}.ent-ac{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.ent-cons{display:flex;gap:8px;align-items:flex-start;font-size:14px;margin-top:8px}.ent-espera{margin-top:10px;padding:10px;border:1px dashed var(--border-strong,#999);border-radius:10px}
  @media (max-width:440px){.bar-top{padding-left:6px;padding-right:6px;gap:3px}.bar-top .brand-name{font-size:.86em}}@media (max-width:380px){.bar-top .brand-name{display:none}}
  .ent-aviso{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}@media print{.ent-btn,.dlg-ent{display:none!important}}`; document.head.appendChild(st); })();
/* Aviso en Inicio cuando hay entrevistas sin enviar */
function entAvisoInicio(id, el){ if(id!=='inicio' || EJ) return; const n=entPendientes().length; if(!n) return;
  const c=document.createElement('div'); c.className='card ent-aviso no-print'; c.innerHTML=`<p style="margin:0">${T(`Tienes <b>${n}</b> ${n===1?'entrevista':'entrevistas'} sin enviar guardadas en este teléfono.`,`You have <b>${n}</b> unsent ${n===1?'interview':'interviews'} saved on this phone.`)}</p><button class="btn sm" type="button">${T('Ver y enviar','View and send')}</button>`;
  c.querySelector('button').onclick=()=>$('#btnEnt').click(); el.insertBefore(c, el.children[1]||null); }
/* Funcionar sin internet: la página se guarda en el teléfono la primera vez que se abre con señal */
(function(){ if(location.protocol!=='https:' && location.hostname!=='localhost') return;
  if(!document.querySelector('link[rel="manifest"]')){ const l=document.createElement('link'); l.rel='manifest'; l.href='manifest.webmanifest'; document.head.appendChild(l); }
  if('serviceWorker' in navigator) addEventListener('load', ()=>navigator.serviceWorker.register('sw.js').catch(()=>{})); })();
addEventListener('online', ()=>{ if($('#dlgEnt')&&$('#dlgEnt').open) renderEnt(); if(entPendientes().length) toast(T('Volvió la señal: tienes entrevistas sin enviar','Signal is back: you have unsent interviews')); });
addEventListener('offline', ()=>{ if($('#dlgEnt')&&$('#dlgEnt').open) renderEnt(); });
