// app.js - leitura + busca + edição via função serverless (Netlify/Vercel)
// CONFIG: atualize OWNER/REPO/BRANCH se for ler direto do raw.githubusercontent
const OWNER = "HitssBusca"; // substitua se necessário
const REPO = "Buscador";
const BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/data`;

let data = { operadoras: [], designacoes: [], passagem: {} };
let logged = false;

// load data
async function loadAll(){
  try{
    const o = await fetch(RAW_BASE + '/operadoras.json').then(r=>r.json());
    const d = await fetch(RAW_BASE + '/designacoes.json').then(r=>r.json());
    const p = await fetch(RAW_BASE + '/passagem.json').then(r=>r.json());
    data.operadoras = o; data.designacoes = d; data.passagem = p;
    renderOperadorasTable();
    renderDesignacoesTable();
    renderPassagem();
  }catch(e){
    console.error('Erro ao carregar JSON:', e);
    document.getElementById('results').innerText = 'Erro ao carregar dados. Verifique RAW_BASE e se os arquivos existem.';
  }
}

// Search
function search(q){
  q = (q||'').toLowerCase().trim();
  if(!q){ document.getElementById('results').innerHTML = '<i>Digite termo para buscar</i>'; return; }
  const hitsOp = data.operadoras.filter(o =>
    (o.operadora||'').toLowerCase().includes(q) ||
    (o.telefone||'').toLowerCase().includes(q) ||
    (o.email||'').toLowerCase().includes(q)
  );
  if(hitsOp.length){
    renderOperadorasSearch(hitsOp);
    return;
  }
  const hitsD = data.designacoes.filter(d =>
    (d.unidade||'').toLowerCase().includes(q) ||
    (d.designacoes||[]).join(' ').toLowerCase().includes(q)
  );
  if(hitsD.length){
    renderDesignacoesSearch(hitsD);
    return;
  }
  document.getElementById('results').innerText = 'Nenhum resultado encontrado';
}

// renderers
function renderOperadorasSearch(list){
  const el = document.getElementById('results');
  let html = '<table><tr><th>Operadora</th><th>Links</th><th>User</th><th>Senha</th><th>Email</th><th>Telefone</th><th>Obs</th><th>CNPJ</th></tr>';
  list.forEach(r=>{
    html += `<tr><td>${r.operadora||''}</td><td>${r.links||''}</td><td>${r.user||''}</td><td>${r.senha||''}</td><td>${r.email||''}</td><td>${r.telefone||''}</td><td>${r.obs||''}</td><td>${r.cnpj||''}</td></tr>`;
  });
  html += '</table>';
  el.innerHTML = html;
}

function renderDesignacoesSearch(list){
  const el = document.getElementById('results');
  let html = '<table><tr><th>Unidade</th><th>Operadoras</th><th>Designações</th></tr>';
  list.forEach(r=>{
    html += `<tr><td>${r.unidade||''}</td><td>${(r.operadoras||[]).join(', ')}</td><td>${(r.designacoes||[]).join(', ')}</td></tr>`;
  });
  html += '</table>';
  el.innerHTML = html;
}

function renderOperadorasTable(){
  const el = document.getElementById('operadorasTable');
  if(!data.operadoras.length){ el.innerHTML = '<i>Nenhuma operadora cadastrada</i>'; return; }
  let html = '<table><tr><th>Operadora</th><th>Links</th><th>User</th><th>Senha</th><th>Email</th><th>Telefone</th><th>Obs</th><th>CNPJ</th></tr>';
  data.operadoras.forEach(r=>{
    html += `<tr><td>${r.operadora||''}</td><td>${r.links||''}</td><td>${r.user||''}</td><td>${r.senha||''}</td><td>${r.email||''}</td><td>${r.telefone||''}</td><td>${r.obs||''}</td><td>${r.cnpj||''}</td></tr>`;
  });
  html += '</table>';
  el.innerHTML = html;
}

function renderDesignacoesTable(){
  const el = document.getElementById('designacoesTable');
  if(!data.designacoes.length){ el.innerHTML = '<i>Nenhuma designação cadastrada</i>'; return; }
  let html = '<table><tr><th>Unidade</th><th>Operadoras</th><th>Designações</th></tr>';
  data.designacoes.forEach(r=>{
    html += `<tr><td>${r.unidade||''}</td><td>${(r.operadoras||[]).join(', ')}</td><td>${(r.designacoes||[]).join(', ')}</td></tr>`;
  });
  html += '</table>';
  el.innerHTML = html;
}

function renderPassagem(){
  const el = document.getElementById('passagemHtml');
  if(!data.passagem || Object.keys(data.passagem).length===0){ el.innerHTML = '<i>Sem conteúdo de passagem</i>'; return; }
  // if passagem contains html, show it; otherwise show JSON pretty
  if(data.passagem.html) el.innerHTML = data.passagem.html;
  else el.innerHTML = `<pre>${JSON.stringify(data.passagem, null, 2)}</pre>`;
}

// basic tab handling
document.querySelectorAll('.tabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.getAttribute('data-tab');
    document.querySelectorAll('.tabcontent').forEach(s=>s.classList.remove('active'));
    document.getElementById(t).classList.add('active');
  });
});

// login (front-end gate)
document.getElementById('btnLogin').addEventListener('click', ()=>{
  const u = prompt('Usuário:');
  const p = prompt('Senha:');
  if(u === 'AMBEV_NOC' && p === 'Hitss@NOC'){
    logged = true;
    alert('Login OK — modo edição liberado (front-end).');
    document.querySelectorAll('.edit-controls').forEach(e => e.classList.remove('hidden'));
  }else{
    alert('Credenciais inválidas');
  }
});

// search button
document.getElementById('btnBuscar').addEventListener('click', ()=> search(document.getElementById('q').value));

// Simple editor flow (opens modal with JSON and calls serverless)
function openEditor(filename, currentJson){
  const modal = document.getElementById('modal');
  document.getElementById('modalTitle').innerText = 'Editor JSON - ' + filename;
  document.getElementById('modalBody').innerHTML = `<textarea id="editorArea" style="width:100%;height:260px;">${JSON.stringify(currentJson, null, 2)}</textarea>`;
  modal.classList.remove('hidden');
  document.getElementById('modalOk').onclick = async ()=>{
    const newText = document.getElementById('editorArea').value;
    let parsed;
    try{ parsed = JSON.parse(newText); }catch(e){ alert('JSON inválido: ' + e.message); return; }
    modal.classList.add('hidden');
    // call serverless
    await saveJson(filename, parsed);
  };
  document.getElementById('modalCancel').onclick = ()=> modal.classList.add('hidden');
}

// saveJson - calls the serverless function to update the JSON in the repo
async function saveJson(filename, jsonContent){
  if(!logged){ alert('Apenas usuários autenticados podem salvar.'); return; }
  try{
    const resp = await fetch('/.netlify/functions/update_json', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ filePath: `data/${filename}`, content: JSON.stringify(jsonContent) })
    });
    const j = await resp.json();
    if(resp.ok) {
      alert('Arquivo salvo com sucesso. Aguarde o deploy do GitHub Pages (pode levar alguns segundos).');
      // reload data
      await loadAll();
    } else {
      alert('Erro ao salvar: ' + (j.message || JSON.stringify(j)));
      console.error(j);
    }
  }catch(e){
    alert('Erro na requisição de salvamento: ' + e.message);
    console.error(e);
  }
}

// attach editor buttons
document.getElementById('addOperadora').addEventListener('click', ()=> {
  const copy = [...data.operadoras];
  copy.push({operadora:'NOVA', links:'', user:'', senha:'', email:'', telefone:'', obs:'', cnpj:''});
  openEditor('operadoras.json', copy);
});
document.getElementById('addDesignacao').addEventListener('click', ()=>{
  const copy = [...data.designacoes];
  copy.push({unidade:'NOVA', operadoras:[], designacoes:[]});
  openEditor('designacoes.json', copy);
});
document.getElementById('editPassagem').addEventListener('click', ()=> {
  openEditor('passagem.json', data.passagem);
});

// initial load
loadAll();
