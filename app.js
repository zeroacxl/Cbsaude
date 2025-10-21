import { getData, setData } from "./firebase-init.js";

let usuarioLogado = null;
let deps = [];
let associados = [];

// Elementos
const loginScreen = document.getElementById("loginScreen");
const mainApp = document.getElementById("mainApp");
const userInput = document.getElementById("userInput");
const passInput = document.getElementById("passInput");
const btnEntrar = document.getElementById("btnEntrar");
const formAssociado = document.getElementById("formAssociado");
const editIndex = document.getElementById("editIndex");
const depsList = document.getElementById("depsList");
const resumoContent = document.getElementById("resumoContent");
const modalPesquisa = document.getElementById("modalPesquisa");
const searchModalInput = document.getElementById("searchModalInput");
const modalResults = document.getElementById("modalResults");

// Funções de utilidade
function formatarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.charAt(10));
}

// Login
btnEntrar.addEventListener("click", async () => {
  const u = userInput.value.trim();
  const p = passInput.value.trim();
  if (!u || !p) return alert("Preencha usuário e senha");

  btnEntrar.disabled = true;
  btnEntrar.textContent = "Entrando...";

  try {
    const funcs = await getData("funcionarios");
    console.log("Funcionários:", funcs);
    const user = funcs.find(f => f.user === u && f.pass === p);

    if (user) {
      usuarioLogado = user;
      loginScreen.classList.add("hidden");
      mainApp.classList.remove("hidden");
      carregaAssociados();
    } else {
      alert("Usuário ou senha inválidos");
      passInput.value = "";
      passInput.focus();
    }
  } catch (error) {
    console.error("Erro no login:", error);
    alert("Erro ao conectar ao servidor. Verifique sua internet ou as configurações do Firebase.");
  }

  btnEntrar.disabled = false;
  btnEntrar.textContent = "Entrar";
});

// Carrega associados
async function carregaAssociados() {
  associados = await getData("associados");
}

// Salvar associado
formAssociado.addEventListener("submit", async (e) => {
  e.preventDefault();
  const idx = editIndex.value;
  const associado = {
    nome: document.getElementById("nome").value.trim(),
    cpf: document.getElementById("cpf").value.trim(),
    pasta: document.getElementById("pasta").value.trim(),
    matricula: document.getElementById("matricula").value.trim(),
    nasc: document.getElementById("nasc").value,
    dataAssociacao: document.getElementById("dataAssociacao").value,
    sexo: document.getElementById("sexo").value,
    civil: document.getElementById("civil").value,
    endereco: document.getElementById("endereco").value.trim(),
    numero: document.getElementById("numero").value.trim(),
    bairro: document.getElementById("bairro").value.trim(),
    municipio: document.getElementById("municipio").value.trim(),
    estado: document.getElementById("estado").value.trim(),
    cep: document.getElementById("cep").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    email: document.getElementById("email").value.trim(),
    plano: document.getElementById("plano").value,
    obs: document.getElementById("obs").value.trim(),
    dependentes: deps,
    conjuge: {
      nome: document.getElementById("conjNome").value.trim(),
      cpf: document.getElementById("conjCpf").value.trim(),
      nasc: document.getElementById("conjNasc").value,
      plano: document.getElementById("conjPlano").value
    }
  };

  if (!associado.nome || !associado.cpf) return alert("Nome e CPF são obrigatórios");
  if (!validarCPF(associado.cpf)) return alert("CPF inválido");

  associados[idx ? parseInt(idx) : associados.length] = associado;
  await setData("associados", associados);
  alert("Salvo com sucesso");
  formAssociado.reset();
  editIndex.value = "";
  deps = [];
  renderDeps();
});

// Dependentes
document.getElementById("btnAddDep").addEventListener("click", () => {
  deps.push({ nome: "", parent: "", nasc: "", cpf: "", plano: "" });
  renderDeps();
});

function renderDeps() {
  depsList.innerHTML = "";
  deps.forEach((d, i) => {
    depsList.insertAdjacentHTML("beforeend", `
      <div class="row">
        <div class="col"><label for="depNome${i}">Nome</label><input id="depNome${i}" value="${d.nome || ''}" oninput="deps[${i}].nome=this.value"></div>
        <div class="col"><label for="depParent${i}">Parentesco</label><input id="depParent${i}" value="${d.parent || ''}" oninput="deps[${i}].parent=this.value"></div>
        <div class="col"><label for="depNasc${i}">Nasc.</label><input type="date" id="depNasc${i}" value="${d.nasc || ''}" oninput="deps[${i}].nasc=this.value"></div>
        <div class="col"><label for="depCpf${i}">CPF</label><input id="depCpf${i}" value="${d.cpf || ''}" oninput="deps[${i}].cpf=this.value"></div>
        <div class="col"><label for="depPlano${i}">Plano</label>
          <select id="depPlano${i}" onchange="deps[${i}].plano=this.value">
            <option value="" ${!d.plano ? 'selected' : ''}>Nenhum</option>
            <option value="224" ${d.plano === '224' ? 'selected' : ''}>Alfa (224)</option>
            <option value="226" ${d.plano === '226' ? 'selected' : ''}>Bravo (226)</option>
            <option value="228" ${d.plano === '228' ? 'selected' : ''}>Delta (228)</option>
          </select>
        </div>
        <div class="col"><button type="button" class="btn-top btn-danger" onclick="deps.splice(${i},1); renderDeps()">Remover</button></div>
      </div>
    `);
  });
}

