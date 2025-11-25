// app.js - leitura + busca + edição via função serverless (Netlify/Vercel)
const OWNER = "HitssBusca";
const REPO = "Buscador";
const BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/data`;

let data = { operadoras: [], designacoes: [], passagem: {} };
let logged = false;

// --- Load all JSON data ---
function loadAll() {
  Promise.all([
    fetch(RAW_BASE + '/operadoras.json').then(r => r.json()),
    fetch(RAW_BASE + '/designacoes.json').then(r => r.json()),
    fetch(RAW_BASE + '/passagem.json').then(r => r.json())
  ])
    .then(([o, d, p]) => {
      data.operadoras = o;
      data.designacoes = d;
      data.passagem = p;
      renderOperadorasTable();
      renderDesignacoesTable();
      renderPassagem();
    })
    .catch(e => {
      console.error('Erro ao carregar JSON:', e);
      document.getElementById('results').innerText = 'Erro ao carregar dados. Verifique RAW_BASE e se os arquivos existem.';
    });
}

// --- Search ---
function search(q) {
  q = (q || '').toLowerCase().trim();
  if (!q) { document.getElementById('results').innerHTML = '<i>Digite termo para buscar</i>'; return; }

  const hitsOp = data.operadoras.filter(o =>
    (o.operadora || '').toLowerCase().includes(q) ||
    (o.telefone || '').toLowerCase().includes(q) ||
    (o.email || '').toLowerCase().includes(q)
  );
  if (hitsOp.length) { renderOperadorasSearch(hitsOp); return; }

  const hitsD = data.designacoes.filter(d =>
    (d.unidade || '').toLowerCase().includes(q) ||
    (d.designacoes || []).join(' ').toLowerCase().includes(q)
  );
  if (hitsD.length) { renderDesignacoesSearch(hitsD); return; }

  document.getElementById('results').innerText = 'Nenhum resultado encontrado';
}

// --- Renderers ---
function renderOperadorasSearch(list) {
  const el = document.getElementById('results');
  let html = '<table><tr><th>Operadora</th><th>Links</th><th>User</th><th>Senha</th><th>Email</th><th>Telefone</th><th>Obs</th><th>CNPJ</th></tr>';
  list.forEach(r => {
    html += `<tr><td>${r.operadora || ''}</td><td>${r.links || ''}</td><td>${r.user || ''}</td><td>${r.senha || ''}</td><td>${r.email || ''}</td><td>${r.telefone || ''}</td><td>${r.obs || ''}</td><td>${r.cnpj || ''}</td></tr>`;
  });
  html += '</table>';
  el.innerHTML = html;
}

function renderDesignacoesSearch(list) {
  const el = document.getElementById('results');
  let html = '<table><tr><th>Unidade</th><th>Operadoras</th><th>Designações</th></tr>';
  list.forEach(r => {
    html += `<tr><td>${r.unidade || ''}</td><td>${(r.operadoras || []).join(', ')}</td><td>${(r.designacoes || []).join(', ')}</td></tr>`;
  });
  html += '</table>';
  el.innerHTML = html;
}

function renderOperadorasTable() {
  const el = document.getElementById('operadorasTable');
  if (!data.operadoras.length) { el.innerHTML = '<i>Nenhuma operadora cadastrada</i>'; return; }
  let html = '<table><tr><th>Operadora</th><th>Links</th><th>User</th><th>Senha</th><th>Email</th><th>Telefone</th><th>Obs</th><th>CNPJ</th></tr>';
  data.operadoras.forEach(r => {
    html += `<tr><td>${r.operadora || ''}</td><td>${r.links || ''}</td><td>${r.user || ''}</td><td>${r.senha || ''}</td><td>${r.email || ''}</td><td>${r.telefone || ''}</td><td>${r.obs || ''}</td><td>${r.cnpj || ''}</td></tr>`;
  });
  html += '</table>';
  el.innerHTML = html;
}

function renderDesignacoesTable() {
  const el = document.getElementById('designacoesTable');
  if (!data.designacoes.length) { el.innerHTML = '<i>Nenhuma designação cadastrada</i>'; return; }
  let html = '<table><tr><th>Unidade</th><th>Operadoras</th><th>Designações</th></tr>';
  data.designacoes.forEach(r => {
    html += `<tr><td>${r.unidade || ''}</td><td>${(r.operadoras || []).join(', ')}</td><td>${(r.designacoes || []).join(', ')}</td></tr>`;
  });
  html += '</table>';
  el.innerHTML = html;
}

function renderPassagem() {
  const el = document.getElementById('passagemHtml');
  if (!data.passagem || Object.keys(data.passagem).length === 0) { el.innerHTML = '<i>Sem conteúdo de passagem</i>'; return; }
  el.innerHTML = data.passagem.html ? data.passagem.html : `<pre>${JSON.stringify(data.passagem, null, 2)}</pre>`;
}

// --- Tabs ---
document.querySelectorAll('.tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.getAttribute('data-tab');
    document.querySelectorAll('.tabcontent').forEach(s => s.classList.remove('active'));
    document.getElementById(t).classList.add('active');
  });
});

// --- Login ---
document.getElementById('btnLogin').addEventListener('click', () => {
  const u = prompt('Usuário:');
  const p = prompt('Senha:');
  if (u === 'AMBEV_NOC' && p === 'Hitss@NOC') {
    logged = true;
    alert('Login OK — modo edição liberado (front-end).');
    document.querySelectorAll('.edit-controls').forEach(e => e.classList.remove('hidden'));
  } else {
    alert('Credenciais inválidas');
  }
});

// --- Search button ---
document.getElementById('btnBuscar').addEventListener('click', () => search(document.getElementById('q').value));

// --- Save JSON ---
async function saveJson(filename, jsonContent) {
  if (!logged) { alert('Apenas usuários autenticados podem salvar.'); return; }
  try {
    const resp = await fetch('/api/update_json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath: `data/${filename}`,
        content: JSON.stringify(jsonContent)
      })
    });
    const j = await resp.json();
    if (resp.ok) {
      alert('Arquivo salvo com sucesso. Aguarde o deploy.');
      loadAll();
    } else {
      alert('Erro ao salvar: ' + (j.error || JSON.stringify(j)));
      console.error(j);
    }
  } catch (e) {
    alert('Erro na requisição de salvamento: ' + e.message);
    console.error(e);
  }
}

// --- Robust modal editor ---
function openEditor(filename, currentJson) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalOk = document.getElementById('modalOk');
  const modalCancel = document.getElementById('modalCancel');

  modalTitle.innerText = 'Editor JSON - ' + filename;
  modalBody.innerHTML = `<textarea id="editorArea" style="width:100%;height:260px;">${JSON.stringify(currentJson, null, 2)}</textarea>
                         <div id="jsonError" style="color:red; margin-top:5px;"></div>`;
  modal.classList.remove('hidden');

  const editorArea = document.getElementById('editorArea');
  const jsonError = document.getElementById('jsonError');
  modalOk.disabled = true;

  editorArea.addEventListener('input', () => {
    try {
      JSON.parse(editorArea.value);
      jsonError.innerText = '';
      modalOk.disabled = false;
    } catch (e) {
      jsonError.innerText = 'JSON inválido: ' + e.message;
      modalOk.disabled = true;
    }
  });

  modalOk.onclick = async () => {
    try {
      const parsed = JSON.parse(editorArea.value);
      modal.classList.add('hidden');
      await saveJson(filename, parsed);
    } catch (e) {
      alert('JSON inválido: ' + e.message);
    }
  };
  modalCancel.onclick = () => modal.classList.add('hidden');
}

// --- Editor buttons ---
document.getElementById('addOperadora').addEventListener('click', () => {
  const copy = [...data.operadoras];
  copy.push({ operadora: 'NOVA', links: '', user: '', senha: '', email: '', telefone: '', obs: '', cnpj: '' });
  openEditor('operadoras.json', copy);
});
document.getElementById('addDesignacao').addEventListener('click', () => {
  const copy = [...data.designacoes];
  copy.push({ unidade: 'NOVA', operadoras: [], designacoes: [] });
  openEditor('designacoes.json', copy);
});
document.getElementById('editPassagem').addEventListener('click', () => {
  openEditor('passagem.json', data.passagem);
});

// --- Initial load ---
loadAll();
