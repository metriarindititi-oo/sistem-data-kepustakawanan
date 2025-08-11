// LocalStorage-backed library data app
const ADMIN='admin', PASS='123456';
let visits = JSON.parse(localStorage.getItem('visits')||'[]');
let txs = JSON.parse(localStorage.getItem('txs')||'[]');
let currentFilter = {from:'', to:'', groupBy:'day'};

const el = id=>document.getElementById(id);
const show = e=>e.classList.remove('hidden');
const hide = e=>e.classList.add('hidden');

// Auth
el('btnLogin').addEventListener('click', ()=>{
  const u=el('user').value.trim(), p=el('pass').value;
  if(u===ADMIN && p===PASS){ hide(el('loginBox')); show(el('app')); el('loginMsg').innerText=''; persistLogged(true); refreshAll(); } else { el('loginMsg').innerText='Username atau password salah'; }
});
el('btnLogout').addEventListener('click', ()=>{ persistLogged(false); location.reload(); });

function persistLogged(val){ if(val) localStorage.setItem('logged','1'); else localStorage.removeItem('logged'); }
if(localStorage.getItem('logged')==='1'){ hide(el('loginBox')); show(el('app')); refreshAll(); } else { hide(el('app')); }

// Helpers
function fmt(d){ if(!d) return ''; const D=new Date(d); if(isNaN(D)) return d; const y=D.getFullYear(); const m=('0'+(D.getMonth()+1)).slice(-2); const day=('0'+D.getDate()).slice(-2); return `${y}-${m}-${day}`; }
function between(dateStr, from, to){ if(!dateStr) return false; const d=new Date(dateStr); if(from && new Date(from)>d) return false; if(to && new Date(to)<d) return false; return true; }

// Add visit
el('addVisit').addEventListener('click', ()=>{
  const date = el('visitDate').value || fmt(new Date());
  const gender = el('visitGender').value; const job = el('visitJob').value;
  const count = Math.max(1, parseInt(el('visitCount').value)||1);
  // store as single records for easier grouping/count
  for(let i=0;i<count;i++) visits.push({date, gender, job});
  save(); refreshVisits(); updateCharts();
});

// Add transaction
el('addTx').addEventListener('click', ()=>{
  const date = el('txDate').value || fmt(new Date());
  const type = el('txType').value; const klass = el('txClass').value;
  const count = Math.max(1, parseInt(el('txCount').value)||1);
  for(let i=0;i<count;i++) txs.push({date, type, klass});
  save(); refreshTx(); updateCharts();
});

// Save
function save(){ localStorage.setItem('visits', JSON.stringify(visits)); localStorage.setItem('txs', JSON.stringify(txs)); }

// Render tables
function refreshVisits(){ const tbody = document.querySelector('#tblVisits tbody'); tbody.innerHTML=''; const list = (currentFilter.from||currentFilter.to) ? visits.filter(v=>between(v.date, currentFilter.from, currentFilter.to)) : visits; list.forEach((v,idx)=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${v.date}</td><td>${v.gender}</td><td>${v.job}</td><td>1</td><td><button data-i="${idx}" class="delV">Hapus</button></td>`; tbody.appendChild(tr); }); document.querySelectorAll('.delV').forEach(b=>b.addEventListener('click',(ev)=>{ const i=parseInt(ev.target.dataset.i); visits.splice(i,1); save(); refreshVisits(); updateCharts(); })); }

function refreshTx(){ const tbody = document.querySelector('#tblTx tbody'); tbody.innerHTML=''; const list = (currentFilter.from||currentFilter.to) ? txs.filter(t=>between(t.date, currentFilter.from, currentFilter.to)) : txs; list.forEach((t,idx)=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${t.date}</td><td>${t.type}</td><td>${t.klass}</td><td>1</td><td><button data-i="${idx}" class="delT">Hapus</button></td>`; tbody.appendChild(tr); }); document.querySelectorAll('.delT').forEach(b=>b.addEventListener('click',(ev)=>{ const i=parseInt(ev.target.dataset.i); txs.splice(i,1); save(); refreshTx(); updateCharts(); })); }

// Filter apply/clear
el('applyFilter').addEventListener('click', ()=>{ currentFilter.from = el('filterDateFrom').value; currentFilter.to = el('filterDateTo').value; currentFilter.groupBy = el('groupBy').value; refreshAll(); });
el('clearFilter').addEventListener('click', ()=>{ currentFilter = {from:'', to:'', groupBy:'day'}; el('filterDateFrom').value=''; el('filterDateTo').value=''; el('groupBy').value='day'; refreshAll(); });

// Export CSV
el('btnExport').addEventListener('click', ()=>{
  const rows = [['type','date','gender_or_job_or_type','class_or_empty']];
  visits.forEach(v=>rows.push(['visit',v.date,`${v.gender}|${v.job}`,'']));
  txs.forEach(t=>rows.push(['tx',t.date,t.type,t.klass]));
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='kepustakawanan_export.csv'; document.body.appendChild(a); a.click(); a.remove();
});

// Import CSV
el('btnImportToggle').addEventListener('click', ()=>el('fileImport').click());
el('fileImport').addEventListener('change', (e)=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=function(evt){ const lines=evt.target.result.split(/\\r?\\n/).map(l=>l.trim()).filter(Boolean); for(let i=1;i<lines.length;i++){ const cols = lines[i].split(','); const type = cols[0].replace(/"/g,''); const date = cols[1].replace(/"/g,''); const rest = cols[2].replace(/"/g,''); if(type==='visit'){ const [gender,job]=rest.split('|'); visits.push({date,gender,job}); } if(type==='tx'){ const typeTx = rest.replace(/"/g,''); const klass = cols[3] ? cols[3].replace(/"/g,'') : ''; txs.push({date,type:typeTx,klass}); } } save(); refreshAll(); alert('Import selesai'); el('fileImport').value=''; }; r.readAsText(f); });

// Print
el('btnPrint').addEventListener('click', ()=>window.print());

// Charts
let chartV, chartT;
function updateCharts(){
  // Visits by job
  const byJob={}; visits.filter(v=>between(v.date,currentFilter.from,currentFilter.to)).forEach(v=>byJob[v.job]=(byJob[v.job]||0)+1);
  const ctxV = document.getElementById('chartVisits').getContext('2d');
  if(chartV) chartV.destroy();
  chartV = new Chart(ctxV,{type:'bar',data:{labels:Object.keys(byJob),datasets:[{label:'Kunjungan',data:Object.values(byJob)}]}});

  // Loans by class (only Peminjaman)
  const byClass={}; txs.filter(t=>t.type==='Peminjaman' && between(t.date,currentFilter.from,currentFilter.to)).forEach(t=>byClass[t.klass]=(byClass[t.klass]||0)+1);
  const ctxT = document.getElementById('chartTx').getContext('2d');
  if(chartT) chartT.destroy();
  chartT = new Chart(ctxT,{type:'bar',data:{labels:Object.keys(byClass),datasets:[{label:'Peminjaman',data:Object.values(byClass)}]}});
}

// Refresh all UI
function refreshAll(){ refreshVisits(); refreshTx(); updateCharts(); save(); }

// Init UI if logged
if(localStorage.getItem('logged')==='1'){ hide(el('loginBox')); show(el('app')); refreshAll(); } else { hide(el('app')); }