// Abas
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tabContent").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
    if (tab.dataset.tab === "resumo") buildResumo();
  });
});

// Resumo
function buildResumo() {
  const idx = editIndex.value;
  if (!idx) {
    resumoContent.innerHTML = "<p>Selecione ou crie um cooperado.</p>";
    return;
  }

  const a = associados[parseInt(idx)];
  if (!a) return;

  let total = 0;
  const valorTit = { '224': 20, '226': 115, '228': 155 }[a.plano] || 0;
  total += valorTit;

  let html = `
    <div class="resumo-block">
      <h3>Titular</h3>
      <div class="resumo-line"><span>Nome:</span><span>${a.nome || '—'}</span></div>
      <div class="resumo-line"><span>CPF:</span><span>${a.cpf || '—'}</span></div>
      <div class="resumo-line"><span>Plano:</span><span>${a.plano || '—'} - R$ ${valorTit.toFixed(2)}</span></div>
    </div>
  `;

  if (a.dependentes?.length) {
    html += '<h3>Dependentes</h3>';
    a.dependentes.forEach(d => {
      const v = { '224': 20, '226': 115, '228': 155 }[d.plano] || 0;
      total += v;
      html += `<div class="resumo-line"><span>${d.nome || '—'} (${d.parent || '—'})</span><span>R$ ${v.toFixed(2)}</span></div>`;
    });
  }

  if (a.conjuge?.nome) {
    const v = { '224': 20, '226': 115, '228': 155 }[a.conjuge.plano] || 0;
    total += v;
    html += `<div class="resumo-line"><span>Cônjuge: ${a.conjuge.nome || '—'}</span><span>R$ ${v.toFixed(2)}</span></div>`;
  }

  html += `<div class="total">Total Mensal: R$ ${total.toFixed(2)}</div>`;
  resumoContent.innerHTML = html;
}

// PDF
document.getElementById("btnPDF").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("CBSaúde Cooperados - Resumo", 14, 22);
  const lines = resumoContent.innerText.split('\n');
  lines.forEach((line, i) => doc.text(line, 14, 30 + i * 6));
  doc.save("resumo-cbsaude.pdf");
});

// Pesquisa
document.getElementById("btnPesquisar").addEventListener("click", async () => {
  modalPesquisa.classList.add("active");
  await carregaAssociados();
  filtrarModal();
});

function fecharPesquisa() {
  modalPesquisa.classList.remove("active");
}

function filtrarModal() {
  const term = searchModalInput.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = associados.filter(a => {
    const nome = a.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cpf = a.cpf.replace(/\D/g, '');
    return nome.includes(term) || cpf.includes(term.replace(/\D/g, ''));
  });

  modalResults.innerHTML = filtered.length
    ? filtered.map((a, idx) => `
        <div class="list-item" onclick="editAssociado(${associados.indexOf(a)})">
          <span>${a.nome || '—'}</span>
          <small>CPF: ${a.cpf || '—'} | Pasta: ${a.pasta || '—'}</small>
        </div>
      `).join('')
    : '<p>Nenhum resultado.</p>';
}

function editAssociado(idx) {
  const a = associados[idx];
  if (!a) return;
  editIndex.value = idx;
  Object.keys(a).forEach(k => {
    const el = document.getElementById(k);
    if (el) el.value = a[k] || '';
  });
  deps = a.dependentes || [];
  renderDeps();
  if (a.conjuge) {
    document.getElementById("conjNome").value = a.conjuge.nome || '';
    document.getElementById("conjCpf").value = a.conjuge.cpf || '';
    document.getElementById("conjNasc").value = a.conjuge.nasc || '';
    document.getElementById("conjPlano").value = a.conjuge.plano || '';
  }
  fecharPesquisa();
  document.querySelector('[data-tab="dados"]').click();
}

// Logout
document.getElementById("btnSair").addEventListener("click", () => {
  if (confirm("Deseja sair?")) {
    usuarioLogado = null;
    mainApp.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    formAssociado.reset();
    editIndex.value = "";
    deps = [];
    renderDeps();
  }
});

// Inicialização
window.addEventListener("DOMContentLoaded", async () => {
  userInput.focus();
  const funcs = await getData("funcionarios");
  if (!funcs.length) {
    await setData("funcionarios", [{ nome: "Administrador", user: "admin", pass: "1234", admin: true }]);
    console.log("Admin criado com sucesso");
  }
  associados = await getData("associados");
});