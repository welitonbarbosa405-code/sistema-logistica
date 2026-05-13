// ------- Config -------
const PAGE_SIZE = 50;

// ------- State -------
let state = {
  data: [],
  page: 1,
  sortKey: 'cidade',
  sortDir: 'asc',
  filtroCidade: '',
  filtroUF: '',
  filtroTransp: ''
};

// ------- Helpers -------
const el  = (id)  => document.getElementById(id);
const show= (n)   => n.classList.remove('hidden');
const hide= (n)   => n.classList.add('hidden');
const deb = (fn,ms=300)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms);}};

async function fetchJSON(url, opts){
  const r = await fetch(url, opts);
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

// ------- Filters load -------
async function loadFilters(){
  const [ufs, transps] = await Promise.all([
    fetchJSON('/api/cidades-ufs'),
    fetchJSON('/api/cidades-transportadoras'),
  ]);
  el('selUF').innerHTML = '<option value="">Todas</option>' + ufs.map(u=>`<option>${u}</option>`).join('');
  el('selTransp').innerHTML = '<option value="">Todas</option>' + transps.map(t=>`<option>${t}</option>`).join('');
}

// ------- Data query -------
async function queryData(){
  const q = new URLSearchParams();
  if (state.filtroUF) q.append('uf', state.filtroUF);
  if (state.filtroTransp) q.append('transportadora', state.filtroTransp);

  show(el('loading'));
  try{
    const rows = await fetchJSON('/api/cidades-atendidas?' + q.toString());
    // normaliza chaves vindas do backend
    const norm = rows.map(r => ({
      transportadora: r.transportadora ?? '',
      cidade_origem: r.cidade_origem ?? '',
      cidade: (r.cidade ?? r.cidade_destino ?? ''),
      estado: (r.estado ?? r.estado_atendido ?? ''),
      prazo: (r.prazo ?? r.prazo_entrega ?? ''),
      pais: (r.pais ?? r.País ?? ''),
    }));
    // filtro por cidade (front)
    const filtro = (state.filtroCidade || '').toUpperCase();
    state.data = norm.filter(r => !filtro || r.cidade.toUpperCase().includes(filtro));

    applySort();
    updateKPIs();
    state.page = 1;
    renderPage();
  } finally {
    hide(el('loading'));
  }
}

// ------- Sort / Render -------
function applySort(){
  const {sortKey, sortDir} = state;
  const dir = sortDir === 'asc' ? 1 : -1;
  state.data.sort((a,b) => (a[sortKey] ?? '').toString().localeCompare((b[sortKey] ?? '').toString(), 'pt-BR') * dir);
}

function renderPage(){
  const start = (state.page - 1) * PAGE_SIZE;
  const pageData = state.data.slice(start, start + PAGE_SIZE);

  el('lblTotal').textContent = state.data.length;
  el('lblFrom').textContent  = pageData.length ? (start + 1) : 0;
  el('lblTo').textContent    = start + pageData.length;

  const tb = el('tbRows');
  tb.innerHTML = pageData.map(r => `
    <tr class="border-b border-kuhn-gray hover:bg-kuhn-gray transition-colors">
      <td class="py-2 px-4"><span class="font-medium text-kuhn-navy">${r.transportadora}</span></td>
      <td class="py-2 px-4 text-kuhn-navy">${r.cidade_origem}</td>
      <td class="py-2 px-4 text-kuhn-navy">${r.cidade}</td>
      <td class="py-2 px-4">
        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-kuhn-gold-light text-kuhn-navy">
          ${r.estado}
        </span>
      </td>
      <td class="py-2 px-4">${renderPrazo(r.prazo)}</td>
      <td class="py-2 px-4 text-kuhn-navy">${r.pais}</td>
    </tr>
  `).join('');
}

function renderPrazo(p){
  if (p == null || p === '') return '';
  const n = parseInt(p, 10);
  let badge = 'bg-green-100 text-green-800';   // <=5
  if (n > 8) badge = 'bg-kuhn-red-light text-kuhn-navy';
  else if (n > 5) badge = 'bg-kuhn-gold-light text-kuhn-navy';
  return `<span class="px-2 py-0.5 rounded text-xs font-medium ${badge}">${n} dias</span>`;
}

// ------- KPIs -------
function updateKPIs(){
  const total = state.data.length;
  const transp = new Set(state.data.map(r => r.transportadora)).size;
  const estados = new Set(state.data.map(r => r.estado)).size;
  const prazos = state.data.map(r => parseInt(r.prazo,10)).filter(Number.isFinite);
  const media = prazos.length ? (prazos.reduce((a,b)=>a+b,0) / prazos.length) : 0;
  
  // Animar números com efeito de contagem
  animateNumber('kpiTotal', total);
  animateNumber('kpiTransp', transp);
  animateNumber('kpiEstados', estados);
  
  // Prazo médio com decimais
  const prazoEl = el('kpiPrazo');
  if (prazoEl) {
    prazoEl.textContent = media ? media.toFixed(1) : '—';
    prazoEl.classList.add('animate-pulse');
    setTimeout(() => prazoEl.classList.remove('animate-pulse'), 1000);
  }
}

function animateNumber(elementId, targetValue) {
  const element = el(elementId);
  if (!element) return;
  
  const startValue = 0;
  const duration = 1000;
  const startTime = performance.now();
  
  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
    
    element.textContent = currentValue.toLocaleString('pt-BR');
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    } else {
      element.textContent = targetValue.toLocaleString('pt-BR');
    }
  }
  
  requestAnimationFrame(updateNumber);
}

// ------- Events -------
el('btnPrev').addEventListener('click', () => { if (state.page > 1){ state.page--; renderPage(); }});
el('btnNext').addEventListener('click', () => {
  const last = Math.ceil(state.data.length / PAGE_SIZE);
  if (state.page < last){ state.page++; renderPage(); }
});
el('btnBuscar').addEventListener('click', queryData);

el('selUF').addEventListener('change', () => { state.filtroUF = el('selUF').value; queryData(); });
el('selTransp').addEventListener('change', () => { state.filtroTransp = el('selTransp').value; queryData(); });
el('inpCidade').addEventListener('input', deb(() => {
  state.filtroCidade = el('inpCidade').value;
  // refiltra localmente sem refetch
  const filtro = (state.filtroCidade || '').toUpperCase();
  state.page = 1;
  state.data = state.data.filter(r => !filtro || r.cidade.toUpperCase().includes(filtro));
  renderPage();
}, 350));

// Ordenação por cabeçalho
document.querySelectorAll('.th-sort').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.key;
    if (state.sortKey === key) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortKey = key;
      state.sortDir = 'asc';
    }
    applySort();
    state.page = 1;
    renderPage();
  });
});

// Importar (opcional – admin)
const btnImport = document.getElementById('btnImport');
if (btnImport) {
  btnImport.addEventListener('click', async () => {
    try {
      el('importMsg').textContent = '';
      document.getElementById('icnSpin').style.display = 'inline-block';
      const r = await fetch('/api/cidades/import', { method: 'POST' });
      const d = await r.json();
      el('importMsg').textContent = `✅ ${d.inserted ?? 0} inseridos, ${d.skipped ?? 0} ignorados.`;
      await loadFilters();
      await queryData();
    } catch (e) {
      el('importMsg').textContent = 'Erro ao importar.';
    } finally {
      document.getElementById('icnSpin').style.display = 'none';
    }
  });
}

// ------- Última atualização -------
function atualizarTimestamp() {
  const agora = new Date();
  const timestamp = agora.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const elTimestamp = document.getElementById('ultimaAtualizacao');
  if (elTimestamp) {
    elTimestamp.textContent = `Última atualização: ${timestamp}`;
  }
}

// ------- Boot -------
(async function init(){
  await loadFilters();
  await queryData();
  atualizarTimestamp();
  
  // Atualizar timestamp a cada 30 segundos
  setInterval(atualizarTimestamp, 30000);
})();